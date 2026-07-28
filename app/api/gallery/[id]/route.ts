import { NextRequest, NextResponse } from 'next/server';

import { getDatabase } from '@/lib/database/neon';
import { galleryPayloadSchema } from '@/lib/gallery-payload';
import { isAdminAuthenticated } from '@/lib/require-admin';
import cloudinary from '@/lib/cloudinary';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// GET DETAIL GALLERY
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const sql = getDatabase();

    const rows = (await sql`
SELECT
  id,
  title,
  category,
  location,
  description,
  media_type AS "mediaType",
  youtube_video_id AS "youtubeVideoId",
  image_url AS "imageUrl",
  image_public_id AS "imagePublicId",
  sort_order AS "sortOrder",
  created_at AS "createdAt",
  updated_at AS "updatedAt"
  FROM gallery
  WHERE id = ${id}
  LIMIT 1
`) as Array<{
      id: string;
      title: string;
      category: string;
      location: string;
      description: string | null;
      mediaType: 'image' | 'youtube';
      youtubeVideoId: string | null;
      imageUrl: string | null;
      imagePublicId: string | null;
      sortOrder: number;
      createdAt: string;
      updatedAt: string;
    }>;

    if (rows.length === 0) {
      return NextResponse.json(
        {
          message: 'Gallery tidak ditemukan.',
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Gagal mengambil detail gallery:', error);

    return NextResponse.json(
      {
        message: 'Gagal mengambil detail gallery.',
      },
      {
        status: 500,
      },
    );
  }
}

// DELETE GALLERY
export async function DELETE(_request: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;

    const sql = getDatabase();

    const rows = (await sql`
  SELECT
    image_public_id
  FROM gallery
  WHERE id = ${id}
  LIMIT 1
`) as unknown as Array<{
      image_public_id: string | null;
    }>;

    const gallery = rows[0];

    await sql`
      DELETE FROM gallery
      WHERE id = ${id}
    `;

    if (gallery?.image_public_id) {
      try {
        await cloudinary.uploader.destroy(gallery.image_public_id, {
          invalidate: true,
          resource_type: 'image',
        });
      } catch (deleteError) {
        console.error('Gagal menghapus gambar gallery dari Cloudinary:', deleteError);
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Gagal menghapus gallery:', error);

    return NextResponse.json(
      {
        message: 'Gagal menghapus gallery.',
      },
      {
        status: 500,
      },
    );
  }
}

// UPDATE GALLERY
export async function PUT(request: NextRequest, context: RouteContext) {
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
    const { id } = await context.params;

    const body = await request.json();
    const parsed = galleryPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message || 'Data gallery tidak valid.',
        },
        {
          status: 400,
        },
      );
    }

    const data = parsed.data;
    const sql = getDatabase();
    const existingRows = (await sql`
      SELECT image_public_id
      FROM gallery
      WHERE id = ${id}
      LIMIT 1
    `) as unknown as Array<{
      image_public_id: string | null;
    }>;

    const oldImagePublicId = existingRows[0]?.image_public_id ?? null;

    const updatedRows = (await sql`
      UPDATE gallery
      SET
        title = ${data.title},
        category = ${data.category},
        location = ${data.location},
        description = ${data.description},
        media_type = ${data.mediaType},
        youtube_video_id =
          ${data.mediaType === 'youtube' ? data.youtubeVideoId || null : null},
        image_url =
          ${data.mediaType === 'image' ? data.imageUrl || null : null},
        image_public_id =
          ${data.mediaType === 'image' ? data.imagePublicId || null : null},
        sort_order = ${data.sortOrder},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING id
    `) as unknown as Array<{ id: string }>;

    if (updatedRows.length === 0) {
      return NextResponse.json({ message: 'Gallery tidak ditemukan.' }, { status: 404 });
    }

    if (
      oldImagePublicId &&
      oldImagePublicId !== (data.mediaType === 'image' ? data.imagePublicId || null : null)
    ) {
      try {
        await cloudinary.uploader.destroy(oldImagePublicId, {
          invalidate: true,
          resource_type: 'image',
        });
      } catch (deleteError) {
        console.error('Gagal menghapus gambar gallery lama:', deleteError);
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Gagal memperbarui gallery:', error);

    return NextResponse.json(
      {
        message: 'Gagal memperbarui gallery.',
      },
      {
        status: 500,
      },
    );
  }
}
