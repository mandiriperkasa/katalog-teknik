'use client';

import { useState } from 'react';

import {
  formatCurrency,
  getDiscountPercent,
  getNumericPrice,
  type ProductVariant,
} from '../products/product';

type ProductVariantSelectorProps = {
  variants: ProductVariant[];
  price: number | string | null | undefined;
  discountPrice: number | string | null | undefined;
  hasDiscount: boolean;
};

export default function ProductVariantSelector({
  variants,
  price,
  discountPrice,
  hasDiscount,
}: ProductVariantSelectorProps) {
  const firstAvailableIndex = variants.findIndex((variant) => variant.isAvailable);
  const [selectedIndex, setSelectedIndex] = useState(firstAvailableIndex);
  const selectedVariant = selectedIndex >= 0 ? variants[selectedIndex] : undefined;
  const hasSelectedVariant = Boolean(selectedVariant);
  const hasExplicitVariantDiscount =
    hasSelectedVariant && typeof selectedVariant?.hasDiscount === 'boolean';
  const hasVariantPrice = getNumericPrice(selectedVariant?.price) > 0;
  const originalPrice = hasVariantPrice ? getNumericPrice(selectedVariant?.price) : price;
  const basePrice = getNumericPrice(price);
  const baseDiscountPrice = getNumericPrice(discountPrice);
  const discountRatio =
    hasDiscount && basePrice > 0 && baseDiscountPrice > 0 ? baseDiscountPrice / basePrice : 1;
  const selectedHasDiscount = hasExplicitVariantDiscount
    ? selectedVariant?.hasDiscount === true
    : hasDiscount;
  const displayedDiscountPrice = hasExplicitVariantDiscount
    ? selectedVariant?.discountPrice
    : hasVariantPrice
      ? Math.round(getNumericPrice(selectedVariant?.price) * discountRatio)
      : discountPrice;
  const showDiscount =
    selectedHasDiscount &&
    getNumericPrice(displayedDiscountPrice) > 0 &&
    getNumericPrice(displayedDiscountPrice) < getNumericPrice(originalPrice);

  return (
    <>
      <div className="product-detail-price" aria-live="polite">
        {showDiscount ? (
          <>
            <strong>{formatCurrency(displayedDiscountPrice)}</strong>
            <span>{formatCurrency(originalPrice)}</span>
            <em>-{getDiscountPercent(originalPrice, displayedDiscountPrice)}%</em>
          </>
        ) : (
          <strong>{formatCurrency(originalPrice)}</strong>
        )}
      </div>

      {variants.length > 0 && (
        <fieldset className="product-variant-selector">
          <legend>Varian</legend>
          <div className="product-variant-options" role="radiogroup">
            {variants.map((variant, index) => {
              const selected = selectedIndex === index;

              return (
                <button
                  key={`${variant.name}-${index}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={!variant.isAvailable}
                  className={selected ? 'is-selected' : undefined}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span>{variant.name}</span>
                  {!variant.isAvailable && <small>Habis</small>}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
    </>
  );
}
