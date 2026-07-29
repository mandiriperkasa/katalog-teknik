export type ProductRow = {
  id?: number;
  legacyNo?: number | string | null;
  name?: string | null;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  description?: string | null;
  hasDiscount?: boolean | string | null;
  discountPrice?: number | string | null;
  soldCount?: number | string | null;
  rating?: number | string | null;
  showRating?: boolean | string | null;
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
  imageUrl4?: string | null;
  tokopediaUrl?: string | null;
  tiktokShopUrl?: string | null;
  variants?: ProductVariant[] | null;
  isVisible?: boolean | string | null;
  isBestSeller?: boolean | string | null;
  isPromotion?: boolean | string | null;
};

export type ProductVariant = {
  name: string;
  isAvailable: boolean;
};

export function slugifyProductName(name?: string | null) {
  return (
    name
      ?.normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'produk'
  );
}

export function getProductSlug(product: ProductRow) {
  const identifier = product.id ?? product.legacyNo;
  const nameSlug = slugifyProductName(product.name);

  return identifier ? `${nameSlug}-${identifier}` : nameSlug;
}

export function getProductHref(product: ProductRow) {
  return `/products/${encodeURIComponent(getProductSlug(product))}`;
}

export function getNumericPrice(value?: number | string | null) {
  return Number(value) || 0;
}

export function formatCurrency(value?: string | number | null, fallback = 'Hubungi kami') {
  const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(number)) return value || fallback;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

export function getDiscountPercent(
  price?: number | string | null,
  discountPrice?: number | string | null,
) {
  const originalPrice = getNumericPrice(price);
  const finalPrice = getNumericPrice(discountPrice);

  if (originalPrice <= 0 || finalPrice <= 0 || finalPrice >= originalPrice) return 0;

  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

export function formatSoldCount(value?: number | string | null, label = 'terjual') {
  const soldCount = Math.max(0, Math.floor(Number(value) || 0));

  if (soldCount >= 1_000_000) {
    const formatted = (soldCount / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${formatted}JT+ ${label}`;
  }

  if (soldCount >= 1_000) {
    const formatted = (soldCount / 1_000).toFixed(1).replace('.0', '').replace('.', ',');
    return `${formatted}RB+ ${label}`;
  }

  return `${soldCount.toLocaleString('id-ID')} ${label}`;
}

export function isTruthy(value?: boolean | string | null) {
  if (typeof value === 'boolean') return value;

  return ['true', '1', 'yes', 'ya'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );
}

export function cleanCategory(value?: string | null, fallback = 'Lainnya') {
  return value?.trim() || fallback;
}
