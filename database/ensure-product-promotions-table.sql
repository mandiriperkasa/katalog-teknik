CREATE TABLE IF NOT EXISTS product_promotions (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_public_id TEXT NOT NULL,
  mobile_image_url TEXT,
  mobile_image_public_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT product_promotions_valid_schedule
    CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS product_promotions_active_order_idx
  ON product_promotions (is_active, sort_order, id);

CREATE INDEX IF NOT EXISTS product_promotions_product_idx
  ON product_promotions (product_id);
