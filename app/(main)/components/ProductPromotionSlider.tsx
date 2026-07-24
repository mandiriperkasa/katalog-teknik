'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgePercent, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { getOptimizedCloudinaryUrl, isCloudinaryUrl } from '@/lib/cloudinary-image';

import {
  cleanCategory,
  formatCurrency,
  formatSoldCount,
  getDiscountPercent,
  getNumericPrice,
  getProductHref,
  isTruthy,
} from '../products/product';

export type ProductPromotion = {
  id: string;
  productId: number;
  productLegacyNo?: number | null;
  productName: string;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  hasDiscount?: boolean | string | null;
  discountPrice?: number | string | null;
  soldCount?: number | string | null;
  rating?: number | string | null;
  showRating?: boolean | string | null;
  imageUrl: string;
  isBestSeller?: boolean | string | null;
};

export default function ProductPromotionSlider({ promotions }: { promotions: ProductPromotion[] }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const multiple = promotions.length > 1;

  useEffect(() => {
    if (!multiple || paused || reduceMotion) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % promotions.length);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [multiple, paused, promotions.length, reduceMotion]);

  if (promotions.length === 0) return null;

  const safeActiveIndex = activeIndex % promotions.length;
  const activePromotion = promotions[safeActiveIndex];
  const imageUrl = getOptimizedCloudinaryUrl(activePromotion.imageUrl, { width: 900 });
  const productHref = getProductHref({
    id: activePromotion.productId,
    legacyNo: activePromotion.productLegacyNo,
    name: activePromotion.productName,
  });
  const hasDiscount =
    isTruthy(activePromotion.hasDiscount) &&
    getNumericPrice(activePromotion.discountPrice) > 0 &&
    getNumericPrice(activePromotion.discountPrice) < getNumericPrice(activePromotion.price);
  const showRating = activePromotion.showRating == null || isTruthy(activePromotion.showRating);

  const showPrevious = () =>
    setActiveIndex((current) => (current - 1 + promotions.length) % promotions.length);
  const showNext = () => setActiveIndex((current) => (current + 1) % promotions.length);

  return (
    <section
      className="product-promotion-slider"
      aria-label="Promo produk"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <div className="product-promotion-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activePromotion.id}
            className="product-promotion-slide"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -32 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.42, ease: [0.22, 1, 0.36, 1] }}
            drag={multiple && !reduceMotion ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.16}
            onDragEnd={(_, info) => {
              if (info.offset.x > 55) showPrevious();
              if (info.offset.x < -55) showNext();
            }}
            aria-roledescription="slide"
            aria-label={`${safeActiveIndex + 1} dari ${promotions.length}`}
          >
            <Link
              href={productHref}
              className="product-promotion-link"
              aria-label={`Lihat promo ${activePromotion.productName}`}
            >
              <span className="product-promotion-orb is-one" aria-hidden="true" />
              <span className="product-promotion-orb is-two" aria-hidden="true" />
              <span className="product-promotion-accent" aria-hidden="true" />
              <span className="product-promotion-counter" aria-hidden="true">
                {String(safeActiveIndex + 1).padStart(2, '0')}
                <i />
                {String(promotions.length).padStart(2, '0')}
              </span>

              <span className="product-promotion-badge">
                <BadgePercent size={13} /> Promo Pilihan
              </span>

              <span className="product-promotion-image-shell">
                <Image
                  src={imageUrl}
                  alt={`Promo ${activePromotion.productName}`}
                  fill
                  priority={safeActiveIndex === 0}
                  unoptimized={isCloudinaryUrl(activePromotion.imageUrl)}
                  sizes="(max-width: 679px) calc(100vw - 52px), 350px"
                  className="product-promotion-image"
                />
                {hasDiscount && (
                  <span className="product-promotion-discount">
                    -{getDiscountPercent(activePromotion.price, activePromotion.discountPrice)}%
                  </span>
                )}
              </span>

              <span className="product-promotion-content">
                <span className="product-promotion-category">
                  {cleanCategory(activePromotion.mainCategory)}
                  {isTruthy(activePromotion.isBestSeller) && <em>Terlaris</em>}
                </span>
                <strong className="product-promotion-title">{activePromotion.productName}</strong>

                <span className="product-promotion-price-row">
                  <strong>
                    {formatCurrency(
                      hasDiscount ? activePromotion.discountPrice : activePromotion.price,
                    )}
                  </strong>
                  {hasDiscount && <del>{formatCurrency(activePromotion.price)}</del>}
                </span>

                <span className="product-promotion-meta">
                  {showRating && (
                    <span>
                      <Star size={12} fill="currentColor" /> {activePromotion.rating || 5}
                    </span>
                  )}
                  <span>{formatSoldCount(activePromotion.soldCount)}</span>
                  <span className="product-promotion-cta">
                    Lihat Detail <ArrowRight size={13} />
                  </span>
                </span>
              </span>
            </Link>
          </motion.div>
        </AnimatePresence>

        {multiple && (
          <>
            <button
              type="button"
              className="product-promotion-arrow is-previous"
              onClick={showPrevious}
              aria-label="Promo sebelumnya"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              className="product-promotion-arrow is-next"
              onClick={showNext}
              aria-label="Promo berikutnya"
            >
              <ChevronRight size={17} />
            </button>
          </>
        )}
      </div>

      {multiple && (
        <div className="product-promotion-dots" aria-label="Pilih slide promo">
          {promotions.map((promotion, index) => (
            <button
              type="button"
              key={promotion.id}
              className={index === safeActiveIndex ? 'is-active' : ''}
              onClick={() => setActiveIndex(index)}
              aria-label={`Tampilkan promo ${index + 1}: ${promotion.productName}`}
              aria-current={index === safeActiveIndex ? 'true' : undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
