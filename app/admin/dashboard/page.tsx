'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  CheckCircle2,
  FilePenLine,
  PackageCheck,
  Settings2,
  Share2,
  Sparkles,
  Star,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { useSheetData } from '../../hooks/useSheetData';

type ProductRow = {
  id?: number;
  legacyNo?: number | string | null;
  name?: string | null;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  rating?: number | string | null;
  imageUrl?: string | null;
  isBestSeller?: boolean | string | null;
};

type SettingRow = {
  key?: string;
  value?: string;
};

const quickActions = [
  {
    href: '/admin/products',
    title: 'Kelola produk',
    description: 'Lihat dan periksa seluruh katalog yang tersimpan.',
    icon: Boxes,
  },
  {
    href: '/admin/analytics',
    title: 'Buka analytics',
    description: 'Lihat grafik kategori, rating, harga, dan produk terlaris.',
    icon: BarChart3,
  },
  {
    href: '/admin/settings',
    title: 'Perbarui konten',
    description: 'Ubah tulisan hero, footer, dan informasi website.',
    icon: FilePenLine,
  },
  {
    href: '/admin/social-media',
    title: 'Atur sosial media',
    description: 'Perbarui tautan sosial media yang tampil di footer.',
    icon: Share2,
  },
];

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

export default function DashboardPage() {
  const {
    data: productData,
    loading: productsLoading,
    error: productsError,
    refresh: refreshProducts,
  } = useSheetData<ProductRow>('Products');

  const {
    data: settingData,
    loading: settingsLoading,
    error: settingsError,
    refresh: refreshSettings,
  } = useSheetData('Settings');

  useEffect(() => {
    // React expects the effect callback to return void/destructor (not JSX).
    // refreshProducts() returns a Promise; we just fire-and-forget.
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    void refreshSettings();
  }, [refreshSettings]);

  const products = productData as ProductRow[];
  const settings = settingData as SettingRow[];
  const bestSellerCount = products.filter((item) => isTruthy(item.isBestSeller)).length;
  const socialKeys = new Set([
    'link_tiktok',
    'link_fb',
    'link_youtube',
    'link_instagram',
    'link_tokopedia',
    'link_tiktok_shop',
  ]);
  const activeSocialCount = settings.filter(
    (item) => item.key && socialKeys.has(item.key) && item.value?.trim(),
  ).length;

  const stats = [
    {
      label: 'Total Produk',
      value: productsLoading ? '—' : products.length.toString(),
      detail: 'Data katalog aktif',
      icon: Boxes,
      accent: 'from-blue-500/25 to-blue-400/[0.05]',
      iconClass: 'text-blue-200 bg-blue-400/10 border-blue-300/15',
    },
    {
      label: 'Produk Terlaris',
      value: productsLoading ? '—' : bestSellerCount.toString(),
      detail: 'Ditandai sebagai produk terlaris',
      icon: Star,
      accent: 'from-amber-500/20 to-amber-300/[0.04]',
      iconClass: 'text-amber-200 bg-amber-400/10 border-amber-300/15',
    },
    {
      label: 'Pengaturan Konten',
      value: settingsLoading ? '—' : settings.length.toString(),
      detail: 'Field dapat dikelola',
      icon: Settings2,
      accent: 'from-violet-500/20 to-violet-300/[0.04]',
      iconClass: 'text-violet-200 bg-violet-400/10 border-violet-300/15',
    },
    {
      label: 'Sosial Media Aktif',
      value: settingsLoading ? '—' : `${activeSocialCount}/${socialKeys.size}`,
      detail: 'Tautan footer terisi',
      icon: Share2,
      accent: 'from-cyan-500/20 to-cyan-300/[0.04]',
      iconClass: 'text-cyan-200 bg-cyan-400/10 border-cyan-300/15',
    },
  ];

  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? 'Selamat pagi'
      : hour < 15
        ? 'Selamat siang'
        : hour < 19
          ? 'Selamat sore'
          : 'Selamat malam';

  return (
    <div className="space-y-7">
      <section className="admin-panel relative overflow-hidden rounded-[28px] px-6 py-7 sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-400/[0.07] px-3.5 py-1.5 text-xs font-semibold text-sky-200">
              <Sparkles className="h-3.5 w-3.5" />
              Pusat kendali website
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {greeting}, Administrator.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">
              Pantau katalog dan perbarui konten website dari satu ruang kerja yang lebih
              terstruktur.
            </p>
          </div>

          <Link
            href="/admin/products"
            className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(14,165,233,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(14,165,233,0.3)] lg:self-auto"
          >
            Buka katalog
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {(productsError || settingsError) && (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] px-5 py-4 text-sm text-amber-100">
          Sebagian ringkasan belum dapat dimuat. Data utama tetap dapat dikelola melalui menu
          terkait.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.article
              key={stat.label}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.35 }}
              className={`admin-panel group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 ${stat.accent}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{stat.detail}</p>
                </div>
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${stat.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="admin-panel overflow-hidden rounded-[24px]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h3 className="font-semibold text-white">Produk terbaru</h3>
              <p className="mt-1 text-xs text-slate-500">
                Ringkasan lima produk pertama dari database Neon.
              </p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-sky-300 transition hover:text-sky-200"
            >
              Lihat semua
            </Link>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {productsLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex animate-pulse items-center gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="h-11 w-11 rounded-xl bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/5 rounded bg-white/[0.06]" />
                    <div className="h-2.5 w-1/4 rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                Belum ada data produk.
              </div>
            ) : (
              products.slice(0, 5).map((product, index) => (
                <div
                  key={`${product.name}-${index}`}
                  className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/[0.025] sm:px-6"
                >
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.04]">
                    {product.imageUrl ? (
                      <Image
                        src={product.imageUrl}
                        alt={product.name || 'Produk'}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <PackageCheck className="absolute inset-0 m-auto h-5 w-5 text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-200">
                      {product.name || 'Produk tanpa nama'}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {product.mainCategory || 'Tanpa kategori'}
                    </p>
                  </div>
                  <p className="hidden shrink-0 text-xs font-semibold text-sky-300 sm:block">
                    {formatCurrency(product.price)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-panel rounded-[24px] p-5 sm:p-6">
          <div className="mb-5">
            <h3 className="font-semibold text-white">Akses cepat</h3>
            <p className="mt-1 text-xs text-slate-500">
              Lanjutkan ke aktivitas yang paling sering digunakan.
            </p>
          </div>

          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.href}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + index * 0.06 }}
                >
                  <Link
                    href={action.href}
                    className="group flex items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-sky-300/15 hover:bg-sky-400/[0.055]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.04] text-slate-400 transition group-hover:border-sky-300/15 group-hover:bg-sky-400/10 group-hover:text-sky-200">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-200">
                        {action.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-600">
                        {action.description}
                      </span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-700 transition group-hover:text-sky-300" />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-300/10 bg-emerald-400/[0.055] p-4">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <p className="text-xs font-semibold text-emerald-100">Sistem terhubung</p>
              <p className="mt-1 text-xs leading-5 text-emerald-200/55">
                Data dibaca langsung dari Neon PostgreSQL.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
