'use client';

import { ImageIcon, LoaderCircle, Trash2, UploadCloud } from 'lucide-react';
import { type ChangeEvent, useEffect, useId, useRef, useState } from 'react';

import { cleanupCloudinaryUploads } from '@/lib/cleanup-cloudinary-upload';

type UploadKind = 'hero' | 'logo' | 'favicon' | 'banner-desktop' | 'banner-mobile';

type UploadResponse = {
  url?: string;
  publicId?: string;
  message?: string;
};

type SettingsImageUploadProps = {
  kind: UploadKind;
  label: string;
  value: string;
  savedValue: string;
  saving: boolean;
  onChange: (value: string) => void;
};

const COPY: Record<
  UploadKind,
  {
    title: string;
    description: string;
    folder: string;
    previewClass: string;
    imageClass: string;
  }
> = {
  hero: {
    title: 'Upload background hero',
    description: 'Gunakan foto landscape. Rekomendasi minimal 1920 × 1080 piksel.',
    folder: 'hero',
    previewClass: 'aspect-[16/9]',
    imageClass: 'object-cover',
  },
  logo: {
    title: 'Upload logo perusahaan',
    description: 'Gunakan PNG atau WebP transparan agar logo terlihat rapi pada navigasi.',
    folder: 'logos',
    previewClass: 'aspect-[3/1]',
    imageClass: 'object-contain p-3',
  },
  favicon: {
    title: 'Upload favicon website',
    description: 'Gunakan logo persegi dalam format PNG atau WebP. Rekomendasi 512 x 512 piksel.',
    folder: 'logos',
    previewClass: 'aspect-square max-w-48',
    imageClass: 'object-contain p-4',
  },
  'banner-desktop': {
    title: 'Upload banner desktop',
    description: 'Gunakan gambar landscape. Rekomendasi rasio 4:1, minimal 1600 x 400 piksel.',
    folder: 'banners',
    previewClass: 'aspect-[4/1]',
    imageClass: 'object-cover',
  },
  'banner-mobile': {
    title: 'Upload banner mobile',
    description:
      'Gunakan gambar khusus layar ponsel. Rekomendasi rasio 4:3, minimal 800 x 600 piksel.',
    folder: 'banners',
    previewClass: 'aspect-[4/3]',
    imageClass: 'object-cover',
  },
};

export default function SettingsImageUpload({
  kind,
  label,
  value,
  savedValue,
  saving,
  onChange,
}: SettingsImageUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingPublicIdRef = useRef('');
  const savingRef = useRef(saving);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const copy = COPY[kind];

  useEffect(() => {
    if (value === savedValue) {
      pendingPublicIdRef.current = '';
    }
  }, [savedValue, value]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  useEffect(() => {
    return () => {
      if (pendingPublicIdRef.current && !savingRef.current) {
        void cleanupCloudinaryUploads([pendingPublicIdRef.current], true);
      }
    };
  }, []);

  async function handleFile(file: File | undefined) {
    if (!file || uploading) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Format yang didukung: JPG, PNG, atau WebP.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 10 MB.');
      return;
    }

    try {
      setUploading(true);
      setError('');

      const data = new FormData();
      data.append('file', file);
      data.append('folder', copy.folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: data,
      });
      const result = (await response.json()) as UploadResponse;

      if (!response.ok || !result.url) {
        throw new Error(result.message || 'Upload gambar ke Cloudinary gagal.');
      }

      if (pendingPublicIdRef.current && pendingPublicIdRef.current !== result.publicId) {
        await cleanupCloudinaryUploads([pendingPublicIdRef.current]);
      }

      pendingPublicIdRef.current = result.publicId || '';
      onChange(result.url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : 'Upload gambar ke Cloudinary gagal.',
      );
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-sky-300/10 bg-sky-400/[0.035] p-3.5 sm:p-4">
      <div className="mb-3 flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-sky-300/15 bg-sky-400/[0.08] text-sky-200">
          <ImageIcon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-100">{copy.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{copy.description}</p>
        </div>
      </div>

      <div
        className={
          copy.previewClass +
          ' relative grid w-full place-items-center overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950/45'
        }
      >
        {value ? (
          // URL berasal dari Cloudinary setelah upload admin.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt={'Preview ' + label}
            className={'h-full w-full ' + copy.imageClass}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center text-slate-600">
            <ImageIcon className="h-7 w-7" aria-hidden="true" />
            <span className="text-xs">Belum ada gambar</span>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950/75 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-100">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Mengunggah ke Cloudinary...
            </div>
          </div>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          void handleFile(event.target.files?.[0])
        }
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-sky-300/15 bg-sky-400/[0.08] px-4 text-xs font-semibold text-sky-100 transition hover:bg-sky-400/[0.13] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <UploadCloud className="h-4 w-4" />
          )}
          {value ? 'Ganti gambar' : 'Pilih gambar'}
        </button>

        {value && (
          <button
            type="button"
            disabled={uploading}
            onClick={() => {
              setError('');
              if (pendingPublicIdRef.current) {
                void cleanupCloudinaryUploads([pendingPublicIdRef.current]);
                pendingPublicIdRef.current = '';
              }
              onChange('');
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-300/10 bg-red-400/[0.055] px-4 text-xs font-semibold text-red-200 transition hover:bg-red-400/[0.1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Hapus dari website
          </button>
        )}
      </div>

      {error ? (
        <p className="mt-3 text-xs leading-5 text-red-300">{error}</p>
      ) : (
        <p className="mt-3 text-[11px] leading-5 text-slate-600">
          Setelah upload berhasil, tekan tombol Simpan pada field ini agar URL tersimpan ke NeonDB.
        </p>
      )}
    </div>
  );
}
