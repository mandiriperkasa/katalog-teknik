import { z } from 'zod';

import { getDatabase } from '@/lib/database/neon';

import { createProducts as insertProducts, findProducts } from './product.repository';

const productQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  includeHidden: z.boolean().default(false),
});

const optionalImageUrl = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value ?? '');
const optionalPublicId = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value ?? '');
const optionalMarketplaceUrl = z
  .string()
  .trim()
  .url('URL marketplace harus lengkap, termasuk https://')
  .or(z.literal(''))
  .optional()
  .nullable()
  .transform((value) => value ?? '');
const productVariantsSchema = z
  .array(
    z
      .object({
        name: z.string().trim().min(1).max(80),
        price: z.coerce.number().positive().nullable().optional(),
        hasDiscount: z.boolean().default(false),
        discountPrice: z.coerce.number().positive().nullable().optional(),
        isAvailable: z.boolean().default(true),
      })
      .superRefine((variant, context) => {
        if (!variant.hasDiscount) return;

        const price = Number(variant.price) || 0;
        const discountPrice = Number(variant.discountPrice) || 0;

        if (discountPrice <= 0 || discountPrice >= price) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['discountPrice'],
            message: 'Harga diskon varian harus lebih kecil dari harga normal varian.',
          });
        }
      }),
  )
  .max(20)
  .default([]);
const productCreateSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama produk minimal 2 karakter.'),
    brand: z.string().trim().min(1, 'Merek produk wajib diisi.').max(100),
    mainCategory: z.string().trim().default('Lainnya'),
    secondCategory: z.string().trim().default('Lainnya'),
    subCategory: z.string().trim().default('Lainnya'),
    price: z.coerce.number().min(0),
    description: z.string().trim().optional().nullable(),
    hasDiscount: z.coerce.boolean().default(false),
    discountPrice: z.coerce.number().min(0).optional().nullable(),
    soldCount: z.coerce.number().int().min(0).default(0),
    rating: z.coerce.number().min(0).max(5),
    showRating: z.boolean().default(true),
    imageUrl: z.string().trim().min(1, 'Gambar produk wajib diunggah.'),
    imagePublicId: optionalPublicId,
    imageUrl2: optionalImageUrl,
    imagePublicId2: optionalPublicId,
    imageUrl3: optionalImageUrl,
    imagePublicId3: optionalPublicId,
    imageUrl4: optionalImageUrl,
    imagePublicId4: optionalPublicId,
    tokopediaUrl: optionalMarketplaceUrl,
    tiktokShopUrl: optionalMarketplaceUrl,
    variants: productVariantsSchema,
    isBestSeller: z.coerce.boolean().default(false),
    isPromotion: z.coerce.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (!value.hasDiscount) return;

    const discountPrice = Number(value.discountPrice) || 0;

    if (discountPrice <= 0 || discountPrice >= value.price) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountPrice'],
        message: 'Harga diskon harus lebih besar dari 0 dan lebih kecil dari harga lama.',
      });
    }
  });

export async function getProducts(query: unknown) {
  const parsed = productQuerySchema.parse(query);
  return findProducts(parsed.search, parsed.includeHidden);
}

export async function createProduct(input: unknown) {
  const parsed = productCreateSchema.parse(input);
  const sql = getDatabase();

  type MaxLegacyRow = {
    maxlegacy: number | null;
  };

  const lastLegacyResult = (await sql`
    SELECT MAX(legacy_no) AS maxlegacy
    FROM products
  `) as unknown as MaxLegacyRow[];

  const nextLegacy = (lastLegacyResult[0]?.maxlegacy ?? 0) + 1;

  const result = await insertProducts([
    {
      legacyNo: nextLegacy,
      name: parsed.name,
      brand: parsed.brand,
      mainCategory: parsed.mainCategory || 'Lainnya',
      secondCategory: parsed.secondCategory || 'Lainnya',
      subCategory: parsed.subCategory || 'Lainnya',
      price: parsed.price,
      description: parsed.description?.trim() || null,
      hasDiscount: parsed.hasDiscount,
      discountPrice: parsed.hasDiscount ? Number(parsed.discountPrice) || null : null,
      soldCount: Math.max(0, Math.floor(parsed.soldCount || 0)),
      rating: parsed.rating,
      showRating: parsed.showRating,
      imageUrl: parsed.imageUrl,
      imagePublicId: parsed.imagePublicId || null,
      imageUrl2: parsed.imageUrl2 || null,
      imagePublicId2: parsed.imagePublicId2 || null,
      imageUrl3: parsed.imageUrl3 || null,
      imagePublicId3: parsed.imagePublicId3 || null,
      imageUrl4: parsed.imageUrl4 || null,
      imagePublicId4: parsed.imagePublicId4 || null,
      tokopediaUrl: parsed.tokopediaUrl || null,
      tiktokShopUrl: parsed.tiktokShopUrl || null,
      variants: parsed.variants,
      isBestSeller: parsed.isBestSeller,
      isPromotion: parsed.isPromotion,
    },
  ]);

  return result[0];
}
