'use client';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  BadgeDollarSign,
  BarChart3,
  Boxes,
  Download,
  Layers3,
  LineChart,
  PackageCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

import { useSheetData } from '../../hooks/useSheetData';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

type ProductRow = {
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price: number;
  rating?: number | null;
  isBestSeller: boolean;
};

type CountEntry = {
  label: string;
  value: number;
};

const palette = [
  'rgba(56, 189, 248, 0.82)',
  'rgba(99, 102, 241, 0.82)',
  'rgba(168, 85, 247, 0.82)',
  'rgba(16, 185, 129, 0.82)',
  'rgba(245, 158, 11, 0.82)',
  'rgba(244, 63, 94, 0.82)',
  'rgba(20, 184, 166, 0.82)',
];

function numericValue(value?: number | string | null) {
  const parsed = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));

  return Number.isFinite(parsed) ? parsed : 0;
}

function cleanLabel(value?: string | null, fallback = 'Lainnya') {
  return value?.trim() || fallback;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    notation: value >= 1_000_000_000 ? 'compact' : 'standard',
  }).format(value);
}

function sortEntries(map: Map<string, number>, limit?: number): CountEntry[] {
  const entries = Array.from(map.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  return typeof limit === 'number' ? entries.slice(0, limit) : entries;
}

const barOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1100,
    easing: 'easeOutQuart',
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(2, 8, 23, 0.94)',
      borderColor: 'rgba(125, 211, 252, 0.18)',
      borderWidth: 1,
      padding: 12,
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10, weight: 600 } },
      border: { display: false },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.08)' },
      ticks: { color: '#64748b', precision: 0, font: { size: 10 } },
      border: { display: false },
    },
  },
};

const horizontalBarOptions: ChartOptions<'bar'> = {
  ...barOptions,
  indexAxis: 'y',
  scales: {
    x: {
      beginAtZero: true,
      grid: { color: 'rgba(148, 163, 184, 0.08)' },
      ticks: { color: '#64748b', precision: 0, font: { size: 10 } },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10, weight: 600 } },
      border: { display: false },
    },
  },
};

const doughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  animation: {
    duration: 1200,
    easing: 'easeOutQuart',
    animateRotate: true,
    animateScale: true,
  },
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        color: '#94a3b8',
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 18,
        font: { size: 10, weight: 600 },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(2, 8, 23, 0.94)',
      borderColor: 'rgba(125, 211, 252, 0.18)',
      borderWidth: 1,
      padding: 12,
      titleColor: '#f8fafc',
      bodyColor: '#cbd5e1',
    },
  },
};

