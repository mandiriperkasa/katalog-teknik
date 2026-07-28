'use client';

import { ArrowLeft, ImagePlus, LoaderCircle, Save, Video } from 'lucide-react';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { cleanupCloudinaryUploads } from '@/lib/cleanup-cloudinary-upload';

type MediaType = 'image' | 'youtube';

type GalleryFormProps = {
  mode: 'create' | 'edit';

  initialData?: {
    id: string;
    title: string;
    category: string;
    location: string;
    description?: string | null;
    mediaType?: MediaType;
    youtubeVideoId?: string | null;
    imageUrl?: string | null;
    imagePublicId?: string | null;
    sortOrder: number;
  };
};

function extractYoutubeVideoId(value: string) {
  const input = value.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    return input;
  }

  try {
    const url = new URL(input);
    const hostname = url.hostname.replace(/^www\./, '');

    let videoId = '';

    if (hostname === 'youtu.be') {
      videoId = url.pathname.split('/').filter(Boolean)[0] || '';
    }

    if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
      if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else {
        const parts = url.pathname.split('/').filter(Boolean);

        const supportedPaths = ['embed', 'shorts', 'live', 'v'];

        if (supportedPaths.includes(parts[0] || '')) {
          videoId = parts[1] || '';
        }
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId) ? videoId : '';
  } catch {
    return '';
  }
}

