'use client';

import {
  ArrowLeft,
  Check,
  ChevronDown,
  ExternalLink,
  ImagePlus,
  LoaderCircle,
  Move,
  Save,
  ShoppingBag,
  Star,
  Store,
  Trash2,
  ZoomIn,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

type ProductData = {
  id?: number | string;
  name: string;
  mainCategory: string;
  secondCategory: string;
  subCategory: string;
  price: number | '';
  description?: string | null;
  hasDiscount?: boolean;
  discountPrice?: number | '' | null;
  soldCount?: number | '' | null;
  rating: number | '';
  showRating?: boolean;
  imageUrl: string;
  imagePublicId?: string | null;
  imageUrl2?: string | null;
  imagePublicId2?: string | null;
  imageUrl3?: string | null;
  imagePublicId3?: string | null;
  imageUrl4?: string | null;
  imagePublicId4?: string | null;
  tokopediaUrl?: string | null;
  tiktokShopUrl?: string | null;
  isBestSeller?: boolean;
  isPromotion?: boolean;
};

type ProductFormProps = {
  mode: 'create' | 'edit';
  initialData?: ProductData;
};

type ImageSlot = {
  url: string;
  publicId: string;
  file: File | null;
  preview: string;
  x: number;
  y: number;
  zoom: number;
};

type UploadResult = {
  url: string;
  publicId: string;
};

const IMAGE_SLOT_LABELS = [
  'Foto utama / kartu produk',
  'Foto detail 2',
  'Foto detail 3',
  'Foto detail 4',
] as const;

const RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {RATING_OPTIONS.slice(0, value).map((star) => (
        <Star key={star} className="h-4 w-4 fill-amber-400 text-amber-400" strokeWidth={1.8} />
      ))}
    </span>
  );
}