function ProductAnalytics() {
  const { data, loading, error, refresh } = useSheetData<ProductRow>('Products');
  const products = data;

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const analytics = useMemo(() => {
    const mainCategoryMap = new Map<string, number>();
    const secondCategoryMap = new Map<string, number>();
    const subCategoryMap = new Map<string, number>();
    const priceByCategory = new Map<string, { total: number; count: number }>();
    const ratingMap = new Map<string, number>();

    let totalPrice = 0;
    let validPriceCount = 0;
    let totalRating = 0;
    let validRatingCount = 0;
    let bestSellerCount = 0;

    products.forEach((product) => {
      const main = cleanLabel(product.mainCategory);

      const second = cleanLabel(product.secondCategory);

      const sub = cleanLabel(product.subCategory);

      const price = numericValue(product.price);

      const rating = numericValue(product.rating);

      mainCategoryMap.set(main, (mainCategoryMap.get(main) ?? 0) + 1);
      secondCategoryMap.set(second, (secondCategoryMap.get(second) ?? 0) + 1);
      subCategoryMap.set(sub, (subCategoryMap.get(sub) ?? 0) + 1);

      if (price > 0) {
        totalPrice += price;
        validPriceCount += 1;
        const current = priceByCategory.get(main) ?? { total: 0, count: 0 };
        priceByCategory.set(main, { total: current.total + price, count: current.count + 1 });
      }

      if (rating > 0) {
        totalRating += rating;
        validRatingCount += 1;
        const ratingBucket = Math.max(1, Math.min(5, Math.round(rating))).toString();
        ratingMap.set(ratingBucket, (ratingMap.get(ratingBucket) ?? 0) + 1);
      }

      if (product.isBestSeller) {
        bestSellerCount += 1;
      }
    });

    const priceCategoryEntries = Array.from(priceByCategory.entries())
      .map(([label, item]) => ({ label, value: item.total / item.count }))
      .sort((a, b) => b.value - a.value);

    const categoryEntries = sortEntries(mainCategoryMap);
    const secondEntries = sortEntries(secondCategoryMap, 7);
    const subEntries = sortEntries(subCategoryMap, 7);

    return {
      totalProducts: products.length,
      bestSellerCount,
      regularCount: Math.max(0, products.length - bestSellerCount),
      averagePrice: validPriceCount > 0 ? totalPrice / validPriceCount : 0,
      averageRating: validRatingCount > 0 ? totalRating / validRatingCount : 0,
      mainCategoryCount: mainCategoryMap.size,
      secondCategoryCount: secondCategoryMap.size,
      subCategoryCount: subCategoryMap.size,
      categoryEntries,
      secondEntries,
      subEntries,
      priceCategoryEntries,
      ratingEntries: ['1', '2', '3', '4', '5'].map((label) => ({
        label: `${label} bintang`,
        value: ratingMap.get(label) ?? 0,
      })),
      topCategory: categoryEntries[0]?.label ?? '—',
      topSubCategory: subEntries[0]?.label ?? '—',
    };
  }, [products]);

  const categoryChart = {
    labels: analytics.categoryEntries.map((item) => item.label),
    datasets: [
      {
        label: 'Produk',
        data: analytics.categoryEntries.map((item) => item.value),
        backgroundColor: analytics.categoryEntries.map(
          (_, index) => palette[index % palette.length],
        ),
        borderRadius: 9,
        borderSkipped: false,
        maxBarThickness: 44,
      },
    ],
  };

  const secondCategoryChart = {
    labels: analytics.secondEntries.map((item) => item.label),
    datasets: [
      {
        label: 'Produk',
        data: analytics.secondEntries.map((item) => item.value),
        backgroundColor: analytics.secondEntries.map((_, index) => palette[index % palette.length]),
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 30,
      },
    ],
  };

  const bestsellerChart = {
    labels: ['Terlaris', 'Produk reguler'],
    datasets: [
      {
        data: [analytics.bestSellerCount, analytics.regularCount],
        backgroundColor: ['rgba(245, 158, 11, 0.9)', 'rgba(56, 189, 248, 0.34)'],
        borderColor: ['rgba(251, 191, 36, 0.8)', 'rgba(125, 211, 252, 0.34)'],
        borderWidth: 1,
        hoverOffset: 8,
      },
    ],
  };

  const ratingChart = {
    labels: analytics.ratingEntries.map((item) => item.label),
    datasets: [
      {
        label: 'Produk',
        data: analytics.ratingEntries.map((item) => item.value),
        backgroundColor: 'rgba(168, 85, 247, 0.72)',
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 42,
      },
    ],
  };

  const exportSummary = () => {
    const rows = [
      ['Metrik', 'Nilai'],
      ['Total produk', analytics.totalProducts.toString()],
      ['Produk terlaris', analytics.bestSellerCount.toString()],
      ['Rata-rata harga', analytics.averagePrice.toFixed(0)],
      ['Rata-rata rating', analytics.averageRating.toFixed(2)],
      ['Kategori utama', analytics.mainCategoryCount.toString()],
      ['Kategori kedua', analytics.secondCategoryCount.toString()],
      ['Subkategori', analytics.subCategoryCount.toString()],
      ...analytics.categoryEntries.map((item) => [
        `Kategori: ${item.label}`,
        item.value.toString(),
      ]),
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `analytics-katalog-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const metrics = [
    {
      label: 'Total Produk',
      value: loading ? '—' : analytics.totalProducts.toString(),
      detail: `${analytics.mainCategoryCount} kategori utama`,
      icon: Boxes,
      className: 'from-blue-500/24 to-blue-400/[0.04]',
      iconClass: 'border-blue-300/15 bg-blue-400/10 text-blue-200',
    },
    {
      label: 'Produk Terlaris',
      value: loading ? '—' : analytics.bestSellerCount.toString(),
      detail:
        analytics.totalProducts > 0
          ? `${Math.round((analytics.bestSellerCount / analytics.totalProducts) * 100)}% dari katalog`
          : 'Belum ada data',
      icon: Star,
      className: 'from-amber-500/22 to-amber-300/[0.04]',
      iconClass: 'border-amber-300/15 bg-amber-400/10 text-amber-200',
    },
    {
      label: 'Rata-rata Harga',
      value: loading ? '—' : formatCurrency(analytics.averagePrice),
      detail: 'Dihitung dari harga valid',
      icon: BadgeDollarSign,
      className: 'from-emerald-500/20 to-emerald-300/[0.04]',
      iconClass: 'border-emerald-300/15 bg-emerald-400/10 text-emerald-200',
    },
    {
      label: 'Rata-rata Rating',
      value: loading ? '—' : analytics.averageRating.toFixed(1),
      detail: 'Skala 1 sampai 5',
      icon: TrendingUp,
      className: 'from-violet-500/22 to-violet-300/[0.04]',
      iconClass: 'border-violet-300/15 bg-violet-400/10 text-violet-200',
    },
  ];

  return (
    <div className="space-y-7">
      <section className="admin-panel relative overflow-hidden rounded-[28px] px-6 py-7 sm:px-8 sm:py-9">
        <motion.div
          aria-hidden="true"
          className="absolute -right-12 -top-24 h-72 w-72 rounded-full bg-indigo-500/12 blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, -14, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 right-1/3 h-36 w-36 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ y: [0, -18, 0], opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3.5 py-1.5 text-xs font-semibold text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Data intelligence katalog
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Analytics yang berubah mengikuti database.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
              Pantau komposisi katalog, performa kategori, rating, harga, dan produk terlaris
              melalui visualisasi yang dihitung langsung dari spreadsheet.
            </p>
          </div>

          <button
            type="button"
            onClick={exportSummary}
            disabled={loading || products.length === 0}
            className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.055] px-5 text-sm font-semibold text-slate-200 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-cyan-400/10 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40 lg:self-auto"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] px-5 py-4 text-sm text-amber-100">
          Analytics belum dapat memuat data online: {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.article
              key={metric.label}
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.07, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -5 }}
              className={`admin-panel group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 ${metric.className}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                    {metric.label}
                  </p>
                  <p className="mt-3 truncate text-2xl font-semibold tracking-tight text-white">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">{metric.detail}</p>
                </div>
                <span
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${metric.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </div>
            </motion.article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16, duration: 0.5 }}
          className="admin-panel overflow-hidden rounded-[24px]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h3 className="font-semibold text-white">Distribusi kategori utama</h3>
              <p className="mt-1 text-xs text-slate-500">
                Jumlah produk pada setiap kategori utama.
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-sky-300/10 bg-sky-400/[0.07] text-sky-200">
              <BarChart3 className="h-5 w-5" />
            </span>
          </div>
          <div className="h-[330px] p-5 sm:p-6">
            {loading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/[0.035]" />
            ) : (
              <Bar data={categoryChart} options={barOptions} />
            )}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.5 }}
          className="admin-panel overflow-hidden rounded-[24px]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h3 className="font-semibold text-white">Komposisi terlaris</h3>
              <p className="mt-1 text-xs text-slate-500">
                Perbandingan produk unggulan dan reguler.
              </p>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-amber-300/10 bg-amber-400/[0.07] text-amber-200">
              <Target className="h-5 w-5" />
            </span>
          </div>
          <div className="relative h-[330px] p-5 sm:p-6">
            {loading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/[0.035]" />
            ) : (
              <>
                <Doughnut data={bestsellerChart} options={doughnutOptions} />
                <div className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="block text-3xl font-semibold text-white">
                    {analytics.bestSellerCount}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    Terlaris
                  </span>
                </div>
              </>
            )}
          </div>
        </motion.article>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.5 }}
          className="admin-panel overflow-hidden rounded-[24px]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h3 className="font-semibold text-white">Kategori kedua teratas</h3>
              <p className="mt-1 text-xs text-slate-500">
                Tujuh kategori kedua dengan produk terbanyak.
              </p>
            </div>
            <Layers3 className="h-5 w-5 text-violet-300" />
          </div>
          <div className="h-[340px] p-5 sm:p-6">
            {loading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/[0.035]" />
            ) : (
              <Bar data={secondCategoryChart} options={horizontalBarOptions} />
            )}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
          className="admin-panel overflow-hidden rounded-[24px]"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-5 sm:px-6">
            <div>
              <h3 className="font-semibold text-white">Sebaran rating produk</h3>
              <p className="mt-1 text-xs text-slate-500">
                Jumlah produk berdasarkan rating yang dibulatkan.
              </p>
            </div>
            <LineChart className="h-5 w-5 text-emerald-300" />
          </div>
          <div className="h-[340px] p-5 sm:p-6">
            {loading ? (
              <div className="h-full animate-pulse rounded-2xl bg-white/[0.035]" />
            ) : (
              <Bar data={ratingChart} options={barOptions} />
            )}
          </div>
        </motion.article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.article
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.36, duration: 0.5 }}
          className="admin-panel rounded-[24px] p-5 sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/10 bg-cyan-400/[0.07] text-cyan-200">
              <PackageCheck className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-white">Insight otomatis</h3>
              <p className="mt-1 text-xs text-slate-500">
                Ringkasan cepat berdasarkan data saat ini.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              [
                'Kategori dominan',
                analytics.topCategory,
                `${analytics.categoryEntries[0]?.value ?? 0} produk`,
              ],
              [
                'Subkategori dominan',
                analytics.topSubCategory,
                `${analytics.subEntries[0]?.value ?? 0} produk`,
              ],
              [
                'Struktur katalog',
                `${analytics.mainCategoryCount} / ${analytics.secondCategoryCount} / ${analytics.subCategoryCount}`,
                'Utama / kedua / subkategori',
              ],
              [
                'Rasio terlaris',
                analytics.totalProducts > 0
                  ? `${Math.round((analytics.bestSellerCount / analytics.totalProducts) * 100)}%`
                  : '0%',
                'Dari keseluruhan katalog',
              ],
            ].map(([label, value, detail], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.06 }}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-200">{detail}</p>
                </div>
                <strong className="max-w-[46%] truncate text-right text-sm text-cyan-200">
                  {value}
                </strong>
              </motion.div>
            ))}
          </div>
        </motion.article>

        <motion.article
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="admin-panel relative overflow-hidden rounded-[24px] p-5 sm:p-6"
        >
          <div
            aria-hidden="true"
            className="absolute -bottom-16 -right-16 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl"
          />
          <div className="relative flex h-full flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/10 bg-emerald-400/[0.06] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.13em] text-emerald-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                Tracker siap deploy
              </div>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-white">
                Vercel Web Analytics ikut diaktifkan.
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-7 text-slate-400">
                Saat proyek dipublikasikan di Vercel, page view dan performa kunjungan dapat direkam
                oleh Vercel Analytics. Grafik pada halaman ini tetap menggunakan data katalog nyata
                dari spreadsheet dan tidak membuat angka kunjungan palsu.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/products"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(14,165,233,0.2)] transition hover:-translate-y-0.5"
              >
                Buka katalog <ArrowUpRight className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={exportSummary}
                disabled={loading || products.length === 0}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-semibold text-slate-300 transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
              >
                <Download className="h-4 w-4" /> Export ringkasan
              </button>
            </div>
          </div>
        </motion.article>
      </section>
    </div>
  );
}