export default function GalleryForm({ mode, initialData }: GalleryFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');

  const [category, setCategory] = useState(initialData?.category || '');

  const [location, setLocation] = useState(initialData?.location || '');

  const [description, setDescription] = useState(initialData?.description || '');

  const [mediaType, setMediaType] = useState<MediaType>(
    initialData?.mediaType === 'youtube' ? 'youtube' : 'image',
  );

  const [youtubeInput, setYoutubeInput] = useState(initialData?.youtubeVideoId || '');

  const youtubeVideoId = useMemo(() => extractYoutubeVideoId(youtubeInput), [youtubeInput]);

  const [sortOrder, setSortOrder] = useState(
    initialData?.sortOrder ? String(initialData.sortOrder) : '',
  );

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [preview, setPreview] = useState(initialData?.imageUrl || '');

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState('');

  function handleImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImageFile(file);

    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    setLoading(true);
    setError('');
    let newPublicId = '';

    try {
      if (!title.trim()) {
        throw new Error('Judul gallery wajib diisi.');
      }

      if (!category.trim()) {
        throw new Error('Kategori gallery wajib diisi.');
      }

      if (!description.trim()) {
        throw new Error('Detail pekerjaan wajib diisi.');
      }

      if (mediaType === 'image' && mode === 'create' && !imageFile) {
        throw new Error('Foto gallery wajib dipilih.');
      }

      if (mediaType === 'youtube' && !youtubeVideoId) {
        throw new Error('URL atau ID video YouTube tidak valid.');
      }

      let imageUrl = initialData?.imageUrl || '';

      let imagePublicId = initialData?.imagePublicId || '';

      if (mediaType === 'image' && imageFile) {
        const data = new FormData();

        data.append('file', imageFile);

        data.append('folder', 'gallery');

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: data,
        });

        const uploadResult = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.message || 'Upload gambar gagal');
        }

        imageUrl = uploadResult.url;

        imagePublicId = uploadResult.publicId;
        newPublicId = uploadResult.publicId;
      }

      if (mediaType === 'image' && !imageUrl) {
        throw new Error('Silakan pilih gambar gallery terlebih dahulu.');
      }

      const url = mode === 'create' ? '/api/gallery' : `/api/gallery/${initialData?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          category,
          location,
          description,
          mediaType,

          youtubeVideoId: mediaType === 'youtube' ? youtubeVideoId : null,

          imageUrl: mediaType === 'image' ? imageUrl || initialData?.imageUrl || null : null,

          imagePublicId: mediaType === 'image' ? imagePublicId || null : null,

          sortOrder: Number(sortOrder) || 1,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan gallery.');
      }

      window.location.href = '/admin/gallery';
    } catch (error) {
      await cleanupCloudinaryUploads([newPublicId]);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-panel rounded-[26px] px-6 py-7">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/gallery"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08]"
          >
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </Link>

          <div>
            <h2 className="text-2xl font-semibold text-white">
              {mode === 'create' ? 'Tambah Gallery' : 'Edit Gallery'}
            </h2>

            <p className="text-sm text-slate-400">
              {mode === 'create'
                ? 'Tambahkan dokumentasi gambar atau video YouTube.'
                : 'Perbarui informasi dokumentasi atau portofolio perusahaan.'}
            </p>
          </div>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="admin-panel space-y-6 rounded-[24px] p-6">
        {error && (
          <div className="rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm text-slate-300">Judul Gallery</label>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="admin-field mt-2 h-12 rounded-xl"
            placeholder="Contoh: Training Customer"
          />
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="text-sm text-slate-300">Kategori</label>

            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="admin-field mt-2 h-12 rounded-xl"
              placeholder="Workshop"
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Lokasi</label>

            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="admin-field mt-2 h-12 rounded-xl"
              placeholder="Jakarta"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-300">Detail Pekerjaan</label>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={5}
            className="admin-field mt-2 min-h-32 resize-y rounded-xl px-4 py-3"
            placeholder="Jelaskan pekerjaan, proses instalasi, produk yang digunakan, dan hasil pekerjaan."
          />

          <p className="mt-2 text-xs text-slate-500">
            Detail ini akan ditampilkan ketika pengunjung membuka media galeri.
          </p>
        </div>

        <div>
          <label className="text-sm text-slate-300">Jenis Media</label>

          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMediaType('image')}
              className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 text-left transition ${
                mediaType === 'image'
                  ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
                  : 'border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20'
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5">
                <ImagePlus className="h-5 w-5" />
              </span>

              <span>
                <strong className="block text-sm">Gambar</strong>

                <span className="mt-1 block text-xs opacity-70">Upload ke Cloudinary</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setMediaType('youtube')}
              className={`flex min-h-20 items-center gap-3 rounded-2xl border px-4 text-left transition ${
                mediaType === 'youtube'
                  ? 'border-red-300/30 bg-red-400/10 text-red-100'
                  : 'border-white/10 bg-white/[0.025] text-slate-400 hover:border-white/20'
              }`}
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/5">
                <Video className="h-5 w-5" />
              </span>

              <span>
                <strong className="block text-sm">Video YouTube</strong>

                <span className="mt-1 block text-xs opacity-70">Tempel URL video</span>
              </span>
            </button>
          </div>
        </div>

        {mediaType === 'image' ? (
          <div>
            <label className="text-sm text-slate-300">Foto Gallery</label>

            <label className="mt-2 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              {preview ? (
                <div className="relative h-36 w-36 overflow-hidden rounded-xl">
                  <Image src={preview} alt="preview" fill sizes="144px" className="object-cover" />
                </div>
              ) : (
                <>
                  <ImagePlus className="h-10 w-10 text-slate-500" />

                  <span className="mt-3 text-sm text-slate-500">
                    {mode === 'create' ? 'Pilih gambar' : 'Klik untuk mengganti gambar'}
                  </span>
                </>
              )}

              <input hidden type="file" accept="image/*" onChange={handleImage} />
            </label>
          </div>
        ) : (
          <div>
            <label className="text-sm text-slate-300">URL Video YouTube</label>

            <input
              value={youtubeInput}
              onChange={(event) => setYoutubeInput(event.target.value)}
              className="admin-field mt-2 h-12 rounded-xl"
              placeholder="https://www.youtube.com/watch?v=..."
            />

            <p className="mt-2 text-xs text-slate-500">
              Mendukung URL YouTube biasa, youtu.be, Shorts, Live, Embed, atau ID video.
            </p>

            {youtubeInput && !youtubeVideoId && (
              <p className="mt-2 text-xs text-red-300">URL atau ID YouTube belum valid.</p>
            )}

            {youtubeVideoId && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                    title="Preview video YouTube"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="text-sm text-slate-300">Urutan Tampilan</label>

          <input
            type="number"
            min="1"
            max="999"
            value={sortOrder}
            onChange={(event) => {
              const value = event.target.value;

              if (value === '' || (Number(value) >= 1 && Number(value) <= 999)) {
                setSortOrder(value);
              }
            }}
            className="admin-field mt-2 h-12 rounded-xl"
            placeholder="Contoh: 1"
          />

          <p className="mt-2 text-xs text-slate-500">
            Angka lebih kecil akan tampil lebih awal. Gunakan 1 untuk media utama.
          </p>
        </div>

        <button
          disabled={loading}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-sky-500 px-6 text-sm font-semibold text-white hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <LoaderCircle className="h-4 w-4 animate-spin" />}

          <Save className="h-4 w-4" />

          {mode === 'create' ? 'Simpan Gallery' : 'Perbarui Gallery'}
        </button>
      </form>
    </div>
  );
}
