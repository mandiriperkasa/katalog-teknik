'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Images, MapPin, Play, Sparkles, Video, X } from 'lucide-react';
import Image from 'next/image';
import {
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { useSheetData } from '../../hooks/useSheetData';
import PageHero from '../components/PageHero';

type GalleryRow = {
  id?: string;
  title?: string;
  category?: string;
  location?: string;
  description?: string | null;
  mediaType?: 'image' | 'youtube';
  youtubeVideoId?: string | null;
  imageUrl?: string | null;
};

type SettingRow = {
  key: string;
  value?: string | null;
};

const fallbackItems: GalleryRow[] = [
  {
    id: 'g1',
    title: 'Imaging Wheel Alignment',
    category: 'Wheel',
    location: 'Workshop 01',
    description:
      'Dokumentasi pekerjaan imaging wheel alignment untuk mendukung proses pengukuran dan penyetelan roda kendaraan secara lebih presisi.',
  },
  {
    id: 'g2',
    title: 'Wheel Balancer Professional',
    category: 'Wheel',
    location: 'Workshop 02',
    description:
      'Instalasi dan pengujian wheel balancer profesional untuk memastikan kestabilan roda dan kenyamanan berkendara.',
  },
  {
    id: 'g3',
    title: 'Tire Changer Setup',
    category: 'Tire',
    location: 'Workshop 03',
    description:
      'Penataan dan pengujian tire changer agar siap digunakan untuk kebutuhan operasional workshop.',
  },
  {
    id: 'g4',
    title: 'Two-Post Lift Installation',
    category: 'Lift',
    location: 'Service Bay A',
    description:
      'Proses pemasangan, pemeriksaan, dan pengujian two-post lift sebelum digunakan untuk pekerjaan servis kendaraan.',
  },
  {
    id: 'g5',
    title: 'Brake Fluid Service',
    category: 'Fluid',
    location: 'Service Bay B',
    description:
      'Dokumentasi pekerjaan perawatan dan penggantian brake fluid menggunakan peralatan servis yang sesuai.',
  },
  {
    id: 'g6',
    title: 'Industrial Hand Tools',
    category: 'Tools',
    location: 'Tool Room',
    description:
      'Penataan peralatan hand tools industri untuk mendukung pekerjaan teknis yang aman, rapi, dan efisien.',
  },
];

export default function GalleryPage() {
  const { data, error, refresh } = useSheetData<GalleryRow>('Gallery');

  const { data: settingRows, refresh: refreshSettings } = useSheetData<SettingRow>('Settings');

  const content = useMemo<Record<string, string>>(() => {
    return settingRows.reduce<Record<string, string>>((result, setting) => {
      result[setting.key] = setting.value ?? '';
      return result;
    }, {});
  }, [settingRows]);

  const getContent = (key: string, fallback: string) => {
    return content[key]?.trim() || fallback;
  };

  const rows = data.length > 0 ? data : fallbackItems;

  const [category, setCategory] = useState('Semua');

  const [selectedItem, setSelectedItem] = useState<GalleryRow | null>(null);

  const categories = useMemo(() => {
    const unique = new Set(
      rows.map((item) => item.category?.trim()).filter((item): item is string => Boolean(item)),
    );

    return ['Semua', ...Array.from(unique).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filtered = category === 'Semua' ? rows : rows.filter((item) => item.category === category);

  useEffect(() => {
    void refresh();
    void refreshSettings();
  }, [refresh, refreshSettings]);

  useEffect(() => {
    if (!selectedItem) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedItem]);

  return (
    <main>
      <PageHero
        eyebrow={getContent('gallery_hero_eyebrow', 'Galeri proyek')}
        title={
          <>
            {getContent('gallery_hero_title', 'Lihat bagaimana solusi kami')}{' '}
            <span className="gradient-text">
              {getContent('gallery_hero_title_highlight', 'bekerja nyata.')}
            </span>
          </>
        }
        description={getContent(
          'gallery_hero_description',
          'Dokumentasi produk, instalasi, dan konfigurasi workshop yang menunjukkan detail, skala, dan kualitas implementasi.',
        )}
      >
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="site-chip">
            <Images size={14} /> {rows.length}{' '}
            {getContent('gallery_documentation_label', 'dokumentasi')}
          </span>

          <span className="site-chip">
            <Sparkles size={14} /> {getContent('gallery_workshop_ready_label', 'Workshop-ready')}
          </span>
        </div>
      </PageHero>

      <section className="section-shell pb-28">
        <div
          className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"
          data-aos="fade-up"
        >
          <div className="filter-list">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`filter-button ${category === item ? 'is-active' : ''}`}
              >
                {item === 'Semua' ? getContent('gallery_all_category_label', 'Semua') : item}
              </button>
            ))}
          </div>

          <span className="text-xs font-bold uppercase tracking-[.12em] text-[var(--text-muted)]">
            {filtered.length} {getContent('gallery_item_label', 'item')}
          </span>
        </div>

        {error && data.length === 0 && (
          <p className="mt-5 text-sm text-[var(--text-muted)]">
            {getContent(
              'gallery_load_error',
              'Galeri online belum dapat dimuat. Dokumentasi contoh ditampilkan.',
            )}
          </p>
        )}

        <motion.div layout className="gallery-grid">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <motion.article
                layout
                key={`${item.id ?? index}-${item.title ?? 'gallery'}`}
                initial={{
                  opacity: 0,
                  scale: 0.94,
                  y: 18,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.94,
                }}
                transition={{
                  duration: 0.38,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group site-card gallery-card cursor-pointer"
                whileHover={{ y: -6 }}
                onClick={() => setSelectedItem(item)}
                onKeyDown={(event: ReactKeyboardEvent<HTMLElement>) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedItem(item);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Buka detail ${item.title ?? 'galeri'}`}
              >
                {item.mediaType === 'youtube' && item.youtubeVideoId ? (
                  <>
                    <Image
                      src={`https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg`}
                      alt={item.title || 'Thumbnail video YouTube'}
                      fill
                      sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 66vw"
                      priority={index === 0}
                      className="gallery-image"
                    />

                    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/15">
                      <span className="grid h-16 w-16 place-items-center rounded-full border border-white/25 bg-red-600/90 text-white shadow-[0_16px_45px_rgba(0,0,0,0.45)] backdrop-blur-md transition-transform duration-300 group-hover:scale-110">
                        <Play size={25} fill="currentColor" className="ml-1" />
                      </span>
                    </div>
                  </>
                ) : item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.title || 'Dokumentasi workshop'}
                    fill
                    sizes="(max-width: 760px) 100vw, (max-width: 1040px) 50vw, 66vw"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    className="gallery-image"
                  />
                ) : (
                  <div className="gallery-gradient-placeholder" />
                )}

                <div className="gallery-card-overlay">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="site-chip border-white/20 bg-black/20 text-white/80">
                        {item.category || getContent('gallery_default_category', 'Workshop')}
                      </span>

                      {item.mediaType === 'youtube' && (
                        <span className="site-chip border-red-300/20 bg-red-600/80 text-white">
                          <Video size={13} />
                          {getContent('gallery_video_label', 'Video')}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedItem(item);
                      }}
                      aria-label={`Buka detail ${item.title ?? 'galeri'}`}
                      className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 bg-black/25 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white/20"
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </div>

                  <div>
                    <h2 className="gallery-card-title">
                      {item.title || getContent('gallery_default_title', 'Workshop Project')}
                    </h2>

                    <p className="gallery-card-location">
                      <MapPin size={13} className="mr-1 inline" />{' '}
                      {item.location || getContent('gallery_default_location', 'Workshop Area')}
                    </p>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        <div className="stats-grid mt-14">
          {[
            {
              value: `${rows.length}+`,
              label: getContent('gallery_stat_1_label', 'Dokumentasi'),
            },
            {
              value: `${Math.max(categories.length - 1, 1)}`,
              label: getContent('gallery_stat_2_label', 'Kategori proyek'),
            },
            {
              value: getContent('gallery_stat_3_value', 'Real'),
              label: getContent('gallery_stat_3_label', 'Workshop setup'),
            },
            {
              value: getContent('gallery_stat_4_value', 'Ready'),
              label: getContent('gallery_stat_4_label', 'Operational use'),
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className="site-card stat-card"
              data-aos="zoom-in"
              data-aos-delay={String(index * 70)}
            >
              <strong>{item.value}</strong>

              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                className="fixed inset-0 z-[99999] overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-xl sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedItem(null)}
                role="dialog"
                aria-modal="true"
                aria-label={selectedItem.title || 'Detail galeri'}
              >
                <div className="flex min-h-full items-start justify-center py-2 sm:py-4">
                  <motion.div
                    initial={{
                      opacity: 0,
                      y: 28,
                      scale: 0.97,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                    }}
                    exit={{
                      opacity: 0,
                      y: 18,
                      scale: 0.97,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={(event: ReactMouseEvent<HTMLDivElement>) => event.stopPropagation()}
                    className="relative grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 bg-[#08111f] shadow-[0_40px_120px_rgba(0,0,0,0.65)] lg:my-auto lg:max-h-[calc(100dvh-3rem)] lg:grid-cols-[1.3fr_0.7fr]"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedItem(null)}
                      aria-label="Tutup detail galeri"
                      className="absolute right-4 top-4 z-30 grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-black/55 text-white shadow-xl backdrop-blur-md transition hover:rotate-90 hover:bg-white/15"
                    >
                      <X size={20} />
                    </button>

                    <div className="relative min-h-[300px] overflow-hidden bg-[#020617] sm:min-h-[420px] lg:h-[calc(100dvh-3rem)] lg:min-h-0">
                      {selectedItem.mediaType === 'youtube' && selectedItem.youtubeVideoId ? (
                        <div className="flex h-full min-h-[300px] items-center justify-center p-3 sm:min-h-[420px] sm:p-5 lg:min-h-0">
                          <div className="aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
                            <iframe
                              src={`https://www.youtube-nocookie.com/embed/${selectedItem.youtubeVideoId}?rel=0`}
                              title={selectedItem.title || 'Video galeri YouTube'}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              className="h-full w-full"
                            />
                          </div>
                        </div>
                      ) : selectedItem.imageUrl ? (
                        <Image
                          src={selectedItem.imageUrl}
                          alt={selectedItem.title || 'Detail galeri'}
                          fill
                          priority
                          sizes="(max-width: 1024px) 100vw, 65vw"
                          className="object-contain p-3 sm:p-5"
                        />
                      ) : (
                        <div className="gallery-gradient-placeholder" />
                      )}

                      {selectedItem.mediaType !== 'youtube' && (
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10 lg:bg-gradient-to-r lg:from-transparent lg:to-black/10" />
                      )}
                    </div>

                    <div className="relative flex max-h-none flex-col overflow-y-auto p-6 sm:p-8 lg:max-h-[calc(100dvh-3rem)] lg:p-10">
                      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:inset-y-0 lg:left-0 lg:h-auto lg:w-px lg:bg-gradient-to-b" />

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="site-chip self-start border-sky-300/20 bg-sky-400/10 text-sky-200">
                          <Sparkles size={13} />

                          {selectedItem.category ||
                            getContent('gallery_modal_default_category', 'Dokumentasi')}
                        </span>

                        {selectedItem.mediaType === 'youtube' && (
                          <span className="site-chip border-red-300/20 bg-red-500/10 text-red-200">
                            <Video size={13} />
                            {getContent('gallery_youtube_label', 'Video YouTube')}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-6 text-3xl font-black tracking-[-0.045em] text-white sm:text-4xl">
                        {selectedItem.title ||
                          getContent('gallery_modal_default_title', 'Detail Pekerjaan')}
                      </h2>

                      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4 text-sm text-slate-300">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                          <MapPin size={17} />
                        </span>

                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">
                            {getContent('gallery_location_label', 'Lokasi pekerjaan')}
                          </p>

                          <p className="mt-1 leading-6">
                            {selectedItem.location ||
                              getContent('gallery_location_empty', 'Lokasi tidak dicantumkan')}
                          </p>
                        </div>
                      </div>

                      <div className="mt-7 border-t border-white/10 pt-6">
                        <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                          {getContent('gallery_detail_label', 'Detail pekerjaan')}
                        </p>

                        <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-300 sm:text-[15px]">
                          {selectedItem.description ||
                            getContent(
                              'gallery_detail_empty',
                              'Belum ada detail pekerjaan untuk dokumentasi ini.',
                            )}
                        </p>
                      </div>

                      <div className="mt-8 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedItem(null)}
                          className="site-button site-button-secondary"
                        >
                          {getContent('gallery_close_button', 'Tutup Detail')}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </main>
  );
}
