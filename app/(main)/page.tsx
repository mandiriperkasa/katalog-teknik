'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  Boxes,
  ClipboardList,
  Gauge,
  Headphones,
  MessageCircleMore,
  PackageCheck,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary-image';
import { useSheetData } from '../hooks/useSheetData';
import PartnerLogoStrip from './components/PartnerLogoStrip';
import ProductCard from './components/ProductCard';
import SectionHeading from './components/SectionHeading';

type ProductRow = {
  id?: number;
  legacyNo?: number | string | null;
  name?: string | null;
  brand?: string | null;
  mainCategory?: string | null;
  secondCategory?: string | null;
  subCategory?: string | null;
  price?: number | string | null;
  description?: string | null;
  hasDiscount?: boolean | string | null;
  discountPrice?: number | string | null;
  soldCount?: number | string | null;
  rating?: number | string | null;
  showRating?: boolean | string | null;
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

function normalizeWhatsAppNumber(value: string) {
  const normalized = value.trim().replace(/[^\d+]/g, '');
  if (normalized.startsWith('+')) return normalized.slice(1);
  if (normalized.startsWith('0')) return `62${normalized.slice(1)}`;
  return normalized.replace(/\D/g, '');
}

function getSafeBannerLink(value: string | undefined) {
  const link = value?.trim();
  if (!link) return '';
  if (link.startsWith('/') && !link.startsWith('//')) return link;

  try {
    const url = new URL(link);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : '';
  } catch {
    return '';
  }
}

export default function Home() {
  const [wordIndex, setWordIndex] = useState(0);
  const [activePromoSlide, setActivePromoSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [quoteForm, setQuoteForm] = useState({
    name: '',
    company: '',
    phone: '',
    need: '',
  });
  const [quoteError, setQuoteError] = useState('');
  const {
    data: productRows,
    loading: productsLoading,
    error: productsError,
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
    return !productsLoading && !productsError ? rows : rows.length > 0 ? rows : fallbackProducts;
  }, [productRows, productsError, productsLoading]);

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
  const promoSlides = useMemo(
    () =>
      [
        {
          id: '1',
          desktop: content.home_promo_banner_desktop_url?.trim() || '',
          mobile: content.home_promo_banner_mobile_url?.trim() || '',
          link: getSafeBannerLink(content.home_promo_banner_link),
        },
        {
          id: '2',
          desktop: content.home_promo_banner_2_desktop_url?.trim() || '',
          mobile: content.home_promo_banner_2_mobile_url?.trim() || '',
          link: getSafeBannerLink(content.home_promo_banner_2_link),
        },
        {
          id: '3',
          desktop: content.home_promo_banner_3_desktop_url?.trim() || '',
          mobile: content.home_promo_banner_3_mobile_url?.trim() || '',
          link: getSafeBannerLink(content.home_promo_banner_3_link),
        },
      ].filter((slide) => Boolean(slide.desktop || slide.mobile)),
    [content],
  );
  const resolvedActivePromoSlide = promoSlides.length ? activePromoSlide % promoSlides.length : 0;
  const showPromoBanner = content.home_promo_banner_enabled === 'true' && promoSlides.length > 0;

  useEffect(() => {
    if (promoSlides.length <= 1) return;

    const timer = window.setInterval(() => {
      setActivePromoSlide((current) => (current + 1) % promoSlides.length);
    }, 5500);

    return () => window.clearInterval(timer);
  }, [promoSlides.length]);

  const [loadedHeroImage, setLoadedHeroImage] = useState('');

  const heroImageReady = Boolean(heroBackgroundImage) && loadedHeroImage === heroBackgroundImage;

  function handleQuickQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = quoteForm.name.trim();
    const company = quoteForm.company.trim();
    const phone = quoteForm.phone.trim();
    const need = quoteForm.need.trim();
    const phoneDigits = phone.replace(/\D/g, '');

    if (!name || phoneDigits.length < 8 || !need) {
      setQuoteError('Lengkapi nama, nomor WhatsApp yang valid, dan kebutuhan Anda.');
      return;
    }

    const destination = normalizeWhatsAppNumber(
      content.whatsapp_number?.trim() || content.footer_phone?.trim() || '+6285640100044',
    );
    const message = [
      'Halo Mandiri Perkakas, saya ingin meminta penawaran cepat.',
      '',
      `Nama: ${name}`,
      `Perusahaan: ${company || '-'}`,
      `No. WhatsApp: ${phone}`,
      `Kebutuhan: ${need}`,
    ].join('\n');

    setQuoteError('');
    window.open(
      `https://wa.me/${destination}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

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

          <motion.aside
            className="hero-quick-quote"
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.85, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            aria-labelledby="quick-quote-title"
          >
            <span className="hero-quick-quote-orb" aria-hidden="true" />
            <div className="hero-quick-quote-head">
              <div>
                <span className="hero-quick-quote-kicker">
                  <Zap size={12} fill="currentColor" /> Jalur Cepat
                </span>
                <h2 id="quick-quote-title">Ceritakan kebutuhan Anda.</h2>
                <p>Isi singkat, lalu lanjutkan percakapan langsung melalui WhatsApp.</p>
              </div>
              <span className="hero-quick-quote-icon" aria-hidden="true">
                <MessageCircleMore size={21} />
              </span>
            </div>

            <form className="hero-quick-quote-form" onSubmit={handleQuickQuote}>
              <label>
                <span>Nama</span>
                <div className="hero-quick-quote-field">
                  <User size={15} />
                  <input
                    type="text"
                    autoComplete="name"
                    placeholder="Nama lengkap"
                    value={quoteForm.name}
                    onChange={(event) => {
                      setQuoteForm((current) => ({ ...current, name: event.target.value }));
                      setQuoteError('');
                    }}
                    required
                  />
                </div>
              </label>

              <label>
                <span>
                  Perusahaan <em>opsional</em>
                </span>
                <div className="hero-quick-quote-field">
                  <Building2 size={15} />
                  <input
                    type="text"
                    autoComplete="organization"
                    placeholder="Nama usaha atau instansi"
                    value={quoteForm.company}
                    onChange={(event) =>
                      setQuoteForm((current) => ({ ...current, company: event.target.value }))
                    }
                  />
                </div>
              </label>

              <label>
                <span>Nomor WhatsApp</span>
                <div className="hero-quick-quote-field">
                  <Phone size={15} />
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="Contoh: 0812 3456 7890"
                    value={quoteForm.phone}
                    onChange={(event) => {
                      setQuoteForm((current) => ({ ...current, phone: event.target.value }));
                      setQuoteError('');
                    }}
                    required
                  />
                </div>
              </label>

              <label>
                <span>Kebutuhan peralatan</span>
                <div className="hero-quick-quote-field is-textarea">
                  <ClipboardList size={15} />
                  <textarea
                    placeholder="Tuliskan produk, jumlah, atau kebutuhan teknis..."
                    value={quoteForm.need}
                    onChange={(event) => {
                      setQuoteForm((current) => ({ ...current, need: event.target.value }));
                      setQuoteError('');
                    }}
                    required
                  />
                </div>
              </label>

              {quoteError && (
                <p className="hero-quick-quote-error" role="alert">
                  {quoteError}
                </p>
              )}

              <button type="submit" className="hero-quick-quote-submit">
                Kirim Permintaan <Send size={15} />
              </button>

              <p className="hero-quick-quote-note">
                <ShieldCheck size={13} /> Data hanya digunakan untuk menyusun pesan WhatsApp.
              </p>
            </form>
          </motion.aside>

          <a
            className="hero-mobile-quick-quote"
            href={`https://wa.me/${normalizeWhatsAppNumber(
              content.whatsapp_number?.trim() || content.footer_phone?.trim() || '+6285640100044',
            )}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircleMore size={18} />
            Jalur Cepat via WhatsApp
            <ArrowUpRight size={17} />
          </a>
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

      <section
        id="home-content-start"
        className="section-block section-shell home-features-section"
      >
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

      <section className="section-block section-shell home-products-section product-listing-page">
        <div className="home-products-heading">
          <SectionHeading eyebrow="Produk unggulan" title="Produk Kami" />
        </div>

        {showPromoBanner && (
          <div className="home-promo-banner-section" aria-label="Promo terbaru">
            <motion.div
              className="home-promo-banner-frame"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {promoSlides.map((slide, index) => {
                const isActive = index === resolvedActivePromoSlide;
                const picture = (
                  <picture>
                    {slide.mobile && (
                      <source
                        media="(max-width: 640px)"
                        srcSet={getOptimizedCloudinaryUrl(slide.mobile, {
                          width: 1080,
                          quality: 'auto:best',
                        })}
                      />
                    )}
                    {/* Semua slide dirender agar browser memuat gambar promo sejak awal. */}
                    <img
                      src={getOptimizedCloudinaryUrl(slide.desktop || slide.mobile, {
                        width: 1920,
                        quality: 'auto:best',
                      })}
                      alt={`Banner promo Mandiri Perkakas ${index + 1}`}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'low'}
                      decoding="async"
                    />
                  </picture>
                );

                return (
                  <motion.div
                    key={slide.id}
                    className={`home-promo-banner-slide ${isActive ? 'is-active' : ''}`}
                    initial={false}
                    animate={{ opacity: isActive ? 1 : 0, scale: isActive ? 1 : 1.012 }}
                    transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
                    aria-hidden={!isActive}
                  >
                    {slide.link ? (
                      <a
                        href={slide.link}
                        className="home-promo-banner-link"
                        target={slide.link.startsWith('http') ? '_blank' : undefined}
                        rel={slide.link.startsWith('http') ? 'noopener noreferrer' : undefined}
                        aria-label={`Lihat detail promo ${index + 1}`}
                        tabIndex={isActive ? undefined : -1}
                      >
                        {picture}
                      </a>
                    ) : (
                      picture
                    )}
                  </motion.div>
                );
              })}

              <span className="home-promo-banner-shine" aria-hidden="true" />

              {promoSlides.length > 1 && (
                <>
                  <button
                    type="button"
                    className="home-promo-banner-arrow is-previous"
                    onClick={() =>
                      setActivePromoSlide(
                        (resolvedActivePromoSlide - 1 + promoSlides.length) % promoSlides.length,
                      )
                    }
                    aria-label="Promo sebelumnya"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="home-promo-banner-arrow is-next"
                    onClick={() =>
                      setActivePromoSlide((resolvedActivePromoSlide + 1) % promoSlides.length)
                    }
                    aria-label="Promo berikutnya"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="home-promo-banner-dots" aria-label="Pilih promo">
                    {promoSlides.map((slide, index) => (
                      <button
                        key={slide.id}
                        type="button"
                        className={index === resolvedActivePromoSlide ? 'is-active' : ''}
                        onClick={() => setActivePromoSlide(index)}
                        aria-label={`Tampilkan promo ${index + 1}`}
                        aria-current={index === resolvedActivePromoSlide ? 'true' : undefined}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}

        <div className="home-products-description-row">
          <p className="section-description home-products-description">
            Jelajahi 10 produk unggulan dengan performa penjualan terbaik, disusun untuk membantu
            Anda menemukan pilihan yang paling diminati.
          </p>
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

        <motion.div className="product-grid product-catalog-grid home-product-grid" layout>
          <AnimatePresence mode="popLayout">
            {visibleProducts.map((product, index) => (
              <ProductCard
                key={`${resolvedActiveCategory}-${product.legacyNo ?? index}-${product.name ?? 'produk'}`}
                product={product}
                index={index}
                content={content}
                eagerImage={index === 0}
              />
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

      <section className="section-block section-shell home-process-section home-lower-section">
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

      <section className="section-block section-shell home-lower-section">
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

      <section className="section-block section-shell home-lower-section">
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
