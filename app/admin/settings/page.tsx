'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Check,
  FileText,
  LayoutTemplate,
  Link2,
  LoaderCircle,
  MapPin,
  Save,
  Search,
  Settings2,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { getSiteContentTab, siteContentTabs, type SiteContentTabId } from '@/lib/site-content-tabs';
import SettingsImageUpload from '../components/SettingsImageUpload';

type SettingRow = {
  key: string;
  value?: string;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type ContentGroupId = 'hero' | 'navigation' | 'content' | 'contact' | 'social' | 'general';

const labelMap: Record<string, string> = {
  hero_badge: 'Label kecil hero',
  hero_title: 'Judul utama hero',
  hero_word_1: 'Kata dinamis 1',
  hero_word_2: 'Kata dinamis 2',
  hero_word_3: 'Kata dinamis 3',
  hero_word_4: 'Kata dinamis 4',
  hero_suffix: 'Akhiran tulisan dinamis',
  hero_description: 'Deskripsi hero',
  hero_button_product: 'Teks tombol produk',
  hero_button_contact: 'Teks tombol kontak',
  hero_rotation_speed: 'Kecepatan pergantian kata',
  hero_background_url: 'Foto background hero',
  header_brand_logo_url: 'Logo perusahaan pada navigasi',
  home_promo_banner_enabled: 'Tampilkan banner promo',
  home_promo_banner_desktop_url: 'Slide 1 - gambar desktop',
  home_promo_banner_mobile_url: 'Slide 1 - gambar mobile',
  home_promo_banner_link: 'Slide 1 - tautan promo',
  home_promo_banner_2_desktop_url: 'Slide 2 - gambar desktop',
  home_promo_banner_2_mobile_url: 'Slide 2 - gambar mobile',
  home_promo_banner_2_link: 'Slide 2 - tautan promo',
  home_promo_banner_3_desktop_url: 'Slide 3 - gambar desktop',
  home_promo_banner_3_mobile_url: 'Slide 3 - gambar mobile',
  home_promo_banner_3_link: 'Slide 3 - tautan promo',

  footer_phone: 'Nomor telepon',
  footer_email: 'Email',
  footer_address: 'Alamat',
  map_url: 'URL Google Maps',

  whatsapp_enabled: 'Aktifkan tombol WhatsApp',
  whatsapp_number: 'Nomor WhatsApp',
  whatsapp_message: 'Pesan default WhatsApp',
  whatsapp_aria_label: 'Label aksesibilitas WhatsApp',
  whatsapp_screen_reader_label: 'Teks pembaca layar WhatsApp',

  general_site_name: 'Nama website',
  general_meta_description: 'Deskripsi metadata website',
  general_favicon_url: 'Ikon browser (favicon)',

  link_tiktok: 'Link TikTok',
  link_fb: 'Link Facebook',
  link_youtube: 'Link YouTube',
  link_instagram: 'Link Instagram',
  link_tokopedia: 'Link Tokopedia',
  link_tiktok_shop: 'Link TikTok Shop',
};

const removablePrefixes = [
  'header_',
  'home_',
  'products_',
  'services_',
  'gallery_',
  'about_',
  'contact_',
  'footer_',
  'general_',
];

const wordLabels: Record<string, string> = {
  hero: 'hero',
  eyebrow: 'label kecil',
  title: 'judul',
  highlight: 'sorotan',
  description: 'deskripsi',
  chip: 'label',
  label: 'label',
  button: 'tombol',
  placeholder: 'placeholder',
  message: 'pesan',
  text: 'teks',
  value: 'nilai',
  item: 'item',
  stat: 'statistik',
  workflow: 'alur kerja',
  commitment: 'komitmen',
  scope: 'cakupan',
  form: 'form',
  modal: 'modal',
  default: 'default',
  empty: 'kosong',
  load: 'muat',
  error: 'gagal',
  active: 'aktif',
  selection: 'pilihan',
  reset: 'reset',
  search: 'pencarian',
  filter: 'filter',
  results: 'hasil',
  result: 'hasil',
  show: 'tampilkan',
  page: 'halaman',
  previous: 'sebelumnya',
  next: 'berikutnya',
  detail: 'detail',
  price: 'harga',
  rating: 'rating',
  sold: 'terjual',
  category: 'kategori',
  main: 'utama',
  sub: 'subkategori',
  available: 'tersedia',
  best: 'terbaik',
  seller: 'terlaris',
  card: 'kartu',
  navigation: 'navigasi',
  nav: 'navigasi',
  contact: 'kontak',
  brand: 'merek',
  name: 'nama',
  tagline: 'tagline',
  initials: 'inisial',
  aria: 'aksesibilitas',
  open: 'buka',
  close: 'tutup',
  mobile: 'mobile',
  theme: 'tema',
  link: 'link',
  home: 'beranda',
  products: 'produk',
  services: 'layanan',
  gallery: 'galeri',
  about: 'tentang',
  email: 'email',
  phone: 'telepon',
  address: 'alamat',
  location: 'lokasi',
  help: 'bantuan',
  note: 'catatan',
  success: 'berhasil',
  submit: 'kirim',
  map: 'peta',
  cta: 'ajakan',
  hours: 'jam operasional',
  weekday: 'Senin–Jumat',
  saturday: 'Sabtu',
  sunday: 'Minggu',
  copyright: 'hak cipta',
  bottom: 'bagian bawah',
  social: 'media sosial',
  media: 'media',
  visual: 'visual',
  manifesto: 'manifesto',
  values: 'nilai',
  documentation: 'dokumentasi',
  youtube: 'YouTube',
  video: 'video',
  ready: 'siap',
  enabled: 'aktif',
  number: 'nomor',
  screen: 'layar',
  reader: 'pembaca',
  site: 'website',
  meta: 'metadata',
};

function formatLabel(key: string) {
  if (labelMap[key]) return labelMap[key];

  const cleanKey =
    removablePrefixes.find((prefix) => key.startsWith(prefix)) !== undefined
      ? key.replace(removablePrefixes.find((prefix) => key.startsWith(prefix)) ?? '', '')
      : key;

  const label = cleanKey
    .split('_')
    .map((word) => wordLabels[word] ?? word)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  return label.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getGroup(key: string): ContentGroupId {
  if (key.startsWith('home_promo_banner')) {
    return 'content';
  }

  if (key.startsWith('hero_') || key.includes('_hero_')) {
    return 'hero';
  }

  if (key.startsWith('nav_') || key.startsWith('header_nav_') || key.startsWith('footer_link_')) {
    return 'navigation';
  }

  if (key.startsWith('link_')) {
    return 'social';
  }

  if (
    key.startsWith('contact_') ||
    key.startsWith('whatsapp_') ||
    key === 'map_url' ||
    key === 'footer_phone' ||
    key === 'footer_email' ||
    key === 'footer_address'
  ) {
    return 'contact';
  }

  if (key.startsWith('general_') || key.endsWith('_enabled') || key.includes('rotation_speed')) {
    return 'general';
  }

  return 'content';
}

const groupDetails: Record<
  ContentGroupId,
  {
    title: string;
    description: string;
    icon: typeof LayoutTemplate;
  }
> = {
  hero: {
    title: 'Hero dan Pembuka',
    description: 'Judul, deskripsi, label, dan tombol pada bagian awal halaman.',
    icon: LayoutTemplate,
  },
  navigation: {
    title: 'Navigasi dan Menu',
    description: 'Nama menu dan tulisan navigasi yang mengarahkan pengunjung.',
    icon: Link2,
  },
  content: {
    title: 'Isi Halaman',
    description: 'Teks utama, kartu, statistik, ajakan, dan tulisan pendukung.',
    icon: FileText,
  },
  contact: {
    title: 'Kontak, Form, dan WhatsApp',
    description: 'Informasi kontak, form, peta, serta pengaturan tombol WhatsApp.',
    icon: MapPin,
  },
  social: {
    title: 'Media Sosial',
    description: 'Alamat akun media sosial yang digunakan pada website.',
    icon: Share2,
  },
  general: {
    title: 'Pengaturan Umum',
    description: 'Metadata, status fitur, serta pengaturan teknis sederhana.',
    icon: Settings2,
  },
};

const groupOrder: ContentGroupId[] = [
  'hero',
  'navigation',
  'content',
  'contact',
  'social',
  'general',
];

const promoBannerSettingOrder = [
  'home_promo_banner_enabled',
  'home_promo_banner_desktop_url',
  'home_promo_banner_mobile_url',
  'home_promo_banner_link',
  'home_promo_banner_2_desktop_url',
  'home_promo_banner_2_mobile_url',
  'home_promo_banner_2_link',
  'home_promo_banner_3_desktop_url',
  'home_promo_banner_3_mobile_url',
  'home_promo_banner_3_link',
];

function shouldUseTextarea(key: string, value: string) {
  return (
    key.includes('description') ||
    key.includes('address') ||
    key.includes('message') ||
    key.includes('text') ||
    key.includes('words') ||
    value.length > 95
  );
}

function isBooleanSetting(key: string) {
  return key.endsWith('_enabled');
}

function getInputType(key: string) {
  if (key.includes('email')) return 'email';

  if (key.includes('url') || key.startsWith('link_') || key.endsWith('_link')) {
    return 'url';
  }

  if (key.includes('rotation_speed')) return 'number';

  return 'text';
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [originalState, setOriginalState] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, SaveStatus>>({});
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<SiteContentTabId>('home');

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          cache: 'no-store',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || `Gagal memuat pengaturan (HTTP ${response.status}).`);
        }

        if (!Array.isArray(result)) {
          throw new Error('Format data pengaturan tidak valid.');
        }

        const rows = result.filter(
          (item): item is SettingRow => typeof item?.key === 'string' && item.key.trim().length > 0,
        );

        if (!cancelled) {
          setSettings(rows);
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan website.';

        if (!cancelled) {
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (settings.length === 0) return;

    const initialMap = settings.reduce<Record<string, string>>((result, item) => {
      result[item.key] = item.value ?? '';
      return result;
    }, {});

    // Sinkronisasi awal data Neon ke form yang dapat diedit.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormState(initialMap);
    setOriginalState(initialMap);
  }, [settings]);

  const tabCounts = useMemo(() => {
    return settings.reduce<Record<SiteContentTabId, number>>(
      (result, setting) => {
        const tab = getSiteContentTab(setting.key);
        result[tab] += 1;
        return result;
      },
      {
        header: 0,
        home: 0,
        products: 0,
        services: 0,
        gallery: 0,
        about: 0,
        contact: 0,
        footer: 0,
        general: 0,
      },
    );
  }, [settings]);

  const visibleSettings = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return settings
      .filter((setting) => {
        const settingTab = getSiteContentTab(setting.key);

        if (settingTab !== activeTab) {
          return false;
        }

        if (!keyword) {
          return true;
        }

        return `${setting.key} ${formatLabel(setting.key)} ${formState[setting.key] ?? ''}`
          .toLowerCase()
          .includes(keyword);
      })
      .sort((left, right) => {
        const leftIndex = promoBannerSettingOrder.indexOf(left.key);
        const rightIndex = promoBannerSettingOrder.indexOf(right.key);

        if (leftIndex < 0 && rightIndex < 0) return 0;
        if (leftIndex < 0) return -1;
        if (rightIndex < 0) return 1;
        return leftIndex - rightIndex;
      });
  }, [activeTab, formState, search, settings]);

  const groupedSettings = useMemo(() => {
    return visibleSettings.reduce<Record<ContentGroupId, SettingRow[]>>(
      (groups, item) => {
        groups[getGroup(item.key)].push(item);
        return groups;
      },
      {
        hero: [],
        navigation: [],
        content: [],
        contact: [],
        social: [],
        general: [],
      },
    );
  }, [visibleSettings]);

  const changedCount = Object.keys(formState).filter(
    (key) => formState[key] !== originalState[key],
  ).length;

  const handleChange = (key: string, value: string) => {
    setFormState((current) => ({ ...current, [key]: value }));
    setSaveStatus((current) => ({ ...current, [key]: 'idle' }));
  };

  const handleSave = async (key: string) => {
    if (saveStatus[key] === 'saving') return;

    const savedValue = formState[key] ?? '';

    setSaveStatus((current) => ({
      ...current,
      [key]: 'saving',
    }));

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key,
          value: savedValue,
        }),
      });

      const result = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(result.message || `Gagal memperbarui ${key}.`);
      }

      setOriginalState((current) => ({
        ...current,
        [key]: savedValue,
      }));

      setSettings((current) =>
        current.map((item) => (item.key === key ? { ...item, value: savedValue } : item)),
      );

      setSaveStatus((current) => ({
        ...current,
        [key]: 'saved',
      }));

      window.setTimeout(() => {
        setSaveStatus((current) => ({
          ...current,
          [key]: 'idle',
        }));
      }, 2200);
    } catch (saveError) {
      console.error(saveError);

      setSaveStatus((current) => ({
        ...current,
        [key]: 'error',
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <LoaderCircle className="h-7 w-7 animate-spin text-sky-300" />
        <p className="text-sm">Memuat pengaturan website...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="admin-panel relative overflow-hidden rounded-[26px] px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-24 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl"
        />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-violet-300/15 bg-violet-400/[0.07] px-3 py-1.5 text-xs font-semibold text-violet-200">
              <Sparkles className="h-3.5 w-3.5" />
              Content management
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Pengaturan Teks Website
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Edit tulisan website yang disimpan di Neon PostgreSQL. Setiap field tetap disimpan
              secara individual agar perubahan lebih aman.
            </p>
          </div>

          <Link
            href="/admin/social-media"
            className="inline-flex h-12 items-center justify-center gap-2 self-start rounded-xl border border-sky-300/15 bg-sky-400/[0.07] px-5 text-sm font-semibold text-sky-200 transition hover:-translate-y-0.5 hover:border-sky-300/25 hover:bg-sky-400/[0.12] lg:self-auto"
          >
            <Share2 className="h-4 w-4" />
            Atur sosial media
          </Link>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-400/[0.06] px-5 py-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          Gagal memuat pengaturan dari Neon: {error}
        </div>
      )}

      <div className="admin-panel rounded-3xl p-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {siteContentTabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearch('');
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg'
                    : 'border border-white/8 bg-white/2 text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    isActive ? 'bg-white/15 text-white' : 'bg-white/5 text-slate-500'
                  }`}
                >
                  {tabCounts[tab.id]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t border-white/8 px-2 pt-3">
          <p className="text-sm text-slate-400">
            {siteContentTabs.find((tab) => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      <section className="admin-panel rounded-[22px] p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-lg">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-600" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari field pengaturan..."
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

          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-slate-500">
              {visibleSettings.length} field ditampilkan
            </span>
            {changedCount > 0 && (
              <span className="rounded-lg border border-amber-300/10 bg-amber-400/[0.06] px-3 py-2 font-semibold text-amber-200">
                {changedCount} belum disimpan
              </span>
            )}
          </div>
        </div>
      </section>

      {groupOrder.map((groupKey) => {
        const items = groupedSettings[groupKey];
        if (items.length === 0) return null;

        const group = groupDetails[groupKey];
        const GroupIcon = group.icon;

        return (
          <section key={groupKey} className="admin-panel overflow-hidden rounded-[24px]">
            <div className="flex items-start gap-4 border-b border-white/[0.07] px-5 py-5 sm:px-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.04] text-sky-200">
                <GroupIcon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-semibold text-white">{group.title}</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">{group.description}</p>
              </div>
            </div>

            <div className="grid gap-4 p-4 sm:p-6 xl:grid-cols-2">
              {items.map((setting, index) => {
                const value = formState[setting.key] ?? '';
                const status = saveStatus[setting.key] ?? 'idle';
                const changed = value !== originalState[setting.key];
                const textarea = shouldUseTextarea(setting.key, value);
                const booleanSetting = isBooleanSetting(setting.key);
                const inputType = getInputType(setting.key);
                const isRotationSpeed = setting.key === 'hero_rotation_speed';
                const imageUploadKind =
                  setting.key === 'hero_background_url'
                    ? 'hero'
                    : setting.key === 'header_brand_logo_url'
                      ? 'logo'
                      : setting.key === 'general_favicon_url'
                        ? 'favicon'
                        : setting.key.startsWith('home_promo_banner') &&
                            setting.key.endsWith('_desktop_url')
                          ? 'banner-desktop'
                          : setting.key.startsWith('home_promo_banner') &&
                              setting.key.endsWith('_mobile_url')
                            ? 'banner-mobile'
                            : null;

                return (
                  <motion.article
                    key={setting.key}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(index * 0.025, 0.18) }}
                    className={`rounded-2xl border p-4 transition sm:p-5 ${
                      changed
                        ? 'border-amber-300/15 bg-amber-400/[0.035]'
                        : 'border-white/[0.07] bg-white/[0.022] hover:border-white/[0.11]'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <label
                          htmlFor={setting.key}
                          className="block text-sm font-semibold text-slate-200"
                        >
                          {formatLabel(setting.key)}
                        </label>
                        <p className="mt-1 break-all font-mono text-[10px] text-slate-600">
                          {setting.key}
                        </p>
                      </div>
                      {changed && (
                        <span className="shrink-0 rounded-full border border-amber-300/10 bg-amber-400/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200">
                          Diubah
                        </span>
                      )}
                    </div>

                    {imageUploadKind && (
                      <SettingsImageUpload
                        kind={imageUploadKind}
                        label={formatLabel(setting.key)}
                        value={value}
                        savedValue={originalState[setting.key] ?? ''}
                        saving={status === 'saving'}
                        onChange={(nextValue) => handleChange(setting.key, nextValue)}
                      />
                    )}
                    {booleanSetting ? (
                      <select
                        id={setting.key}
                        value={value || 'true'}
                        onChange={(event) => handleChange(setting.key, event.target.value)}
                        className="admin-field h-12 rounded-xl px-4 text-sm"
                      >
                        <option value="true">Aktif</option>
                        <option value="false">Nonaktif</option>
                      </select>
                    ) : textarea ? (
                      <textarea
                        id={setting.key}
                        rows={4}
                        value={value}
                        onChange={(event) => handleChange(setting.key, event.target.value)}
                        className="admin-field min-h-28 resize-y rounded-xl px-4 py-3 text-sm leading-6"
                      />
                    ) : (
                      <input
                        id={setting.key}
                        type={inputType}
                        min={isRotationSpeed ? 1000 : undefined}
                        step={isRotationSpeed ? 100 : undefined}
                        value={value}
                        onChange={(event) => handleChange(setting.key, event.target.value)}
                        className="admin-field h-12 rounded-xl px-4 text-sm"
                      />
                    )}

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="min-h-5 text-[11px]">
                        {status === 'saved' && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-300">
                            <Check className="h-3.5 w-3.5" /> Tersimpan
                          </span>
                        )}
                        {status === 'error' && (
                          <span className="inline-flex items-center gap-1.5 text-red-300">
                            <AlertCircle className="h-3.5 w-3.5" /> Gagal disimpan
                          </span>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleSave(setting.key)}
                        disabled={!changed || status === 'saving'}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(14,165,233,0.16)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-y-0"
                      >
                        {status === 'saving' ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        {status === 'saving' ? 'Menyimpan' : 'Simpan'}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </section>
        );
      })}

      {visibleSettings.length === 0 && (
        <section className="admin-panel flex min-h-[300px] flex-col items-center justify-center rounded-[24px] px-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.035] text-slate-600">
            <FileText className="h-7 w-7" />
          </span>
          <h3 className="mt-5 font-semibold text-slate-200">
            {search ? 'Field tidak ditemukan' : 'Belum ada field pada tab ini'}
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {search
              ? 'Coba gunakan kata kunci pencarian yang berbeda.'
              : 'Pastikan SQL NeonDB untuk bagian ini sudah dijalankan agar field CMS muncul.'}
          </p>
        </section>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-sky-300/10 bg-sky-400/[0.045] p-4 text-xs leading-5 text-sky-100/65">
        <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
        Perubahan disimpan langsung ke tabel{' '}
        <strong className="font-semibold text-sky-100">settings</strong> di Neon menggunakan key
        yang sama.
      </div>
    </div>
  );
}
