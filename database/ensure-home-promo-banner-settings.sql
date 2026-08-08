INSERT INTO settings (key, value, updated_at)
VALUES
  ('home_promo_banner_enabled', 'false', NOW()),
  ('home_promo_banner_desktop_url', '', NOW()),
  ('home_promo_banner_mobile_url', '', NOW()),
  ('home_promo_banner_link', '', NOW()),
  ('home_promo_banner_2_desktop_url', '', NOW()),
  ('home_promo_banner_2_mobile_url', '', NOW()),
  ('home_promo_banner_2_link', '', NOW()),
  ('home_promo_banner_3_desktop_url', '', NOW()),
  ('home_promo_banner_3_mobile_url', '', NOW()),
  ('home_promo_banner_3_link', '', NOW())
ON CONFLICT (key) DO NOTHING;
