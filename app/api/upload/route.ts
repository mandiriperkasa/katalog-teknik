import { NextRequest, NextResponse } from 'next/server';

import cloudinary from '@/lib/cloudinary';
import { isAdminAuthenticated } from '@/lib/require-admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 3 * 1024 * 1024;
const MAX_HERO_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MANAGED_PUBLIC_ID_PREFIXES = [
  'katalog-teknik/products/',
  'katalog-teknik/gallery/',
  'katalog-teknik/hero/',
  'katalog-teknik/logos/',
  'katalog-teknik/partners/',
  'katalog-teknik/banners/',
];

function isManagedPublicId(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const publicId = value.trim();
  return (
    publicId.length > 0 &&
    publicId.length <= 500 &&
    !publicId.includes('..') &&
    MANAGED_PUBLIC_ID_PREFIXES.some((prefix) => publicId.startsWith(prefix))
  );
}

export async function POST(request: NextRequest) {
  // 1. Cek login admin
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      {
        message: 'Tidak memiliki akses.',
      },
      {
        status: 401,
      },
    );
  }

  try {
    // 2. Ambil file dari form-data
    const formData = await request.formData();
    const requestedFolder = formData.get('folder');
    const uploadKind =
      requestedFolder === 'gallery' ||
      requestedFolder === 'hero' ||
      requestedFolder === 'logos' ||
      requestedFolder === 'banners'
        ? requestedFolder
        : 'products';
    const folder = `katalog-teknik/${uploadKind}`;
    const isLargeFormatUpload = uploadKind === 'hero' || uploadKind === 'banners';

    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          message: 'File gambar tidak ditemukan.',
        },
        {
          status: 400,
        },
      );
    }

    // 3. Validasi tipe file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          message: 'Format gambar harus JPG, PNG, atau WEBP.',
        },
        {
          status: 400,
        },
      );
    }

    // 4. Validasi ukuran
    const maximumFileSize = isLargeFormatUpload ? MAX_HERO_FILE_SIZE : MAX_FILE_SIZE;

    if (file.size > maximumFileSize) {
      return NextResponse.json(
        {
          message: `Ukuran gambar maksimal ${isLargeFormatUpload ? '10MB' : '3MB'}.`,
        },
        {
          status: 400,
        },
      );
    }

    // 5. Convert file menjadi buffer
    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    // 6. Upload ke Cloudinary
    const result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: 'image',
            ...(isLargeFormatUpload
              ? {}
              : {
                  transformation: [
                    {
                      width: 1200,
                      height: 1200,
                      crop: 'limit',
                      quality: 'auto',
                      fetch_format: 'auto',
                    },
                  ],
                }),
          },

          (error, uploadResult) => {
            if (error) {
              reject(error);
              return;
            }

            if (!uploadResult?.secure_url || !uploadResult?.public_id) {
              reject(new Error('Data Cloudinary tidak lengkap.'));
              return;
            }

            resolve({
              secure_url: uploadResult.secure_url,

              public_id: uploadResult.public_id,
            });
          },
        )
        .end(buffer);
    });

    return NextResponse.json({
      success: true,

      url: result.secure_url,

      publicId: result.public_id,
    });
  } catch (error) {
    console.error('Upload gambar gagal:', error);

    return NextResponse.json(
      {
        message: 'Gagal mengupload gambar.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ message: 'Tidak memiliki akses.' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { publicIds?: unknown };
    const requestedIds = Array.isArray(body.publicIds) ? body.publicIds : [];
    const publicIds = Array.from(new Set(requestedIds.filter(isManagedPublicId))).slice(0, 10);

    if (publicIds.length === 0) {
      return NextResponse.json({ message: 'Aset Cloudinary tidak valid.' }, { status: 400 });
    }

    const results = await Promise.allSettled(
      publicIds.map((publicId) =>
        cloudinary.uploader.destroy(publicId, {
          invalidate: true,
          resource_type: 'image',
        }),
      ),
    );
    const failed = results.filter((result) => result.status === 'rejected').length;

    if (failed > 0) {
      console.error(`Gagal membersihkan ${failed} dari ${publicIds.length} aset Cloudinary.`);
    }

    return NextResponse.json({
      success: failed === 0,
      deleted: publicIds.length - failed,
      failed,
    });
  } catch (error) {
    console.error('Cleanup upload Cloudinary gagal:', error);
    return NextResponse.json({ message: 'Gagal membersihkan upload.' }, { status: 500 });
  }
}
