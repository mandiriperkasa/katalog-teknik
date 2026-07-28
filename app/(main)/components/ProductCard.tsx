'use client';

import { motion } from 'framer-motion';
import { ChevronRight, Star, Wrench } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { getOptimizedCloudinaryUrl, isCloudinaryUrl } from '@/lib/cloudinary-image';

import {
  cleanCategory,
  formatCurrency,
  formatSoldCount,
  getDiscountPercent,
  getNumericPrice,
  getProductHref,
  isTruthy,
  type ProductRow,
} from '../products/product';

type ProductCardProps = {
  product: ProductRow;
  index?: number;
  content?: Record<string, string>;
  eagerImage?: boolean;
};

export default function ProductCard({
  product,
  index = 0,
  content = {},
  eagerImage = false,
}: ProductCardProps) {
  const router = useRouter();
  const href = getProductHref(product);
  const getContent = (key: string, fallback: string) => content[key]?.trim() || fallback;
  const showRating = product.showRating == null || isTruthy(product.showRating);

  const openProduct = () => router.push(href);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.94, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 14 }}
      transition={{
        duration: 0.42,
        delay: Math.min(index * 0.045, 0.24),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -9 }}
      className="site-card product-card product-catalog-card product-card-clickable"
      role="link"
      tabIndex={0}
      aria-label={`Lihat detail ${product.name || 'Produk'}`}
      onClick={openProduct}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openProduct();
        }
      }}
    >
      <div className="product-card-ambient" />
      <div className="product-image-wrap">
        <div className="product-card-badges">
          {isTruthy(product.isBestSeller) && (
            <span className="site-chip product-badge product-best-badge">
              {getContent('products_best_seller_badge', 'Terlaris')}
            </span>
          )}
          <span className="site-chip product-badge product-main-badge">
            {cleanCategory(product.mainCategory)}
          </span>
        </div>
        {product.imageUrl ? (
          <Image
            src={getOptimizedCloudinaryUrl(product.imageUrl, { width: 640 })}
            alt={product.name || getContent('products_product_image_alt', 'Produk teknik')}
            fill
            unoptimized={isCloudinaryUrl(product.imageUrl)}
            sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 34vw"
            loading={eagerImage ? 'eager' : 'lazy'}
            fetchPriority={eagerImage ? 'high' : 'auto'}
            className="product-image"
          />
        ) : (
          <div className="product-image-placeholder">
            <Wrench size={48} strokeWidth={1.2} />
          </div>
        )}
        <span className="product-image-scan" aria-hidden="true" />
      </div>

      <div className="product-card-content">
        <div className="product-category-trail">
          <span>{cleanCategory(product.mainCategory)}</span>
          <ChevronRight size={11} />
          <span>{cleanCategory(product.secondCategory)}</span>
          <ChevronRight size={11} />
          <span>{cleanCategory(product.subCategory)}</span>
        </div>
        <h2 className="product-card-title">
          {product.name || getContent('products_default_product_name', 'Produk Teknik Profesional')}
        </h2>
        <div className="product-card-meta">
          <span>{getContent('products_card_meta_label', 'Professional equipment')}</span>
          {showRating && (
            <span className="inline-flex items-center gap-1 text-amber-500">
              <Star size={13} fill="currentColor" /> {product.rating || '5'}
            </span>
          )}
        </div>
        <div className="product-price">
          {isTruthy(product.hasDiscount) &&
          getNumericPrice(product.discountPrice) > 0 &&
          getNumericPrice(product.discountPrice) < getNumericPrice(product.price) ? (
            <div className="mt-1 min-h-20.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <strong className="text-xl font-bold tracking-tight text-red-500">
                  {formatCurrency(
                    product.discountPrice,
                    getContent('products_contact_price_label', 'Hubungi kami'),
                  )}
                </strong>
                <span className="text-xs text-(--text-muted) line-through">
                  {formatCurrency(
                    product.price,
                    getContent('products_contact_price_label', 'Hubungi kami'),
                  )}
                </span>
                <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                  -{getDiscountPercent(product.price, product.discountPrice)}%
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                  {getContent('products_best_price_guarantee', 'Garansi Harga Terbaik')}
                </span>
                <span className="text-xs font-medium text-(--text-muted)">
                  {formatSoldCount(product.soldCount, getContent('products_sold_label', 'terjual'))}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-1 min-h-20.5">
              <strong className="text-xl font-bold tracking-tight text-(--text-primary)">
                {formatCurrency(
                  product.price,
                  getContent('products_contact_price_label', 'Hubungi kami'),
                )}
              </strong>
              <div className="mt-2">
                <span className="text-xs font-medium text-(--text-muted)">
                  {formatSoldCount(product.soldCount, getContent('products_sold_label', 'terjual'))}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="product-card-actions product-card-actions-single">
          <Link
            href="/contact"
            className="site-button site-button-primary"
            onClick={(event) => event.stopPropagation()}
          >
            {getContent('products_offer_button', 'Penawaran')}
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
