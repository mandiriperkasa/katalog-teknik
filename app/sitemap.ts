import type { MetadataRoute } from 'next';

import { getProductSlug, type ProductRow } from '@/app/(main)/products/product';
import { getDatabase } from '@/lib/database/neon';

const SITE_URL = 'https://mandiriperkakas.com';

type SitemapProduct = ProductRow & {
  id: number;
  updatedAt?: Date | string | null;
};

export const runtime = 'nodejs';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/products`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/services`,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/gallery`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/about`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/contact`,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    const sql = getDatabase();
    const rows = (await sql`
      SELECT
        id,
        legacy_no AS "legacyNo",
        name,
        updated_at AS "updatedAt"
      FROM products
      ORDER BY id DESC
    `) as unknown as SitemapProduct[];

    const productPages: MetadataRoute.Sitemap = rows.map((product) => ({
      url: `${SITE_URL}/products/${encodeURIComponent(getProductSlug(product))}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch (error) {
    console.error('Gagal menambahkan produk ke sitemap:', error);
    return staticPages;
  }
}
