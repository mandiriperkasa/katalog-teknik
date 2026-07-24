'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Boxes,
  Gauge,
  Headphones,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Wrench,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSheetData } from '../hooks/useSheetData';
import PartnerLogoStrip from './components/PartnerLogoStrip';
import SectionHeading from './components/SectionHeading';

type ProductRow = {
  id?: number;
  legacyNo?: number | string | null;
  name?: string | null;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  description?: string | null;
  hasDiscount?: boolean | string | null;
  discountPrice?: number | string | null;
  soldCount?: number | string | null;
  rating?: number | string | null;
  imageUrl?: string | null;
  isBestSeller?: boolean | string | null;
};

type SettingRow = {
  key: string;
  value?: string | null;
};
const fallbackProducts: ProductRow[] = [];

const features = [
  {
    icon: PackageCheck,
    title: 'Produk Original',
    description: 'Peralatan terkurasi dari brand terpercaya untuk kebutuhan workshop profesional.',
  },
  {
    icon: Gauge,
    title: 'Performa Terukur',
    description: 'Solusi dipilih berdasarkan efisiensi, durabilitas, dan kesiapan operasional.',
  },
  {
    icon: Headphones,
    title: 'Dukungan Responsif',
    description: 'Pendampingan konsultasi, instalasi, dan layanan purna jual yang jelas.',
  },
];

const process = [
  {
    title: 'Konsultasi',
    description: 'Kami memahami kebutuhan teknis, ruang, dan target operasional Anda.',
  },
  {
    title: 'Rekomendasi',
    description: 'Tim menyusun pilihan produk dan konfigurasi yang paling relevan.',
  },
  {
    title: 'Instalasi',
    description: 'Pemasangan dilakukan dengan prosedur kerja yang aman dan terukur.',
  },
  {
    title: 'Pendampingan',
    description: 'Dukungan penggunaan dan perawatan menjaga investasi tetap optimal.',
  },
];

function formatCurrency(value?: string | number | null) {
  const number = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(number)) return value || 'Hubungi kami';

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number);
}

function getNumericPrice(value?: number | string | null) {
  return Number(value) || 0;
}

function getDiscountPercent(
  price?: number | string | null,
  discountPrice?: number | string | null,
) {
  const originalPrice = getNumericPrice(price);
  const finalPrice = getNumericPrice(discountPrice);

  if (originalPrice <= 0 || finalPrice <= 0 || finalPrice >= originalPrice) {
    return 0;
  }

  return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
}

