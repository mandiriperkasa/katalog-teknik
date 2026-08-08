import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2),
  brand: z.string().trim().min(1),
  mainCategory: z.string().default('Lainnya'),
  secondCategory: z.string().default('Lainnya'),
  subCategory: z.string().default('Lainnya'),
  price: z.number().min(0),
  rating: z.number().min(0).max(5),
  showRating: z.boolean().default(true),
  imageUrl: z.string().url().or(z.literal('')),
  tokopediaUrl: z.string().url().or(z.literal('')).optional(),
  tiktokShopUrl: z.string().url().or(z.literal('')).optional(),
  isBestSeller: z.boolean(),
  isPromotion: z.boolean().default(false),
});
