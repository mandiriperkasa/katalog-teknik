INSERT INTO settings (key, value, updated_at)
VALUES
  ('link_tokopedia', '', NOW()),
  ('link_tiktok_shop', '', NOW())
ON CONFLICT (key) DO NOTHING;