function RatingSelect({
  value,
  onChange,
}: {
  value: number | '';
  onChange: (value: number | '') => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="admin-input flex min-h-11 w-full items-center justify-between gap-3 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {value === '' ? (
          <span className="text-slate-400">Pilih Rating</span>
        ) : (
          <span className="flex min-w-0 items-center gap-2.5">
            <RatingStars value={value} />
            <span className="truncate text-slate-800 dark:text-slate-100">{value} Bintang</span>
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Pilih rating produk"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl shadow-slate-950/20 dark:border-sky-300/15 dark:bg-[#0b182a] dark:shadow-black/50"
        >
          {RATING_OPTIONS.map((rating) => {
            const selected = value === rating;

            return (
              <button
                key={rating}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? 'bg-sky-500/[0.12] text-sky-700 dark:bg-sky-400/[0.12] dark:text-sky-100'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.06]'
                }`}
                onClick={() => {
                  onChange(rating);
                  setOpen(false);
                }}
              >
                <span className="flex items-center gap-2.5">
                  <RatingStars value={rating} />
                  <span>{rating} Bintang</span>
                </span>
                {selected && (
                  <Check className="h-4 w-4 text-sky-500 dark:text-sky-300" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatRupiah(value: number | '' | null | undefined) {
  if (value === '' || value === null || value === undefined) return '';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function parseRupiah(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  return digits ? Number(digits) : '';
}

function isValidOptionalWebUrl(value?: string | null) {
  if (!value?.trim()) return true;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function createInitialSlots(initialData?: ProductData): ImageSlot[] {
  const values = [
    [initialData?.imageUrl, initialData?.imagePublicId],
    [initialData?.imageUrl2, initialData?.imagePublicId2],
    [initialData?.imageUrl3, initialData?.imagePublicId3],
    [initialData?.imageUrl4, initialData?.imagePublicId4],
  ];

  return values.map(([url, publicId]) => ({
    url: String(url ?? ''),
    publicId: String(publicId ?? ''),
    file: null,
    preview: String(url ?? ''),
    x: 50,
    y: 50,
    zoom: 1,
  }));
}

function loadBrowserImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Foto tidak dapat dibaca. Gunakan file JPG, PNG, atau WebP yang valid.'));
    };

    image.src = objectUrl;
  });
}

async function cropImageToSquare(slot: ImageSlot, index: number) {
  if (!slot.file) return null;

  const image = await loadBrowserImage(slot.file);
  const size = 1200;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Browser tidak mendukung editor foto.');
  }

  const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = coverScale * slot.zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const maxOffsetX = Math.max(0, drawWidth - size);
  const maxOffsetY = Math.max(0, drawHeight - size);
  const drawX = -(maxOffsetX * slot.x) / 100;
  const drawY = -(maxOffsetY * slot.y) / 100;

  context.clearRect(0, 0, size, size);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Gagal membuat hasil crop foto.'));
      },
      'image/webp',
      0.92,
    );
  });

  const baseName = slot.file.name.replace(/\.[^/.]+$/, '') || `produk-${index + 1}`;
  return new File([blob], `${baseName}-square.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

export default function ProductForm({ mode, initialData }: ProductFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(() => createInitialSlots(initialData));
  const [form, setForm] = useState<ProductData>({
    name: initialData?.name || '',
    mainCategory: initialData?.mainCategory || '',
    secondCategory: initialData?.secondCategory || '',
    subCategory: initialData?.subCategory || '',
    price: initialData?.price ?? '',
    description: initialData?.description || '',
    hasDiscount: Boolean(initialData?.hasDiscount),
    discountPrice: initialData?.discountPrice ?? '',
    soldCount: initialData?.soldCount ?? 0,
    rating: initialData?.rating ?? '',
    showRating: initialData?.showRating !== false,
    imageUrl: initialData?.imageUrl || '',
    imagePublicId: initialData?.imagePublicId || '',
    imageUrl2: initialData?.imageUrl2 || '',
    imagePublicId2: initialData?.imagePublicId2 || '',
    imageUrl3: initialData?.imageUrl3 || '',
    imagePublicId3: initialData?.imagePublicId3 || '',
    imageUrl4: initialData?.imageUrl4 || '',
    imagePublicId4: initialData?.imagePublicId4 || '',
    tokopediaUrl: initialData?.tokopediaUrl || '',
    tiktokShopUrl: initialData?.tiktokShopUrl || '',
    isBestSeller: Boolean(initialData?.isBestSeller),
    isPromotion: Boolean(initialData?.isPromotion),
  });

  const selectedImageCount = useMemo(
    () => imageSlots.filter((slot) => Boolean(slot.preview || slot.url)).length,
    [imageSlots],
  );

  function updateField<K extends keyof ProductData>(key: K, value: ProductData[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateImageSlot(index: number, updater: (slot: ImageSlot) => ImageSlot) {
    setImageSlots((current) =>
      current.map((slot, slotIndex) => (slotIndex === index ? updater(slot) : slot)),
    );
  }

  function handleImage(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('File yang dipilih bukan gambar. Gunakan JPG, PNG, atau WebP.');
      return;
    }

    const preview = URL.createObjectURL(file);

    updateImageSlot(index, (slot) => {
      if (slot.preview.startsWith('blob:')) URL.revokeObjectURL(slot.preview);

      return {
        ...slot,
        file,
        preview,
        x: 50,
        y: 50,
        zoom: 1,
      };
    });

    setMessage('');
  }

  function clearImage(index: number) {
    updateImageSlot(index, (slot) => {
      if (slot.preview.startsWith('blob:')) URL.revokeObjectURL(slot.preview);

      return {
        url: '',
        publicId: '',
        file: null,
        preview: '',
        x: 50,
        y: 50,
        zoom: 1,
      };
    });
  }

  async function uploadImageSlot(slot: ImageSlot, index: number): Promise<UploadResult> {
    if (!slot.file) {
      return {
        url: slot.url,
        publicId: slot.publicId,
      };
    }

    const croppedFile = await cropImageToSquare(slot, index);
    if (!croppedFile) {
      return { url: slot.url, publicId: slot.publicId };
    }

    const data = new FormData();
    data.append('file', croppedFile);
    data.append('folder', 'products');

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: data,
    });

    const result = (await response.json()) as {
      url?: string;
      publicId?: string;
      message?: string;
    };

    if (!response.ok || !result.url) {
      throw new Error(result.message || `Upload ${IMAGE_SLOT_LABELS[index]} gagal.`);
    }

    return {
      url: result.url,
      publicId: result.publicId || '',
    };
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    try {
      setLoading(true);
      setMessage('');

      if (!form.name.trim()) throw new Error('Nama produk wajib diisi.');
      if (form.price === '' || Number(form.price) <= 0) {
        throw new Error('Harga produk wajib diisi dan harus lebih besar dari 0.');
      }
      if (form.rating === '') throw new Error('Rating produk wajib dipilih.');
      if (!imageSlots[0].file && !imageSlots[0].url) {
        throw new Error('Foto utama produk wajib dipilih.');
      }
      if (!isValidOptionalWebUrl(form.tokopediaUrl)) {
        throw new Error('URL Tokopedia harus lengkap, termasuk https://');
      }
      if (!isValidOptionalWebUrl(form.tiktokShopUrl)) {
        throw new Error('URL TikTok Shop harus lengkap, termasuk https://');
      }
      if (form.hasDiscount) {
        const discountPrice = Number(form.discountPrice) || 0;
        if (discountPrice <= 0 || discountPrice >= Number(form.price)) {
          throw new Error('Harga diskon harus lebih besar dari 0 dan lebih kecil dari harga lama.');
        }
      }

      const uploadedImages = await Promise.all(
        imageSlots.map((slot, index) => uploadImageSlot(slot, index)),
      );

      const payload = {
        name: form.name.trim(),
        mainCategory: form.mainCategory.trim(),
        secondCategory: form.secondCategory.trim(),
        subCategory: form.subCategory.trim(),
        price: Number(form.price),
        description: String(form.description ?? '').trim(),
        hasDiscount: Boolean(form.hasDiscount),
        discountPrice: form.hasDiscount ? Number(form.discountPrice) || null : null,
        soldCount: Math.max(0, Math.floor(Number(form.soldCount) || 0)),
        rating: Number(form.rating),
        showRating: form.showRating !== false,
        imageUrl: uploadedImages[0].url,
        imagePublicId: uploadedImages[0].publicId,
        imageUrl2: uploadedImages[1].url || null,
        imagePublicId2: uploadedImages[1].publicId || null,
        imageUrl3: uploadedImages[2].url || null,
        imagePublicId3: uploadedImages[2].publicId || null,
        imageUrl4: uploadedImages[3].url || null,
        imagePublicId4: uploadedImages[3].publicId || null,
        tokopediaUrl: form.tokopediaUrl?.trim() || null,
        tiktokShopUrl: form.tiktokShopUrl?.trim() || null,
        isBestSeller: Boolean(form.isBestSeller),
        isPromotion: Boolean(form.isPromotion),
      };

      const endpoint = mode === 'create' ? '/api/products' : `/api/products/${initialData?.id}`;
      const response = await fetch(endpoint, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan produk.');
      }

      setMessage(
        mode === 'create' ? 'Produk berhasil ditambahkan.' : 'Produk berhasil diperbarui.',
      );
      router.push('/admin/products');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={submitForm}>
      <section className="admin-panel rounded-[26px] px-6 py-7">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/8 text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
            aria-label="Kembali ke daftar produk"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-semibold text-white">
              {mode === 'create' ? 'Tambah Produk' : 'Edit Produk'}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Kelola informasi produk dan maksimal empat foto persegi.
            </p>
          </div>
        </div>
      </section>

      <section className="admin-panel rounded-[26px] p-6">
        <div className="grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Nama produk
            <input
              className="admin-input"
              placeholder="Nama Produk"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Kategori utama
              <input
                className="admin-input"
                placeholder="Kategori Utama"
                value={form.mainCategory}
                onChange={(event) => updateField('mainCategory', event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Kategori kedua
              <input
                className="admin-input"
                placeholder="Kategori Kedua"
                value={form.secondCategory}
                onChange={(event) => updateField('secondCategory', event.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Subkategori
              <input
                className="admin-input"
                placeholder="Sub Kategori"
                value={form.subCategory}
                onChange={(event) => updateField('subCategory', event.target.value)}
              />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium text-slate-200">
            Deskripsi produk
            <textarea
              className="admin-input min-h-32 resize-y"
              placeholder="Jelaskan fungsi, spesifikasi singkat, dan keunggulan produk."
              value={String(form.description ?? '')}
              onChange={(event) => updateField('description', event.target.value)}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Harga
              <input
                className="admin-input"
                type="text"
                inputMode="numeric"
                placeholder="Rp0"
                value={formatRupiah(form.price)}
                onChange={(event) => updateField('price', parseRupiah(event.target.value))}
              />
            </label>
            <div className="grid gap-2 text-sm font-medium text-slate-200">
              <span>Rating</span>
              <RatingSelect
                value={form.rating}
                onChange={(rating) => updateField('rating', rating)}
              />
            </div>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Jumlah terjual
              <input
                className="admin-input"
                type="number"
                min="0"
                step="1"
                value={form.soldCount ?? ''}
                onFocus={(event) => {
                  if (Number(form.soldCount) === 0) {
                    updateField('soldCount', '');
                  }

                  event.currentTarget.select();
                }}
                onBlur={() => {
                  if (form.soldCount === '' || form.soldCount === null) {
                    updateField('soldCount', 0);
                  }
                }}
                onChange={(event) => {
                  const value = event.target.value;

                  updateField('soldCount', value === '' ? '' : Math.max(0, Number(value)));
                }}
              />
            </label>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/8 bg-white/2.5 p-4 md:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                checked={Boolean(form.hasDiscount)}
                onChange={(event) => updateField('hasDiscount', event.target.checked)}
                className="h-4 w-4 rounded border-white/20"
              />
              Aktifkan harga diskon
            </label>
            <label className="grid gap-2 text-sm font-medium text-slate-200">
              Harga setelah diskon
              <input
                className="admin-input disabled:cursor-not-allowed disabled:opacity-50"
                type="text"
                inputMode="numeric"
                placeholder="Rp0"
                disabled={!form.hasDiscount}
                value={formatRupiah(form.discountPrice)}
                onChange={(event) => updateField('discountPrice', parseRupiah(event.target.value))}
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-300/10 bg-gradient-to-br from-emerald-400/[0.055] via-white/[0.02] to-cyan-400/[0.035] p-4">
            <div className="mb-4 flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-300/15 bg-emerald-400/[0.08] text-emerald-300 shadow-lg shadow-emerald-950/20">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Link Produk Marketplace</h3>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Opsional. Jika kosong, tombol detail produk memakai link toko global dari footer.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-slate-200">
                <span className="inline-flex items-center gap-2">
                  <Store className="h-4 w-4 text-emerald-400" /> URL produk Tokopedia
                </span>
                <div className="relative">
                  <input
                    className="admin-input pr-10"
                    type="url"
                    inputMode="url"
                    placeholder="https://www.tokopedia.com/nama-toko/produk"
                    value={form.tokopediaUrl || ''}
                    onChange={(event) => updateField('tokopediaUrl', event.target.value)}
                  />
                  <ExternalLink className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </label>

              <label className="grid gap-2 text-sm font-medium text-slate-200">
                <span className="inline-flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-cyan-300" /> URL produk TikTok Shop
                </span>
                <div className="relative">
                  <input
                    className="admin-input pr-10"
                    type="url"
                    inputMode="url"
                    placeholder="https://shop.tiktok.com/view/product/..."
                    value={form.tiktokShopUrl || ''}
                    onChange={(event) => updateField('tiktokShopUrl', event.target.value)}
                  />
                  <ExternalLink className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                checked={form.showRating !== false}
                onChange={(event) => updateField('showRating', event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20"
              />
              <span>
                Tampilkan rating bintang
                <small className="mt-1 block font-normal leading-5 text-slate-400">
                  Nonaktifkan untuk menyembunyikan bintang dan angka rating di halaman produk.
                </small>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                checked={form.isBestSeller}
                onChange={(event) => updateField('isBestSeller', event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20"
              />
              <span>
                Tandai sebagai produk terlaris
                <small className="mt-1 block font-normal leading-5 text-slate-400">
                  Produk dapat ditampilkan sebagai pilihan terlaris pada katalog.
                </small>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-fuchsia-300/10 bg-fuchsia-400/[0.035] p-4 text-sm font-medium text-slate-200">
              <input
                type="checkbox"
                checked={form.isPromotion}
                onChange={(event) => updateField('isPromotion', event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-fuchsia-500"
              />
              <span>
                Tampilkan sebagai promo
                <small className="mt-1 block font-normal leading-5 text-slate-400">
                  Produk otomatis muncul pada card promo di hero katalog.
                </small>
              </span>
            </label>
          </div>
        </div>
      </section>

      <section className="admin-panel rounded-[26px] p-6">
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-xl font-semibold text-white">Foto Produk</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-400">
              Foto baru dicrop menjadi 1:1 (1200×1200). Atur posisi dan zoom sebelum menyimpan. Foto
              utama dipakai pada kartu produk; tiga foto lainnya tampil di galeri detail.
            </p>
          </div>
          <span className="text-xs font-semibold text-sky-200">
            {selectedImageCount}/4 foto terisi
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {imageSlots.map((slot, index) => (
            <article
              key={IMAGE_SLOT_LABELS[index]}
              className="overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950/30"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] px-4 py-3">
                <div>
                  <strong className="text-sm text-white">{IMAGE_SLOT_LABELS[index]}</strong>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {index === 0 ? 'Wajib diisi' : 'Opsional'}
                  </p>
                </div>
                {(slot.preview || slot.url) && (
                  <button
                    type="button"
                    onClick={() => clearImage(index)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300/15 bg-red-400/[0.06] px-2.5 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/[0.12]"
                  >
                    <Trash2 size={13} /> Hapus
                  </button>
                )}
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_180px]">
                <div className="relative aspect-square overflow-hidden rounded-2xl border border-dashed border-white/[0.12] bg-white/[0.025]">
                  {slot.preview ? (
                    <Image
                      src={slot.preview}
                      alt={`Preview ${IMAGE_SLOT_LABELS[index]}`}
                      fill
                      unoptimized={slot.preview.startsWith('blob:')}
                      sizes="(max-width: 640px) 100vw, 360px"
                      className="select-none object-cover transition-transform duration-150"
                      style={{
                        objectPosition: `${slot.x}% ${slot.y}%`,
                        transform: `scale(${slot.zoom})`,
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-center text-slate-500">
                      <div>
                        <ImagePlus className="mx-auto h-9 w-9" strokeWidth={1.4} />
                        <p className="mt-2 text-xs">Belum ada foto</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
                    <ImagePlus size={17} />
                    {slot.preview ? 'Ganti foto' : 'Pilih foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => handleImage(index, event)}
                    />
                  </label>

                  <div className={`grid gap-3 ${slot.file ? '' : 'opacity-45'}`}>
                    <label className="grid gap-1.5 text-xs text-slate-400">
                      <span className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Move size={13} /> Horizontal
                        </span>
                        <span>{Math.round(slot.x)}%</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={slot.x}
                        disabled={!slot.file}
                        onChange={(event) =>
                          updateImageSlot(index, (current) => ({
                            ...current,
                            x: Number(event.target.value),
                          }))
                        }
                      />
                    </label>

                    <label className="grid gap-1.5 text-xs text-slate-400">
                      <span className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <Move size={13} className="rotate-90" /> Vertikal
                        </span>
                        <span>{Math.round(slot.y)}%</span>
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={slot.y}
                        disabled={!slot.file}
                        onChange={(event) =>
                          updateImageSlot(index, (current) => ({
                            ...current,
                            y: Number(event.target.value),
                          }))
                        }
                      />
                    </label>

                    <label className="grid gap-1.5 text-xs text-slate-400">
                      <span className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5">
                          <ZoomIn size={13} /> Zoom
                        </span>
                        <span>{slot.zoom.toFixed(2)}×</span>
                      </span>
                      <input
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={slot.zoom}
                        disabled={!slot.file}
                        onChange={(event) =>
                          updateImageSlot(index, (current) => ({
                            ...current,
                            zoom: Number(event.target.value),
                          }))
                        }
                      />
                    </label>
                  </div>

                  {!slot.file && slot.url && (
                    <p className="text-[11px] leading-4 text-slate-500">
                      Untuk mengubah crop foto lama, pilih kembali file fotonya.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            message.toLowerCase().includes('berhasil')
              ? 'border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-100'
              : 'border-red-300/15 bg-red-400/[0.06] text-red-100'
          }`}
          role="status"
        >
          {message}
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/admin/products"
          className="inline-flex h-12 items-center justify-center rounded-xl border border-white/[0.1] px-5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
        >
          Batal
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save size={17} />}
          {loading ? 'Memproses foto...' : 'Simpan Produk'}
        </button>
      </div>
    </form>
  );
}
