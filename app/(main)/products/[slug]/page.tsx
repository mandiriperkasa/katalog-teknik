import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ChevronRight,
  ExternalLink,
  MessageCircleMore,
  PackageCheck,
  ShoppingBag,
  Star,
  Store,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { getDatabase } from '@/lib/database/neon';

import ProductCard from '../../components/ProductCard';
import ProductDetailGallery from '../../components/ProductDetailGallery';
import ProductVariantSelector from '../../components/ProductVariantSelector';
import SectionHeading from '../../components/SectionHeading';
import {
  cleanCategory,
  formatSoldCount,
  getNumericPrice,
  getProductSlug,
  isTruthy,
  type ProductRow,
} from '../product';

type ProductRecord = ProductRow & {
  id: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type DetailData = {
  product: ProductRecord;
  related: ProductRecord[];
  content: Record<string, string>;
};

function normalizeWhatsAppNumber(value: string) {
  const normalized = value.trim().replace(/[^\d+]/g, '');
  if (normalized.startsWith('+')) return normalized.slice(1);
  if (normalized.startsWith('0')) return `62${normalized.slice(1)}`;
  return normalized.replace(/\D/g, '');
}

function relatedScore(product: ProductRecord, candidate: ProductRecord) {
  let score = 0;

  if (
    candidate.subCategory?.trim() &&
    candidate.subCategory.trim() === product.subCategory?.trim()
  ) {
    score += 300;
  }
  if (
    candidate.secondCategory?.trim() &&
    candidate.secondCategory.trim() === product.secondCategory?.trim()
  ) {
    score += 200;
  }
  if (
    candidate.mainCategory?.trim() &&
    candidate.mainCategory.trim() === product.mainCategory?.trim()
  ) {
    score += 100;
  }

  return score + Math.min(99, Math.floor(Number(candidate.soldCount) || 0) / 1000);
}

const getDetailData = cache(async (slug: string): Promise<DetailData | null> => {
  const sql = getDatabase();
  const [productRows, settingRows] = await Promise.all([
    sql`
      SELECT
        id,
        legacy_no AS "legacyNo",
        name,
        main_category AS "mainCategory",
        second_category AS "secondCategory",
        sub_category AS "subCategory",
        price,
        description,
        has_discount AS "hasDiscount",
        discount_price AS "discountPrice",
        sold_count AS "soldCount",
        rating,
        show_rating AS "showRating",
        image_url AS "imageUrl",
        image_url_2 AS "imageUrl2",
        image_url_3 AS "imageUrl3",
        image_url_4 AS "imageUrl4",
        tokopedia_url AS "tokopediaUrl",
        tiktok_shop_url AS "tiktokShopUrl",
        variants,
        is_best_seller AS "isBestSeller",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM products
      WHERE is_visible = TRUE
      ORDER BY id DESC
    `,
    sql`
      SELECT key, value
      FROM settings
      ORDER BY key ASC
    `,
  ]);

  const products = productRows as unknown as ProductRecord[];
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  const trailingIdentifier = Number(decodedSlug.match(/-(\d+)$/)?.[1]);
  const product =
    products.find((item) => getProductSlug(item) === decodedSlug) ??
    (Number.isInteger(trailingIdentifier)
      ? products.find(
          (item) => item.id === trailingIdentifier || Number(item.legacyNo) === trailingIdentifier,
        )
      : undefined);

  if (!product) return null;

  const content = Object.fromEntries(
    (settingRows as unknown as Array<{ key: string; value: string | null }>).map((item) => [
      item.key,
      item.value ?? '',
    ]),
  );

  const related = products
    .filter((candidate) => candidate.id !== product.id)
    .sort((left, right) => {
      const scoreDifference = relatedScore(product, right) - relatedScore(product, left);
      if (scoreDifference !== 0) return scoreDifference;
      return (Number(right.soldCount) || 0) - (Number(left.soldCount) || 0);
    })
    .slice(0, 4);

  return { product, related, content };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getDetailData(slug);

  if (!data) return { title: 'Produk tidak ditemukan' };

  return {
    title: data.product.name || 'Detail Produk',
    description:
      data.product.description?.trim().slice(0, 160) ||
      `Informasi dan penawaran ${data.product.name || 'produk teknik'} dari Mandiri Perkakas.`,
    alternates: {
      canonical: `/products/${encodeURIComponent(slug)}`,
    },
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getDetailData(slug);
  if (!data) notFound();

  const { product, related, content } = data;
  const hasDiscount =
    isTruthy(product.hasDiscount) &&
    getNumericPrice(product.discountPrice) > 0 &&
    getNumericPrice(product.discountPrice) < getNumericPrice(product.price);
  const whatsappNumber = normalizeWhatsAppNumber(
    content.whatsapp_number?.trim() || '+6285640100044',
  );
  const whatsappMessage = `Halo, saya ingin bertanya dan meminta penawaran untuk produk ${product.name || 'ini'}.`;
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
  const showRating = product.showRating == null || isTruthy(product.showRating);
  const productTokopediaUrl = product.tokopediaUrl?.trim() || '';
  const productTiktokShopUrl = product.tiktokShopUrl?.trim() || '';
  const tokopediaHref = productTokopediaUrl || content.link_tokopedia?.trim() || '';
  const tiktokShopHref = productTiktokShopUrl || content.link_tiktok_shop?.trim() || '';
  const hasMarketplace = Boolean(tokopediaHref || tiktokShopHref);
  const variants = Array.isArray(product.variants)
    ? product.variants.filter(
        (variant) =>
          variant &&
          typeof variant.name === 'string' &&
          variant.name.trim().length > 0 &&
          typeof variant.isAvailable === 'boolean',
      )
    : [];
  const specifications = [
    ['Kategori utama', cleanCategory(product.mainCategory)],
    ['Kategori kedua', cleanCategory(product.secondCategory)],
    ['Subkategori', cleanCategory(product.subCategory)],
    ...(product.legacyNo ? [['Kode produk', String(product.legacyNo)]] : []),
    ...(showRating ? [['Rating', `${product.rating || 5} / 5`]] : []),
    ['Jumlah terjual', formatSoldCount(product.soldCount)],
  ];

  return (
    <main className="product-detail-page">
      <section className="section-shell product-detail-shell">
        <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Beranda</Link>
          <ChevronRight size={14} />
          <Link href="/products">Produk</Link>
          <ChevronRight size={14} />
          <span>{cleanCategory(product.mainCategory)}</span>
          <ChevronRight size={14} />
          <span aria-current="page">{product.name}</span>
        </nav>

        <div className="product-detail-hero">
          <div className="product-detail-gallery-column">
            <ProductDetailGallery
              name={product.name || 'Produk Teknik'}
              imageUrl={product.imageUrl}
              imageUrl2={product.imageUrl2}
              imageUrl3={product.imageUrl3}
              imageUrl4={product.imageUrl4}
            />
          </div>

          <article
            className={`site-card product-detail-summary ${hasMarketplace ? 'has-marketplace' : ''} ${variants.length > 0 ? 'has-variants' : ''}`}
          >
            <div className="flex flex-wrap gap-2">
              {isTruthy(product.isBestSeller) && (
                <span className="site-chip product-best-badge">
                  <BadgeCheck size={14} /> Terlaris
                </span>
              )}
              <span className="site-chip">
                <Boxes size={14} /> {cleanCategory(product.mainCategory)}
              </span>
            </div>

            <h1>{product.name || 'Produk Teknik Profesional'}</h1>

            <div className="product-detail-meta">
              {showRating && (
                <span>
                  <Star size={17} fill="currentColor" className="text-amber-500" />
                  <strong>{product.rating || 5}</strong>
                </span>
              )}
              <span>{formatSoldCount(product.soldCount)}</span>
              {product.legacyNo && <span>SKU: {product.legacyNo}</span>}
            </div>

            <ProductVariantSelector
              variants={variants}
              price={product.price}
              discountPrice={product.discountPrice}
              hasDiscount={hasDiscount}
            />

            <div className="product-detail-assurances">
              <span>
                <PackageCheck size={17} /> Ketersediaan dikonfirmasi oleh tim
              </span>
              <span>
                <BadgeCheck size={17} /> Produk terkurasi dan bergaransi
              </span>
            </div>

            {hasMarketplace && (
              <div className="product-marketplace-purchase">
                <div className="product-marketplace-heading">
                  <span className="product-marketplace-heading-icon">
                    <ShoppingBag size={15} />
                  </span>
                  <span>
                    <strong>Tersedia di Marketplace</strong>
                    <small>
                      {productTokopediaUrl || productTiktokShopUrl
                        ? 'Buka halaman produk di toko resmi kami.'
                        : 'Kunjungi toko resmi dan cari nama produk ini.'}
                    </small>
                  </span>
                </div>

                <div className="product-marketplace-actions">
                  {tokopediaHref && (
                    <a
                      href={tokopediaHref}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="site-button product-marketplace-button is-tokopedia"
                      aria-label={`${productTokopediaUrl ? 'Beli produk di' : 'Kunjungi toko'} Tokopedia`}
                    >
                      <Store size={16} />
                      <span>
                        {productTokopediaUrl ? 'Beli di Tokopedia' : 'Kunjungi Tokopedia'}
                      </span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                  {tiktokShopHref && (
                    <a
                      href={tiktokShopHref}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="site-button product-marketplace-button is-tiktok-shop"
                      aria-label={`${productTiktokShopUrl ? 'Beli produk di' : 'Kunjungi'} TikTok Shop`}
                    >
                      <ShoppingBag size={16} />
                      <span>
                        {productTiktokShopUrl ? 'Beli di TikTok Shop' : 'Kunjungi TikTok Shop'}
                      </span>
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </div>
            )}

            <div className="product-detail-actions">
              <Link href="/contact" className="site-button site-button-primary">
                Minta Penawaran <ArrowRight size={17} />
              </Link>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="site-button product-detail-whatsapp"
              >
                <MessageCircleMore size={18} /> Tanya via WhatsApp
              </a>
            </div>
          </article>
        </div>

        <div className="product-detail-content-grid">
          <article className="site-card product-detail-description">
            <span className="site-eyebrow">Informasi produk</span>
            <h2>Deskripsi</h2>
            <p>
              {product.description?.trim() ||
                'Detail produk belum tersedia. Hubungi tim kami untuk mendapatkan informasi fungsi, kelengkapan, dan rekomendasi penggunaan produk ini.'}
            </p>
          </article>

          <article className="site-card product-detail-specifications">
            <span className="site-eyebrow">Data produk</span>
            <h2>Spesifikasi</h2>
            <dl>
              {specifications.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </article>
        </div>

        {related.length > 0 && (
          <section className="product-related-section">
            <SectionHeading
              eyebrow="Pilihan lainnya"
              title="Produk Terkait"
              description="Produk dari kategori serupa yang mungkin sesuai dengan kebutuhan Anda."
            />
            <div className="product-grid product-related-grid">
              {related.map((item, index) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  index={index}
                  content={content}
                  eagerImage={index === 0}
                />
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
