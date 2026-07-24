'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ExternalLink,
  Link2,
  LoaderCircle,
  Music2,
  Save,
  Share2,
  ShoppingBag,
  Store,
  Users,
  Video,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type SettingRow = {
  key?: string;
  value?: string;
};

type SocialKey =
  | 'link_tiktok'
  | 'link_fb'
  | 'link_youtube'
  | 'link_instagram'
  | 'link_tokopedia'
  | 'link_tiktok_shop';

type SocialValues = Record<SocialKey, string>;

type SaveResponse = {
  success?: boolean;
  message?: string;
};

const initialValues: SocialValues = {
  link_tiktok: '',
  link_fb: '',
  link_youtube: '',
  link_instagram: '',
  link_tokopedia: '',
  link_tiktok_shop: '',
};

const platforms = [
  {
    key: 'link_tiktok' as const,
    name: 'TikTok',
    description: 'Profil video pendek perusahaan.',
    placeholder: 'https://www.tiktok.com/@username',
    icon: Music2,
    accent: 'from-slate-400/15 to-cyan-400/[0.04]',
  },
  {
    key: 'link_fb' as const,
    name: 'Facebook',
    description: 'Halaman resmi Facebook perusahaan.',
    placeholder: 'https://www.facebook.com/nama-halaman',
    icon: Users,
    accent: 'from-blue-500/18 to-blue-300/[0.04]',
  },
  {
    key: 'link_youtube' as const,
    name: 'YouTube',
    description: 'Kanal video dan dokumentasi perusahaan.',
    placeholder: 'https://www.youtube.com/@nama-channel',
    icon: Video,
    accent: 'from-red-500/16 to-red-300/[0.035]',
  },
  {
    key: 'link_instagram' as const,
    name: 'Instagram',
    description: 'Profil visual dan informasi terbaru.',
    placeholder: 'https://www.instagram.com/username',
    icon: Camera,
    accent: 'from-fuchsia-500/16 to-amber-300/[0.035]',
  },
  {
    key: 'link_tokopedia' as const,
    name: 'Tokopedia',
    description: 'Tautan toko resmi perusahaan di Tokopedia.',
    placeholder: 'https://www.tokopedia.com/nama-toko',
    icon: Store,
    accent: 'from-emerald-500/16 to-green-300/[0.035]',
  },
  {
    key: 'link_tiktok_shop' as const,
    name: 'TikTok Shop',
    description: 'Tautan etalase produk perusahaan di TikTok Shop.',
    placeholder: 'https://shop.tiktok.com/view/product/...',
    icon: ShoppingBag,
    accent: 'from-cyan-500/14 via-fuchsia-500/[0.07] to-red-400/[0.035]',
  },
];

