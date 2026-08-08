import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';

config({ path: '.env.local', override: true });
config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL belum tersedia.');
}

async function main() {
  const sql = neon(databaseUrl as string);

  await sql`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS brand TEXT
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS products_brand_lower_idx
    ON products (LOWER(brand))
  `;

  console.log('Kolom brand dan indeks merek pada tabel products siap digunakan.');
}

main().catch((error) => {
  console.error('Gagal menyiapkan kolom brand:', error);
  process.exitCode = 1;
});