function formatSoldCount(value?: number | string | null) {
  const soldCount = Math.max(0, Math.floor(Number(value) || 0));

  if (soldCount >= 1_000_000) {
    const formatted = (soldCount / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');

    return `${formatted}JT+ terjual`;
  }

  if (soldCount >= 1_000) {
    const formatted = (soldCount / 1_000).toFixed(1).replace('.0', '').replace('.', ',');

    return `${formatted}RB+ terjual`;
  }

  return `${soldCount.toLocaleString('id-ID')} terjual`;
}

function isTruthy(value?: boolean | string | null) {
  if (typeof value === 'boolean') return value;

  return ['true', '1', 'yes', 'ya'].includes(
    String(value ?? '')
      .trim()
      .toLowerCase(),
  );
}

function getProductCategory(product: ProductRow) {
  return product.secondCategory?.trim() || product.mainCategory?.trim() || 'Peralatan';
}

function getProductSoldCount(product: ProductRow) {
  const soldCount = Number(product.soldCount);

  if (!Number.isFinite(soldCount) || soldCount < 0) {
    return 0;
  }

  return Math.floor(soldCount);
}

function getTopSellingProducts(products: ProductRow[]) {
  return [...products]
    .sort((left, right) => getProductSoldCount(right) - getProductSoldCount(left))
    .slice(0, 10);
}

function getProductDetailHref(product: ProductRow) {
  const detailKey = product.id ?? product.legacyNo ?? product.name ?? '';
  return `/products?detail=${encodeURIComponent(String(detailKey))}`;
}

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const {
    data: productRows,
    loading: productsLoading,
    refresh: refreshProducts,
  } = useSheetData<ProductRow>('Products');

  const { data: settingRows, refresh: refreshSettings } = useSheetData<SettingRow>('Settings');

  const content = useMemo<Record<string, string>>(() => {
    return settingRows.reduce<Record<string, string>>((result, item) => {
      result[item.key] = item.value ?? '';
      return result;
    }, {});
  }, [settingRows]);

  useEffect(() => {
    void refreshProducts();
    void refreshSettings();
  }, [refreshProducts, refreshSettings]);

  const defaultWords = [
    'Standar Dunia',
    'Kualitas Premium',
    'Daya Tahan Tinggi',
    'Brand Terpercaya',
  ];
  const sheetWords = [
    content.hero_word_1,
    content.hero_word_2,
    content.hero_word_3,
    content.hero_word_4,
  ]
    .map((word) => word?.trim())
    .filter((word): word is string => Boolean(word));
  const words = sheetWords.length > 0 ? sheetWords : defaultWords;
  const rotationSpeed = Math.max(Number(content.hero_rotation_speed) || 3000, 1000);
  const currentWord = words[wordIndex % words.length];

  useEffect(() => {
    if (words.length <= 1) return;

    const timer = window.setInterval(
      () => setWordIndex((current) => (current + 1) % words.length),
      rotationSpeed,
    );

    return () => window.clearInterval(timer);
  }, [rotationSpeed, words.length]);

  const allProducts = useMemo(() => {
    const rows = productRows as ProductRow[];
    return rows.length > 0 ? rows : fallbackProducts;
  }, [productRows]);

  const bestSellerProducts = useMemo(() => getTopSellingProducts(allProducts), [allProducts]);

  const productCategories = useMemo(() => {
    const categories = Array.from(
      new Set(bestSellerProducts.map(getProductCategory).filter(Boolean)),
    );

    return ['Semua', ...categories];
  }, [bestSellerProducts]);

  const resolvedActiveCategory = productCategories.includes(activeCategory)
    ? activeCategory
    : 'Semua';

  const visibleProducts = useMemo(() => {
    if (resolvedActiveCategory === 'Semua') return bestSellerProducts;

    return bestSellerProducts.filter(
      (product) => getProductCategory(product) === resolvedActiveCategory,
    );
  }, [resolvedActiveCategory, bestSellerProducts]);

  const heroBackgroundImage = content.hero_background_url?.trim() || '';

  const [loadedHeroImage, setLoadedHeroImage] = useState('');

  const heroImageReady = Boolean(heroBackgroundImage) && loadedHeroImage === heroBackgroundImage;

  useEffect(() => {
    if (!heroBackgroundImage) {
      return;
    }

    let isCancelled = false;
    const image = new window.Image();

    const handleLoad = () => {
      if (!isCancelled) {
        setLoadedHeroImage(heroBackgroundImage);
      }
    };

    const handleError = () => {
      if (!isCancelled) {
        setLoadedHeroImage('');
      }
    };

    image.onload = handleLoad;
    image.onerror = handleError;
    image.src = heroBackgroundImage;

    if (image.complete && image.naturalWidth > 0) {
      handleLoad();
    }

    return () => {
      isCancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [heroBackgroundImage]);

  return (
    <main>
      <section className="hero-section hero-section-fullscreen section-shell">
        {heroBackgroundImage && (
          <motion.div
            key={heroBackgroundImage}
            className="hero-background-image"
            style={{
              backgroundImage: `url("${heroBackgroundImage}")`,
            }}
            initial={{
              opacity: 0,
              scale: 1.04,
            }}
            animate={{
              opacity: heroImageReady ? 1 : 0,
              scale: heroImageReady ? 1 : 1.04,
            }}
            transition={{
              opacity: {
                duration: 1.2,
                ease: 'easeOut',
              },
              scale: {
                duration: 1.8,
                ease: [0.22, 1, 0.36, 1],
              },
            }}
            aria-hidden="true"
          />
        )}

        <div className="hero-background-overlay" aria-hidden="true" />

        <div className="hero-grid hero-content-layer">
          <motion.div
            className="hero-copy"
            initial={{
              opacity: 0,
              y: 32,
              filter: 'blur(10px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
            }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <div className="site-eyebrow">
              {content.hero_badge || 'Authorized Distributor Resmi'}
            </div>

            <h1 className="hero-title">{content.hero_title || 'Temukan Solusi'}</h1>

            <motion.div className="hero-dynamic-row" layout aria-live="polite">
              <motion.div className="hero-dynamic-line" layout>
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={currentWord}
                    layout
                    initial={{
                      opacity: 0,
                      y: 28,
                      rotateX: -52,
                      filter: 'blur(8px)',
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      rotateX: 0,
                      filter: 'blur(0px)',
                    }}
                    exit={{
                      opacity: 0,
                      y: -24,
                      rotateX: 42,
                      filter: 'blur(7px)',
                    }}
                    transition={{
                      opacity: {
                        duration: 0.32,
                      },
                      filter: {
                        duration: 0.38,
                      },
                      layout: {
                        type: 'spring',
                        stiffness: 360,
                        damping: 34,
                      },
                      y: {
                        type: 'spring',
                        stiffness: 330,
                        damping: 30,
                      },
                      rotateX: {
                        duration: 0.42,
                        ease: [0.22, 1, 0.36, 1],
                      },
                    }}
                    className="gradient-text hero-dynamic-word"
                  >
                    {currentWord}
                  </motion.span>
                </AnimatePresence>

                <motion.span
                  layout="position"
                  transition={{
                    type: 'spring',
                    stiffness: 360,
                    damping: 34,
                  }}
                  className="hero-suffix"
                >
                  {content.hero_suffix || 'Peralatan Anda'}
                </motion.span>
              </motion.div>
            </motion.div>

            <p className="hero-description">
              {content.hero_description ||
                'Menyediakan automotive service equipment kelas dunia dan hand tools berstandar internasional untuk efisiensi maksimal.'}
            </p>

            <div className="hero-actions">
              <Link href="/products" className="site-button site-button-primary">
                {content.hero_button_product || 'Lihat Produk'} <ArrowRight size={17} />
              </Link>
              <Link href="/contact" className="site-button site-button-secondary">
                {content.hero_button_contact || 'Hubungi Kami'} <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="hero-proof">
              {['Produk terkurasi', 'Konsultasi teknis', 'Layanan purna jual'].map((item) => (
                <div key={item} className="hero-proof-item">
                  <span className="hero-proof-dot" />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <a
          href="#home-content-start"
          className="hero-scroll-more"
          aria-label="Scroll ke konten berikutnya"
        >
          <span className="hero-scroll-more-label">Scroll For More</span>
          <svg
            className="hero-scroll-more-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </a>
      </section>

      <section id="home-content-start" className="section-block section-shell">
        <SectionHeading
          eyebrow="Mengapa memilih kami"
          title="Lebih dari sekadar katalog produk."
          description="Kami membantu Anda menemukan peralatan yang sesuai, memahami spesifikasi, dan memastikan implementasinya berjalan lebih lancar."
        />

        <div className="feature-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="site-card feature-card"
                data-aos="fade-up"
                data-aos-delay={String(index * 90)}
              >
                <span className="feature-number">0{index + 1}</span>
                <div className="feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section-block section-shell home-products-section">
        <div className="home-products-heading">
          <SectionHeading
            eyebrow="Produk unggulan"
            title="Produk Kami"
            description="Menampilkan 10 produk dengan jumlah penjualan tertinggi, diurutkan otomatis dari yang paling banyak terjual."
          />
          <Link href="/products" className="site-button site-button-secondary">
            Lihat seluruh katalog <ArrowUpRight size={17} />
          </Link>
        </div>

        <div className="home-product-toolbar" data-aos="fade-up" data-aos-delay="80">
          <div className="filter-list" role="tablist" aria-label="Kategori produk unggulan">
            {productCategories.map((category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={resolvedActiveCategory === category}
                onClick={() => setActiveCategory(category)}
                className={`filter-button ${resolvedActiveCategory === category ? 'is-active' : ''}`}
              >
                {category === 'Semua' ? <Sparkles size={14} /> : <Tag size={14} />}
                {category}
              </button>
            ))}
          </div>
          <span className="home-product-count">
            <Zap size={14} /> {visibleProducts.length} produk terlaris
          </span>
        </div>

        <motion.div className="product-grid home-product-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, index) => (
              <motion.article
                layout
                key={`${resolvedActiveCategory}-${product.legacyNo ?? index}-${product.name ?? 'produk'}`}
                className="site-card product-card product-catalog-card product-card-clickable"
                data-aos="fade-up"
                data-aos-delay={String((index % 3) * 90)}
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -9 }}

                role="link"
                tabIndex={0}
                aria-label={`Lihat detail ${product.name || 'Produk'}`}
                onClick={() => {
                  window.location.href = getProductDetailHref(product);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    window.location.href = getProductDetailHref(product);
                  }
                }}
              >
                <div className="product-card-glow" />
                <div className="product-image-wrap">
                  <div className="product-badge-stack">
                    <span className="site-chip product-badge product-badge-best">
                      <BadgeCheck size={13} /> Terlaris #{index + 1}
                    </span>
                    <span className="site-chip product-category-badge">
                      <Boxes size={13} /> {getProductCategory(product)}
                    </span>
                  </div>
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.name || 'Produk teknik'}
                      fill
                      sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 33vw"
                      className="product-image"
                    />
                  ) : (
                    <div className="product-image-placeholder">
                      <Wrench size={46} strokeWidth={1.2} />
                    </div>
                  )}
                  <div className="product-image-shine" />
                </div>
                <div className="product-card-content">
                  <div className="product-category-trail">
                    <span>{product.mainCategory?.trim() || 'Peralatan'}</span>

                    <span aria-hidden="true">›</span>

                    <span>{product.secondCategory?.trim() || 'Kategori'}</span>

                    <span aria-hidden="true">›</span>

                    <span>{product.subCategory?.trim() || 'Produk'}</span>
                  </div>

                  <h3 className="product-card-title">
                    {product.name || 'Produk Teknik Profesional'}
                  </h3>

                  <div className="product-card-meta">
                    <span>Professional equipment</span>

                    <span className="inline-flex items-center gap-1 text-amber-500">
                      <Star size={13} fill="currentColor" />
                      {product.rating || '5'}
                    </span>
                  </div>

                  {isTruthy(product.hasDiscount) &&
                  getNumericPrice(product.discountPrice) > 0 &&
                  getNumericPrice(product.discountPrice) < getNumericPrice(product.price) ? (
                    <div className="mt-1 min-h-20.5">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <strong className="text-xl font-bold tracking-tight text-red-500">
                          {formatCurrency(product.discountPrice)}
                        </strong>

                        <span className="text-xs text-(--text-muted) line-through">
                          {formatCurrency(product.price)}
                        </span>

                        <span className="rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-bold text-red-500">
                          -{getDiscountPercent(product.price, product.discountPrice)}%
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                        <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600">
                          Garansi Harga Terbaik
                        </span>

                        <span className="text-xs font-medium text-(--text-muted)">
                          {formatSoldCount(product.soldCount)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 min-h-20.5">
                      <strong className="text-xl font-bold tracking-tight text-(--text-primary)">
                        {formatCurrency(product.price)}
                      </strong>

                      <div className="mt-2">
                        <span className="text-xs font-medium text-(--text-muted)">
                          {formatSoldCount(product.soldCount)}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="product-card-actions product-card-actions-single">
                    <Link
                      href="/contact"
                      className="site-button site-button-primary"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Penawaran
                    </Link>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {productsLoading && (
          <div className="home-products-loading" role="status">
            <span /> Memuat produk terlaris...
          </div>
        )}

        {!productsLoading && visibleProducts.length === 0 && (
          <div className="site-card home-products-empty" data-aos="fade-up">
            <div className="empty-state-icon">
              <BadgeCheck size={26} />
            </div>
            <h3>Belum ada produk untuk ditampilkan</h3>
            <p>
              Tambahkan produk dan isi jumlah terjual melalui dashboard admin. Produk dengan
              penjualan tertinggi akan otomatis muncul di bagian ini.
            </p>
          </div>
        )}
      </section>

      <section className="section-block section-shell">
        <SectionHeading
          eyebrow="Alur kerja"
          title="Dari kebutuhan menjadi solusi."
          description="Proses sederhana dan transparan untuk membantu Anda memilih, memasang, dan menggunakan peralatan dengan percaya diri."
          align="center"
        />
        <div className="process-grid">
          {process.map((item, index) => (
            <article
              key={item.title}
              className="site-card process-card"
              data-aos="flip-up"
              data-aos-delay={String(index * 90)}
            >
              <span className="process-index">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block section-shell">
        <div className="site-card p-7 sm:p-10" data-aos="blur-in">
          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <SectionHeading
              eyebrow="Dipercaya berbagai sektor"
              title="Kolaborasi yang tumbuh dari kualitas."
              description="Kami terus membangun hubungan jangka panjang melalui produk yang relevan dan layanan yang dapat diandalkan."
            />
            <div className="flex items-center gap-2 text-sm font-bold text-(--accent-blue)">
              <BadgeCheck size={18} /> Trusted partner
            </div>
          </div>
          <div className="marquee-shell">
            <div className="marquee-track">
              <PartnerLogoStrip />
            </div>
          </div>
        </div>
      </section>

      <section className="section-block section-shell">
        <div className="stats-grid">
          {[
            { value: `${allProducts.length}+`, label: 'Produk pilihan', icon: Boxes },
            { value: `${productCategories.length - 1}`, label: 'Kategori utama', icon: Sparkles },
            { value: '100%', label: 'Fokus kualitas', icon: ShieldCheck },
            { value: 'Fast', label: 'Respon konsultasi', icon: Headphones },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="site-card stat-card"
                data-aos="zoom-in"
                data-aos-delay={String(index * 70)}
              >
                <Icon size={19} className="mx-auto mb-4 text-(--accent-blue)" />
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
