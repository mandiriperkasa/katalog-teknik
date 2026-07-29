import { NextResponse } from 'next/server';

import { getDatabase } from '@/lib/database/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getDatabase();
    const rows = await sql`
      SELECT
        product.id::text AS id,
        product.id AS "productId",
        product.legacy_no AS "productLegacyNo",
        product.name AS "productName",
        product.main_category AS "mainCategory",
        product.second_category AS "secondCategory",
        product.sub_category AS "subCategory",
        product.price,
        product.has_discount AS "hasDiscount",
        product.discount_price AS "discountPrice",
        product.sold_count AS "soldCount",
        product.rating,
        product.show_rating AS "showRating",
        product.image_url AS "imageUrl",
        product.is_best_seller AS "isBestSeller"
      FROM products AS product
      WHERE
        product.is_promotion = TRUE
        AND product.is_visible = TRUE
        AND product.image_url IS NOT NULL
        AND BTRIM(product.image_url) <> ''
      ORDER BY
        product.is_best_seller DESC,
        product.sold_count DESC,
        product.id DESC
    `;

    return NextResponse.json(rows, {
      headers: { 'Cache-Control': 'public, max-age=15, s-maxage=30' },
    });
  } catch (error) {
    console.error('Gagal mengambil produk promo:', error);
    return NextResponse.json({ message: 'Gagal mengambil produk promo.' }, { status: 500 });
  }
}
