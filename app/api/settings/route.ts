import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import cloudinary from '../../../lib/cloudinary';
import { getDatabase } from '../../../lib/database/neon';
import { isAdminAuthenticated } from '../../../lib/require-admin';
import { siteSettingDefaults } from '../../../lib/site-setting-defaults';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const updateSettingSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, 'Key pengaturan wajib diisi.')
    .max(100, 'Key pengaturan terlalu panjang.'),
  value: z.string().max(10000, 'Nilai pengaturan terlalu panjang.'),
});

const imageSettingFolders: Partial<Record<string, string[]>> = {
  hero_background_url: ['katalog-teknik/hero/', 'katalog-teknik/products/'],
  header_brand_logo_url: ['katalog-teknik/logos/', 'katalog-teknik/products/'],
  general_favicon_url: ['katalog-teknik/logos/'],
  home_promo_banner_desktop_url: ['katalog-teknik/banners/'],
  home_promo_banner_mobile_url: ['katalog-teknik/banners/'],
  home_promo_banner_2_desktop_url: ['katalog-teknik/banners/'],
  home_promo_banner_2_mobile_url: ['katalog-teknik/banners/'],
  home_promo_banner_3_desktop_url: ['katalog-teknik/banners/'],
  home_promo_banner_3_mobile_url: ['katalog-teknik/banners/'],
};

function getCloudinaryPublicId(value: string | null | undefined, allowedFolders: string[]) {
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') return null;

    const segments = url.pathname.split('/').filter(Boolean);
    const uploadIndex = segments.indexOf('upload');
    if (uploadIndex < 0) return null;

    const afterUpload = segments.slice(uploadIndex + 1);
    const versionIndex = afterUpload.findIndex((segment) => /^v\d+$/.test(segment));
    if (versionIndex < 0) return null;

    const publicId = afterUpload
      .slice(versionIndex + 1)
      .map((segment) => decodeURIComponent(segment))
      .join('/')
      .replace(/\.[^/.]+$/, '');

    return allowedFolders.some((folder) => publicId.startsWith(folder)) ? publicId : null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const sql = getDatabase();

    const rows = await sql`
      SELECT
        key,
        value
      FROM settings
      ORDER BY key ASC
    `;

    const typedRows = rows as Array<{ key: string; value: string | null }>;
    const savedSettings = new Map(typedRows.map((row) => [row.key, row]));
    const defaultRows = Object.entries(siteSettingDefaults)
      .filter(([key]) => !savedSettings.has(key))
      .map(([key, value]) => ({ key, value }));

    return NextResponse.json(
      [...typedRows, ...defaultRows].sort((left, right) =>
        String(left.key).localeCompare(String(right.key)),
      ),
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      },
    );
  } catch (error) {
    console.error('Gagal memuat pengaturan Neon:', error);

    return NextResponse.json(
      {
        message: 'Database gagal memuat pengaturan.',
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json(
      {
        message: 'Sesi admin tidak valid atau sudah berakhir.',
      },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    const parsed = updateSettingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message || 'Data pengaturan tidak valid.',
        },
        { status: 400 },
      );
    }

    const { key, value } = parsed.data;
    const sql = getDatabase();
    const previousRows = (await sql`
      SELECT value
      FROM settings
      WHERE key = ${key}
      LIMIT 1
    `) as Array<{ value: string | null }>;
    const previousValue = previousRows[0]?.value ?? '';

    await sql`
      INSERT INTO settings (
        key,
        value,
        updated_at
      )
      VALUES (
        ${key},
        ${value},
        NOW()
      )
      ON CONFLICT (key)
      DO UPDATE SET
        value = EXCLUDED.value,
        updated_at = NOW()
    `;

    const allowedFolders = imageSettingFolders[key];
    if (allowedFolders && previousValue !== value) {
      const previousPublicId = getCloudinaryPublicId(previousValue, allowedFolders);
      const nextPublicId = getCloudinaryPublicId(value, allowedFolders);

      if (previousPublicId && previousPublicId !== nextPublicId) {
        try {
          await cloudinary.uploader.destroy(previousPublicId, {
            invalidate: true,
            resource_type: 'image',
          });
        } catch (deleteError) {
          console.error(`Gagal menghapus aset Cloudinary lama untuk ${key}:`, deleteError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      key,
    });
  } catch (error) {
    console.error('Gagal menyimpan pengaturan Neon:', error);

    return NextResponse.json(
      {
        message: 'Database gagal menyimpan pengaturan.',
      },
      { status: 500 },
    );
  }
}
