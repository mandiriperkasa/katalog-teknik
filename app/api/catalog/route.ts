import { NextRequest, NextResponse } from 'next/server';

import { getDatabase } from '@/lib/database/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const resource = request.nextUrl.searchParams.get('resource');

    const sql = getDatabase();

    if (resource === 'Products') {
      const products = await sql`
        SELECT
          id,
          legacy_no AS "No",
          name AS "Nama Produk",
          main_category AS "Kategori Utama",
          second_category AS "Kategori Kedua",
          sub_category AS "Sub Kategori",
          price AS "Harga",
          rating AS "Rating",
          image_url AS "Foto_URL",
          CASE
            WHEN is_best_seller
            THEN 'True'
            ELSE 'False'
          END AS "Terlaris"
        FROM products
        WHERE is_visible = TRUE
        ORDER BY legacy_no ASC, id ASC
      `;

      return NextResponse.json(products);
    }

    if (resource === 'Settings') {
      const settings = await sql`
        SELECT key, value
        FROM settings
        ORDER BY key ASC
      `;

      return NextResponse.json(settings);
    }

    if (resource === 'Gallery') {
      const gallery = await sql`
        SELECT
          id,
          title,
          category,
          location,
          image_url
        FROM gallery
        ORDER BY sort_order ASC, id ASC
      `;

      return NextResponse.json(gallery);
    }

    if (resource === 'Services') {
      const services = await sql`
        SELECT
          id,
          title,
          description AS "desc",
          icon_name
        FROM services
        ORDER BY sort_order ASC, id ASC
      `;

      return NextResponse.json(services);
    }

    if (resource === 'Customers' || resource === 'Customer') {
      const customers = await sql`
        SELECT
          name AS "Nama_Customer",
          logo_url AS "Logo_Url"
        FROM customers
        ORDER BY sort_order ASC, id ASC
      `;

      return NextResponse.json(customers);
    }

    return NextResponse.json(
      {
        message: 'Resource tidak dikenal.',
      },
      { status: 400 },
    );
  } catch (error) {
    console.error('Gagal membaca Neon:', error);

    return NextResponse.json(
      {
        message: 'Gagal membaca database.',
      },
      { status: 500 },
    );
  }
}
