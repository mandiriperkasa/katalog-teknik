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
    ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE
  `;

  console.log('Kolom is_visible pada tabel products siap digunakan.');
}

main().catch((error) => {
  console.error('Gagal menyiapkan kolom is_visible:', error);
  process.exitCode = 1;
});
