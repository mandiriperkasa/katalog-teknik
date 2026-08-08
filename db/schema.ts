import {
  bigint,
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export type ProductVariant = {
  name: string;
  price?: number | null;
  hasDiscount?: boolean;
  discountPrice?: number | null;
  isAvailable: boolean;
};

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  legacyNo: integer('legacy_no'),
  name: text('name').notNull(),
  brand: text('brand'),
  mainCategory: text('main_category'),
  secondCategory: text('second_category'),
  subCategory: text('sub_category'),
  price: bigint('price', { mode: 'number' }).notNull(),
  description: text('description'),
  hasDiscount: boolean('has_discount').notNull().default(false),
  discountPrice: bigint('discount_price', { mode: 'number' }),
  soldCount: bigint('sold_count', { mode: 'number' }).notNull().default(0),
  rating: integer('rating'),
  showRating: boolean('show_rating').notNull().default(true),

  // Foto utama untuk card serta foto pertama pada galeri detail.
  imageUrl: text('image_url').notNull(),
  imagePublicId: text('image_public_id'),

  // Tiga foto tambahan untuk slider/galeri detail produk.
  imageUrl2: text('image_url_2'),
  imagePublicId2: text('image_public_id_2'),
  imageUrl3: text('image_url_3'),
  imagePublicId3: text('image_public_id_3'),
  imageUrl4: text('image_url_4'),
  imagePublicId4: text('image_public_id_4'),

  tokopediaUrl: text('tokopedia_url'),
  tiktokShopUrl: text('tiktok_shop_url'),
  variants: jsonb('variants').$type<ProductVariant[]>().notNull().default([]),
  isVisible: boolean('is_visible').notNull().default(true),
  isBestSeller: boolean('is_best_seller').notNull().default(false),
  isPromotion: boolean('is_promotion').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const productPromotions = pgTable('product_promotions', {
  id: serial('id').primaryKey(),
  productId: integer('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  imagePublicId: text('image_public_id').notNull(),
  mobileImageUrl: text('mobile_image_url'),
  mobileImagePublicId: text('mobile_image_public_id'),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductPromotionRow = typeof productPromotions.$inferSelect;
export type NewProductPromotionRow = typeof productPromotions.$inferInsert;
export type AdminRow = typeof admins.$inferSelect;
export type NewAdminRow = typeof admins.$inferInsert;