function isValidWebUrl(value: string) {
  if (!value.trim()) {
    return true;
  }

  try {
    const parsedUrl = new URL(value);

    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export default function SocialMediaSettingsPage() {
  const initialized = useRef(false);

  const [values, setValues] = useState<SocialValues>(initialValues);

  const [savedValues, setSavedValues] = useState<SocialValues>(initialValues);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result?.message || `Gagal memuat pengaturan (HTTP ${response.status}).`);
        }

        if (!Array.isArray(result)) {
          throw new Error('Format data pengaturan tidak valid.');
        }

        const rows = result.filter(
          (row): row is Required<SettingRow> =>
            typeof row?.key === 'string' && row.key.trim().length > 0,
        );

        const settingsMap = Object.fromEntries(rows.map((row) => [row.key, row.value ?? '']));

        const nextValues: SocialValues = {
          link_tiktok: settingsMap.link_tiktok ?? '',
          link_fb: settingsMap.link_fb ?? '',
          link_youtube: settingsMap.link_youtube ?? '',
          link_instagram: settingsMap.link_instagram ?? '',
          link_tokopedia: settingsMap.link_tokopedia ?? '',
          link_tiktok_shop: settingsMap.link_tiktok_shop ?? '',
        };

        if (!cancelled) {
          setValues(nextValues);
          setSavedValues(nextValues);
          initialized.current = true;
        }
      } catch (loadError) {
        const errorMessage =
          loadError instanceof Error ? loadError.message : 'Gagal memuat pengaturan sosial media.';

        if (!cancelled) {
          setError(errorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!initialized.current) {
      void loadSettings();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const invalidKeys = useMemo(
    () =>
      platforms
        .filter((platform) => !isValidWebUrl(values[platform.key]))
        .map((platform) => platform.key),
    [values],
  );

  const changedCount = platforms.filter(
    (platform) => values[platform.key].trim() !== savedValues[platform.key].trim(),
  ).length;

  const configuredCount = platforms.filter((platform) => values[platform.key].trim()).length;

  const handleChange = (key: SocialKey, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setStatus('idle');
    setMessage('');
  };

  const saveSetting = async (key: SocialKey, value: string) => {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        key,
        value,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as SaveResponse;

    if (!response.ok) {
      throw new Error(result.message || `Gagal menyimpan ${key}.`);
    }
  };

  const handleSave = async () => {
    if (invalidKeys.length > 0 || isSaving || changedCount === 0) {
      return;
    }

    setIsSaving(true);
    setStatus('idle');
    setMessage('');

    const normalizedValues: SocialValues = {
      link_tiktok: values.link_tiktok.trim(),
      link_fb: values.link_fb.trim(),
      link_youtube: values.link_youtube.trim(),
      link_instagram: values.link_instagram.trim(),
      link_tokopedia: values.link_tokopedia.trim(),
      link_tiktok_shop: values.link_tiktok_shop.trim(),
    };

    const changedPlatforms = platforms.filter(
      (platform) => normalizedValues[platform.key] !== savedValues[platform.key].trim(),
    );

    try {
      for (const platform of changedPlatforms) {
        await saveSetting(platform.key, normalizedValues[platform.key]);
      }

      setValues(normalizedValues);
      setSavedValues(normalizedValues);

      setStatus('success');
      setMessage(
        'Link sosial media berhasil disimpan ke database Neon. Muat ulang beranda untuk melihat perubahan.',
      );
    } catch (saveError) {
      console.error('Gagal menyimpan sosial media:', saveError);

      setStatus('error');

      setMessage(
        saveError instanceof Error ? saveError.message : 'Gagal menyimpan link sosial media.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-500">
        <LoaderCircle className="h-7 w-7 animate-spin text-sky-300" />

        <p className="text-sm">Memuat pengaturan sosial media...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="admin-panel relative overflow-hidden rounded-[26px] px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-400/[0.07] px-3 py-1.5 text-xs font-semibold text-cyan-200">
              <Share2 className="h-3.5 w-3.5" />
              Pengaturan footer
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Link Sosial Media
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Kelola alamat TikTok, Facebook, YouTube, Instagram, Tokopedia, dan TikTok Shop yang
              ditampilkan pada footer website.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-xs text-slate-500 sm:block">
              <strong className="font-semibold text-slate-200">
                {configuredCount}/{platforms.length}
              </strong>{' '}
              tautan terisi
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || invalidKeys.length > 0 || changedCount === 0}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(14,165,233,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_38px_rgba(14,165,233,0.3)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
              {isSaving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isSaving
                ? 'Menyimpan...'
                : changedCount > 0
                  ? `Simpan ${changedCount} Perubahan`
                  : 'Sudah Tersimpan'}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-400/[0.06] px-5 py-4 text-sm text-red-100">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />

          <span>Gagal memuat pengaturan: {error}</span>
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        {platforms.map((platform, index) => {
          const Icon = platform.icon;

          const value = values[platform.key];

          const invalid = !isValidWebUrl(value);

          const changed = value.trim() !== savedValues[platform.key].trim();

          return (
            <motion.article
              key={platform.key}
              initial={{
                opacity: 0,
                y: 14,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.06,
                duration: 0.34,
              }}
              className={`admin-panel relative overflow-hidden rounded-[24px] bg-gradient-to-br p-5 sm:p-6 ${platform.accent}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/[0.09] bg-white/[0.055] text-slate-100 shadow-lg">
                    <Icon className="h-5 w-5" />
                  </span>

                  <div>
                    <h3 className="font-semibold text-white">{platform.name}</h3>

                    <p className="mt-1 text-xs leading-5 text-slate-500">{platform.description}</p>
                  </div>
                </div>

                {changed && (
                  <span className="shrink-0 rounded-full border border-amber-300/10 bg-amber-400/[0.07] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200">
                    Diubah
                  </span>
                )}
              </div>

              <label
                htmlFor={platform.key}
                className="mt-6 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600"
              >
                URL {platform.name}
              </label>

              <div className="relative mt-2">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  id={platform.key}
                  type="url"
                  inputMode="url"
                  value={value}
                  onChange={(event) => handleChange(platform.key, event.target.value)}
                  placeholder={platform.placeholder}
                  aria-invalid={invalid}
                  className={`admin-field h-12 rounded-xl pl-11 pr-12 text-sm ${
                    invalid ? '!border-red-400/50 !shadow-[0_0_0_4px_rgba(248,113,113,0.07)]' : ''
                  }`}
                />

                {value && isValidWebUrl(value) && (
                  <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Buka ${platform.name}`}
                    className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-600 transition hover:bg-white/5 hover:text-sky-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              <div className="mt-3 min-h-5 text-xs">
                {invalid ? (
                  <span className="inline-flex items-center gap-1.5 text-red-300">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Gunakan URL lengkap dengan https://
                  </span>
                ) : value ? (
                  <span className="text-slate-600">
                    Link akan dibuka pada tab baru dari footer.
                  </span>
                ) : (
                  <span className="text-slate-700">Kosongkan apabila tautan belum tersedia.</span>
                )}
              </div>
            </motion.article>
          );
        })}
      </section>

      {message && (
        <motion.div
          initial={{
            opacity: 0,
            y: 8,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          role="status"
          className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-sm ${
            status === 'success'
              ? 'border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-100'
              : 'border-red-300/15 bg-red-400/[0.06] text-red-100'
          }`}
        >
          {status === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
          )}

          <span>{message}</span>
        </motion.div>
      )}

      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4 text-xs leading-5 text-slate-600">
        Data disimpan pada tabel <code className="text-slate-400">settings</code> di database Neon
        menggunakan key <code className="text-slate-400">link_tiktok</code>,{' '}
        <code className="text-slate-400">link_fb</code>,{' '}
        <code className="text-slate-400">link_youtube</code>, dan{' '}
        <code className="text-slate-400">link_instagram</code>,{' '}
        <code className="text-slate-400">link_tokopedia</code>, serta{' '}
        <code className="text-slate-400">link_tiktok_shop</code>.
      </div>
    </div>
  );
}
