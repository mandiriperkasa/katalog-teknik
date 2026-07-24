ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_promotion BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE products
SET is_promotion = TRUE
WHERE id IN (
  SELECT product_id
  FROM product_promotions
  WHERE is_active = TRUE
);

CREATE INDEX IF NOT EXISTS products_promotion_idx
  ON products (is_promotion, id);