type VisitAnalyticsData = {
  days: number;
  totals: {
    views: number;
    visitors: number;
    todayVisitors: number;
    pages: number;
  };
  daily: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ name: string; value: number }>;
  referrers: Array<{ name: string; value: number }>;
  devices: Array<{ name: string; value: number }>;
};

const visitNumberFormatter = new Intl.NumberFormat('id-ID');

function VisitAnalytics() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<VisitAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`, {
        cache: 'no-store',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Gagal memuat analytics kunjungan.');
      }

      setData(payload);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Gagal memuat analytics kunjungan.',
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadData();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadData]);

  const maxDaily = useMemo(
    () => Math.max(1, ...(data?.daily.map((item) => item.views) || [1])),
    [data],
  );

  return (
    <div className="space-y-6">
      <section className="admin-panel rounded-[28px] px-6 py-7 sm:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
              Analytics internal
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">Kunjungan katalog</h2>
            <p className="mt-2 text-sm text-slate-400">
              Data kunjungan halaman publik tersimpan langsung di NeonDB.
            </p>
          </div>

          <div className="flex gap-2">
            <select
              value={days}
              onChange={(event) => setDays(Number(event.target.value))}
              className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white"
            >
              <option value={7}>7 hari</option>
              <option value={14}>14 hari</option>
              <option value={30}>30 hari</option>
            </select>

            <button
              type="button"
              onClick={() => void loadData()}
              className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Refresh
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Page views', data?.totals.views ?? 0],
          ['Pengunjung', data?.totals.visitors ?? 0],
          ['Pengunjung hari ini', data?.totals.todayVisitors ?? 0],
          ['Halaman dikunjungi', data?.totals.pages ?? 0],
        ].map(([label, value]) => (
          <article key={String(label)} className="admin-panel rounded-2xl p-5">
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black text-white">
              {loading ? '…' : visitNumberFormatter.format(Number(value))}
            </p>
          </article>
        ))}
      </section>

      <section className="admin-panel rounded-2xl p-5">
        <h3 className="font-bold text-white">Tren kunjungan</h3>
        <div className="mt-6 flex h-64 items-end gap-2 overflow-x-auto border-b border-white/10 pb-1">
          {(data?.daily || []).map((item) => (
            <div
              key={item.date}
              className="flex min-w-10 flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-[10px] text-slate-400">{item.views}</span>
              <div
                title={`${item.date}: ${item.views} views`}
                className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{
                  height: `${Math.max(4, (item.views / maxDaily) * 190)}px`,
                }}
              />
              <span className="text-[10px] text-slate-500">{item.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <VisitRanking
          title="Halaman teratas"
          items={data?.topPages || []}
          empty="Belum ada halaman tercatat."
        />
        <VisitRanking
          title="Sumber kunjungan"
          items={data?.referrers || []}
          empty="Belum ada referrer eksternal."
        />
        <VisitRanking
          title="Perangkat"
          items={data?.devices || []}
          empty="Belum ada data perangkat."
        />
      </div>

      <p className="text-xs text-slate-500">
        Statistik mulai terisi setelah pengunjung membuka halaman publik. Halaman admin dan API
        tidak dihitung.
      </p>
    </div>
  );
}

function VisitRanking({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ name: string; value: number }>;
  empty: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="admin-panel rounded-2xl p-5">
      <h3 className="font-bold text-white">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : null}

        {items.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-300" title={item.name}>
                {item.name}
              </span>
              <span className="font-bold text-white">
                {visitNumberFormatter.format(item.value)}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'visits'>('products');

  return (
    <div className="space-y-6">
      <div className="inline-flex rounded-2xl border border-white/10 bg-slate-950/60 p-1">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'products'
              ? 'bg-cyan-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Analytics Produk
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('visits')}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
            activeTab === 'visits'
              ? 'bg-cyan-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Analytics Kunjungan
        </button>
      </div>

      {activeTab === 'products' ? <ProductAnalytics /> : <VisitAnalytics />}
    </div>
  );
}
