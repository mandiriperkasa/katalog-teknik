INSERT INTO settings (key, value, updated_at)
VALUES ('general_favicon_url', '', NOW())
ON CONFLICT (key) DO NOTHING;
