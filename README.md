# Katalog Teknik Mandiri Perkakas

Aplikasi katalog produk dan panel administrasi Mandiri Perkakas, dibangun dengan Next.js,
React, Neon PostgreSQL, Drizzle ORM, dan Cloudinary.

## Prasyarat

- Node.js 20 atau versi LTS yang lebih baru
- npm
- Database Neon PostgreSQL
- Akun Cloudinary

## Instalasi

```bash
npm ci
```

Salin `.env.example` menjadi `.env.local`, lalu isi variabel berikut:

```text
DATABASE_URL
ADMIN_EMAIL
ADMIN_PASSWORD_HASH
ADMIN_AUTH_SECRET
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Jangan menyimpan `.env.local`, password, hash produksi, token, atau connection string di Git,
spreadsheet, maupun dokumentasi publik.

Untuk membuat hash password admin:

```bash
npm run auth:hash-password -- "password-yang-kuat"
```

## Menjalankan Aplikasi

Development:

```bash
npm run dev
```

Validasi sebelum commit:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Production lokal:

```bash
npm run start
```

## Database

Skema aplikasi didefinisikan dengan Drizzle pada `db/schema.ts`. SQL tambahan yang bersifat
idempotent tersedia di folder `database/` dan `app/database/`.

Perintah Drizzle:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
```

Jalankan perubahan skema pada database staging terlebih dahulu. Pastikan `DATABASE_URL` Preview
dan Production di Vercel tidak menunjuk ke database yang sama bila pengujian melibatkan restore
atau penghapusan data.

## Backup dan Restore

Backup tersedia untuk super admin melalui menu **Admin > Backup**. File Excel menyimpan data
konten utama beserta sheet sistem yang diperlukan untuk restore.

Restore bersifat mengganti data tabel yang tercakup dan dijalankan secara atomik. Selalu:

1. Unduh backup terbaru.
2. Uji restore pada database staging.
3. Bandingkan jumlah record dan sampel data.
4. Lakukan restore produksi hanya setelah hasil staging terverifikasi.

Akun admin dan analytics tidak disertakan dalam backup konten.

## Deployment

Branch release adalah `katalog-web`. Sebelum deploy:

1. Pastikan lint, TypeScript, dan build berhasil.
2. Pastikan working tree bersih.
3. Push commit ke `mandiriperkasa/katalog-teknik`.
4. Verifikasi environment Vercel untuk scope Production.
5. Periksa runtime logs dan endpoint penting setelah deployment.

## Rollback

Catat commit deployment yang disetujui. Untuk rollback aplikasi, redeploy commit terakhir yang
stabil melalui Vercel. Rollback source tidak mengembalikan perubahan database; gunakan backup
terverifikasi bila pemulihan data diperlukan.

## Keamanan

- Semua endpoint tulis dibatasi dan memerlukan autentikasi sesuai perannya.
- Upload hanya menerima JPG, PNG, atau WebP dengan batas ukuran.
- Credential Cloudinary dan database hanya digunakan pada server.
- Route admin tidak boleh diindeks mesin pencari.
- Rotasi credential segera jika pernah disimpan atau dibagikan dalam bentuk plaintext.
