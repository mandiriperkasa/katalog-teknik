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
  const hasVariantPrice = getNumericPrice(selectedVariant?.price) > 0;
  const displayedPrice = hasVariantPrice ? selectedVariant?.price : price;
  const showBaseDiscount = !hasVariantPrice && hasDiscount;

  return (
    <>
      <div className="product-detail-price" aria-live="polite">
        {showBaseDiscount ? (
          <>
            <strong>{formatCurrency(discountPrice)}</strong>
            <span>{formatCurrency(price)}</span>
            <em>-{getDiscountPercent(price, discountPrice)}%</em>
          </>
        ) : (
          <strong>{formatCurrency(displayedPrice)}</strong>
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
