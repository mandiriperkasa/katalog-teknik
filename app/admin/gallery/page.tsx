'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  Filter,
  ImageIcon,
  LoaderCircle,
  PackageOpen,
  Pencil,
  Play,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type GalleryRow = {
  id?: string;
  title?: string | null;
  category?: string | null;
  location?: string | null;
  mediaType?: 'image' | 'youtube';
  youtubeVideoId?: string | null;
  imageUrl?: string | null;
  sortOrder?: number | null;
};

export default function GalleryPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [gallery, setGallery] = useState<GalleryRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [category, setCategory] = useState('Semua kategori');

  async function handleDelete(id: string) {
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus gallery ini?');

    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingId(id);

      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus gallery.');
      }

      setGallery((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Terjadi kesalahan.');
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadGallery() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/gallery', {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Data gallery tidak dapat dimuat.');
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error('Format data gallery tidak valid.');
        }

        setGallery(data as GalleryRow[]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        setError(error instanceof Error ? error.message : 'Terjadi kesalahan.');
      } finally {
        setDeletingId(null);

        setLoading(false);
      }
    }

    loadGallery();

    return () => controller.abort();
  }, []);

  const categories = useMemo(() => {
    const unique = new Set(
      gallery
        .map((item) => item.category?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    return ['Semua kategori', ...Array.from(unique)];
  }, [gallery]);

  const filteredGallery = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return gallery.filter((item) => {
      const matchCategory = category === 'Semua kategori' || item.category === category;

      const searchable = [item.title, item.category, item.location]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchCategory && (!keyword || searchable.includes(keyword));
    });
  }, [gallery, search, category]);

  return (
    <div className="space-y-6">
      <section className="admin-panel rounded-[26px] px-6 py-7 sm:px-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/15 bg-blue-400/[0.07] px-3 py-1.5 text-xs font-semibold text-blue-200">
              <ImageIcon className="h-3.5 w-3.5" />
              Dokumentasi
            </div>

            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Manajemen Gallery
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Kelola foto dan video dokumentasi serta portofolio perusahaan.
            </p>
          </div>

          <Link
            href="/admin/gallery/add"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Tambah Gallery
          </Link>
        </div>
      </section>

      <section className="admin-panel rounded-[24px] p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul atau lokasi..."
              className="admin-field h-12 rounded-xl pl-11"
            />

            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            )}
          </div>

          <div className="relative lg:w-64">
            <Filter className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="admin-field h-12 rounded-xl pl-11"
            >
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {error && (
        <div className="flex gap-3 rounded-2xl border border-red-300/15 bg-red-400/[0.06] p-4 text-red-100">
          <AlertCircle />

          {error}
        </div>
      )}

      <section className="admin-panel overflow-hidden rounded-[24px]">
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <LoaderCircle className="animate-spin text-sky-300" />
          </div>
        ) : filteredGallery.length === 0 ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center">
            <PackageOpen className="h-10 w-10 text-slate-600" />

            <p className="mt-4 text-slate-400">Belum ada gallery.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/[0.07] text-xs uppercase text-slate-600">
                  <th className="px-6 py-4 text-left">Media</th>

                  <th className="px-4 py-4">Judul</th>

                  <th className="px-4 py-4">Kategori</th>

                  <th className="px-4 py-4">Lokasi</th>

                  <th className="px-4 py-4">Urutan</th>

                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/[0.05]">
                <AnimatePresence>
                  {filteredGallery.map((item, index) => (
                    <motion.tr
                      key={item.id || index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/[0.08] bg-slate-950">
                            {item.mediaType === 'youtube' && item.youtubeVideoId ? (
                              <>
                                <Image
                                  src={`https://i.ytimg.com/vi/${item.youtubeVideoId}/hqdefault.jpg`}
                                  alt={item.title || 'Thumbnail video YouTube'}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />

                                <div className="absolute inset-0 grid place-items-center bg-black/25">
                                  <span className="grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-red-600/90 text-white shadow-lg">
                                    <Play className="ml-0.5 h-3.5 w-3.5" fill="currentColor" />
                                  </span>
                                </div>
                              </>
                            ) : item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.title || 'Gallery'}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center">
                                <ImageIcon className="h-5 w-5 text-slate-600" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                                item.mediaType === 'youtube'
                                  ? 'border-red-300/15 bg-red-400/[0.08] text-red-200'
                                  : 'border-sky-300/15 bg-sky-400/[0.08] text-sky-200'
                              }`}
                            >
                              {item.mediaType === 'youtube' ? 'Video' : 'Foto'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-sm text-white">{item.title || '-'}</td>

                      <td className="px-4 py-4 text-sm text-slate-400">{item.category || '-'}</td>

                      <td className="px-4 py-4 text-sm text-slate-400">{item.location || '-'}</td>

                      <td className="px-4 py-4">{item.sortOrder ?? 0}</td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/gallery/${item.id}/edit`}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-blue-300/10 text-blue-200"
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>

                          <button
                            onClick={() => item.id && handleDelete(item.id)}
                            className="grid h-9 w-9 place-items-center rounded-lg border border-red-300/10 text-red-200"
                          >
                            {deletingId === item.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
    </div>
  );
}
