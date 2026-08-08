ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand TEXT;

CREATE INDEX IF NOT EXISTS products_brand_lower_idx
ON products (LOWER(brand));
