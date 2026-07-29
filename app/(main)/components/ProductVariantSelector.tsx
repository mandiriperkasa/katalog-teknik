'use client';

import { useState } from 'react';

import type { ProductVariant } from '../products/product';

type ProductVariantSelectorProps = {
  variants: ProductVariant[];
};

export default function ProductVariantSelector({ variants }: ProductVariantSelectorProps) {
  const firstAvailableIndex = variants.findIndex((variant) => variant.isAvailable);
  const [selectedIndex, setSelectedIndex] = useState(firstAvailableIndex);

  if (variants.length === 0) return null;

  return (
    <fieldset className="product-variant-selector">
      <legend>Varian</legend>
      <div className="product-variant-options">
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
  );
}
