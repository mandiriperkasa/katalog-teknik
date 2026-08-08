'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Boxes,
  ChevronDown,
  Eye,
  EyeOff,
  Filter,
  LoaderCircle,
  PackageOpen,
  Search,
  Star,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type ProductRow = {
  id?: number;
  legacyNo?: number | null;
  name?: string | null;
  brand?: string | null;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  showRating?: boolean | null;
  imageUrl?: string | null;
  isVisible?: boolean | null;
  isBestSeller?: boolean | null;
  isPromotion?: boolean | null;
};

function formatCurrency(value?: string | number | null) {
  const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));

  if (!Number.isFinite(number)) return value || '—';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function isTruthy(value?: boolean | string | null) {
  if (typeof value === 'boolean') return value;

  return ['true', 'ya', 'yes', '1'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [promotionUpdatingIds, setPromotionUpdatingIds] = useState<Set<number>>(() => new Set());
  const [visibilityUpdatingIds, setVisibilityUpdatingIds] = useState<Set<number>>(() => new Set());
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Semua kategori');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());

  async function handleDelete(id: number) {
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus produk ini?');

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus produk.');
      }

      setProducts((prev) => prev.filter((product) => product.id !== id));
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  }

  function toggleProductSelection(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(id)) next.delete(id);
      else next.add(id);

      return next;
    });
  }

  async function handlePromotionToggle(product: ProductRow) {
    if (!product.id || promotionUpdatingIds.has(product.id)) return;

    const productId = product.id;
    const nextValue = !isTruthy(product.isPromotion);
    setPromotionUpdatingIds((current) => new Set(current).add(productId));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPromotion: nextValue }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || 'Status promo gagal diperbarui.');
      }

      setProducts((current) =>
        current.map((item) => (item.id === productId ? { ...item, isPromotion: nextValue } : item)),
      );
    } catch (promotionError) {
      window.alert(
        promotionError instanceof Error ? promotionError.message : 'Status promo gagal diperbarui.',
      );
    } finally {
      setPromotionUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
    }
  }

  async function handleVisibilityToggle(product: ProductRow) {
    if (!product.id || visibilityUpdatingIds.has(product.id)) return;

    const productId = product.id;
    const nextValue = product.isVisible === false;
    setVisibilityUpdatingIds((current) => new Set(current).add(productId));

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: nextValue }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || 'Status tampilan produk gagal diperbarui.');
      }

      setProducts((current) =>
        current.map((item) => (item.id === productId ? { ...item, isVisible: nextValue } : item)),
      );
    } catch (visibilityError) {
      window.alert(
        visibilityError instanceof Error
          ? visibilityError.message
          : 'Status tampilan produk gagal diperbarui.',
      );
    } finally {
      setVisibilityUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(productId);
        return next;
      });
    }
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || bulkDeleting) return;

    const confirmed = window.confirm(
      `Hapus ${ids.length} produk terpilih? Produk dan foto terkait akan dihapus permanen.`,
    );

    if (!confirmed) return;

    setBulkDeleting(true);

    try {
      const results = await Promise.allSettled(
        ids.map(async (id) => {
          const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
          const result = (await response.json()) as { message?: string };

          if (!response.ok) {
            throw new Error(result.message || `Produk #${id} gagal dihapus.`);
          }

          return id;
        }),
      );

      const deletedIds = new Set(
        results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
      );
      const failedCount = results.length - deletedIds.size;

      setProducts((current) =>
        current.filter((product) => !product.id || !deletedIds.has(product.id)),
      );
      setSelectedIds((current) => {
        const next = new Set(current);
        deletedIds.forEach((id) => next.delete(id));
        return next;
      });

      if (failedCount > 0) {
        window.alert(
          `${deletedIds.size} produk berhasil dihapus, tetapi ${failedCount} produk gagal dihapus.`,
        );
      }
    } catch (deleteError) {
      window.alert(
        deleteError instanceof Error ? deleteError.message : 'Penghapusan massal gagal.',
      );
    } finally {
      setBulkDeleting(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/products?includeHidden=true', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Data produk tidak dapat dimuat.');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Format data produk dari API tidak valid.');
        }

        setProducts(data as ProductRow[]);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;

        console.error('Gagal memuat produk dari Neon:', requestError);
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Terjadi kesalahan saat memuat produk.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(
      products
        .map((product) => product.mainCategory?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    return ['Semua kategori', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory = category === 'Semua kategori' || product.mainCategory === category;
      const searchable = [
        product.name,
        product.brand,
        product.mainCategory,
        product.secondCategory,
        product.subCategory,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesCategory && (!keyword || searchable.includes(keyword));
    });
  }, [category, products, search]);

  const visibleProductIds = filteredProducts.flatMap((product) => (product.id ? [product.id] : []));
  const allVisibleSelected =
    visibleProductIds.length > 0 && visibleProductIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleProductIds.some((id) => selectedIds.has(id));

  function toggleAllVisibleProducts() {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        visibleProductIds.forEach((id) => next.delete(id));
      } else {
        visibleProductIds.forEach((id) => next.add(id));
      }

      return next;
    });
  }

  const bestSellerCount = products.filter((product) => isTruthy(product.isBestSeller)).length;

  return (
    <div className="space-y-6">
      <section className="admin-panel relative overflow-hidden rounded-[26px] px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-semibold text-blue-200">
              <Boxes className="h-3.5 w-3.5" />
              Data katalog
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Manajemen Produk
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Telusuri produk yang tersimpan langsung di Neon PostgreSQL.
            </p>
          </div>

          <Link
            href="/admin/products/add"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Tambah Produk
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
                Total produk
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {loading ? '—' : products.length}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-300/10 bg-amber-400/[0.045] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-amber-200/45">
                Terlaris
              </p>
              <p className="mt-1 text-xl font-semibold text-amber-100">
                {loading ? '—' : bestSellerCount}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-panel rounded-3xl p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-600" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau kategori produk..."
              className="admin-field h-12 rounded-xl pl-11 pr-11 text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-600 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative lg:w-64">
            <Filter className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="admin-field h-12 appearance-none rounded-xl pl-11 pr-10 text-sm"
            >
              {categories.map((item) => (
                <option key={item} value={item} className="bg-[#0b1626]">
                  {item}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs text-slate-600">
          <span>
            Menampilkan{' '}
            <strong className="font-semibold text-slate-400">{filteredProducts.length}</strong> dari{' '}
            {products.length} produk
          </span>
          {(search || category !== 'Semua kategori') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setCategory('Semua kategori');
              }}
              className="font-semibold text-sky-300 transition hover:text-sky-200"
            >
              Reset filter
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-400/[0.06] px-5 py-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          {error}
        </div>
      )}

      <section className="admin-panel overflow-hidden rounded-[24px]">
        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-300/10 bg-sky-400/[0.04] px-5 py-3">
            <span className="text-sm font-semibold text-sky-100">
              {selectedIds.size} produk dipilih
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                disabled={bulkDeleting}
                className="min-h-9 rounded-lg px-3 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                Batalkan pilihan
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-red-300/15 bg-red-400/[0.08] px-3.5 text-xs font-semibold text-red-200 transition hover:bg-red-400/[0.14] disabled:cursor-wait disabled:opacity-60"
              >
                {bulkDeleting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {bulkDeleting ? 'Menghapus...' : 'Hapus terpilih'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-slate-500">
            <LoaderCircle className="h-7 w-7 animate-spin text-sky-300" />
            <p className="text-sm">Memuat produk dari Neon PostgreSQL...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-600">
              <PackageOpen className="h-7 w-7" />
            </span>
            <h3 className="mt-5 font-semibold text-slate-200">Produk tidak ditemukan</h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Coba gunakan kata kunci lain atau kembalikan filter kategori ke semua kategori.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto admin-scrollbar">
            <table className="w-full min-w-[1220px] text-left">
              <thead>
                <tr className="border-b border-white/[0.07] bg-white/[0.025] text-[10px] font-bold uppercase tracking-[0.13em] text-slate-600">
                  <th className="w-12 px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = someVisibleSelected && !allVisibleSelected;
                      }}
                      onChange={toggleAllVisibleProducts}
                      aria-label={
                        allVisibleSelected
                          ? 'Batalkan pilihan semua produk'
                          : 'Pilih semua produk yang tampil'
                      }
                      className="h-4 w-4 cursor-pointer accent-sky-500"
                    />
                  </th>
                  <th className="px-6 py-4">Produk</th>
                  <th className="px-4 py-4">Kategori</th>
                  <th className="px-4 py-4">Harga</th>
                  <th className="px-4 py-4">Rating</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-center">Tampilan</th>
                  <th className="px-4 py-4 text-center">Promo</th>
                  <th className="px-6 py-4 text-right">Nomor</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.055]">
                <AnimatePresence initial={false}>
                  {filteredProducts.map((product, index) => (
                    <motion.tr
                      key={`${product.legacyNo ?? index}-${product.name ?? 'product'}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="group transition hover:bg-sky-400/[0.025]"
                    >
                      <td className="px-4 py-4 text-center">
                        {product.id && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product.id)}
                            onChange={() => toggleProductSelection(product.id!)}
                            aria-label={`Pilih ${product.name || `produk #${product.id}`}`}
                            className="h-4 w-4 cursor-pointer accent-sky-500"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.035]">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name || 'Produk'}
                                fill
                                sizes="56px"
                                className="object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <Boxes className="absolute inset-0 m-auto h-5 w-5 text-slate-700" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[340px] truncate text-sm font-semibold text-slate-200">
                              {product.name || 'Produk tanpa nama'}
                            </p>
                            <p className="mt-1 max-w-[300px] truncate text-xs text-slate-600">
                              {[product.secondCategory, product.subCategory]
                                .filter(Boolean)
                                .join(' • ') || 'Detail kategori belum tersedia'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex rounded-lg border border-blue-300/10 bg-blue-400/[0.055] px-2.5 py-1 text-xs font-medium text-blue-200">
                          {product.mainCategory || 'Tanpa kategori'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-sky-200">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-4">
                        {product.showRating !== false ? (
                          <span className="inline-flex items-center gap-1.5 text-sm text-amber-200">
                            <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                            {product.rating || '—'}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">Disembunyikan</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {isTruthy(product.isBestSeller) ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/10 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                            Terlaris
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">Reguler</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          disabled={
                            !product.id ||
                            (product.id ? visibilityUpdatingIds.has(product.id) : false)
                          }
                          onClick={() => void handleVisibilityToggle(product)}
                          className={`inline-flex min-h-9 min-w-[104px] items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold transition disabled:cursor-wait disabled:opacity-55 ${
                            product.isVisible !== false
                              ? 'border-emerald-300/15 bg-emerald-400/[0.08] text-emerald-200 hover:bg-emerald-400/[0.14]'
                              : 'border-slate-300/10 bg-slate-400/[0.05] text-slate-500 hover:bg-slate-400/[0.1] hover:text-slate-300'
                          }`}
                          aria-label={`${product.isVisible !== false ? 'Sembunyikan' : 'Tampilkan'} ${product.name || 'produk'} di katalog`}
                          title={
                            product.isVisible !== false
                              ? 'Klik untuk menyembunyikan produk'
                              : 'Klik untuk menampilkan produk'
                          }
                        >
                          {product.id && visibilityUpdatingIds.has(product.id) ? (
                            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                          ) : product.isVisible !== false ? (
                            <Eye className="h-3.5 w-3.5" />
                          ) : (
                            <EyeOff className="h-3.5 w-3.5" />
                          )}
                          {product.isVisible !== false ? 'Tampil' : 'Tidak tampil'}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <label className="inline-flex cursor-pointer items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isTruthy(product.isPromotion)}
                            disabled={
                              !product.id ||
                              (product.id ? promotionUpdatingIds.has(product.id) : false)
                            }
                            onChange={() => void handlePromotionToggle(product)}
                            className="h-4 w-4 cursor-pointer accent-fuchsia-500 disabled:cursor-wait disabled:opacity-50"
                            aria-label={`${isTruthy(product.isPromotion) ? 'Nonaktifkan' : 'Aktifkan'} promo ${product.name || 'produk'}`}
                          />
                        </label>
                      </td>
                      <td className="px-6 py-4 text-right text-xs font-medium text-slate-600">
                        #{product.legacyNo || index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-blue-300/10 bg-blue-400/[0.05] text-blue-200 transition hover:bg-blue-400/10"
                            title="Edit produk"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => product.id && handleDelete(product.id)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-red-300/10 bg-red-400/[0.05] text-red-200 transition hover:bg-red-400/10"
                            title="Hapus produk"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-center text-xs leading-5 text-slate-600">
        Halaman ini membaca data langsung dari Neon PostgreSQL. Halaman ini membaca dan mengelola
        data langsung dari Neon PostgreSQL.
      </p>
    </div>
  );
}
