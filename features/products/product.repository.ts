import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { products, type NewProductRow } from '@/db/schema';

export async function findProducts(search?: string, includeHidden = false) {
  const keyword = search?.trim();
  const visibilityFilter = includeHidden ? undefined : eq(products.isVisible, true);

  if (!keyword) {
    return db.select().from(products).where(visibilityFilter).orderBy(desc(products.id));
  }

  const searchFilter = or(
    ilike(products.name, `%${keyword}%`),
    ilike(products.brand, `%${keyword}%`),
    ilike(products.mainCategory, `%${keyword}%`),
    ilike(products.secondCategory, `%${keyword}%`),
    ilike(products.subCategory, `%${keyword}%`),
  );

  return db
    .select()
    .from(products)
    .where(includeHidden ? searchFilter : and(visibilityFilter, searchFilter))
    .orderBy(desc(products.id));
}

export async function createProducts(payload: NewProductRow[]) {
  if (payload.length === 0) return [];

  return db.insert(products).values(payload).returning();
}
