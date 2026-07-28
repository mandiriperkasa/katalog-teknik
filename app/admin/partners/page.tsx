/* eslint-disable @next/next/no-img-element */
'use client';

import {
  Handshake,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { cleanupCloudinaryUploads } from '@/lib/cleanup-cloudinary-upload';

type PartnerRow = {
  id: string;
  nama: string;
  urlLogo: string;
};

type FormState = {
  id: string | null;
  nama: string;
  urlLogo: string;
};

const emptyForm: FormState = {
  id: null,
  nama: '',
  urlLogo: '',
};

export default function PartnersPage() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPartners = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/partners', {
        cache: 'no-store',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Logo mitra gagal dimuat.');
      }

      if (!Array.isArray(result)) {
        throw new Error('Format data logo mitra tidak valid.');
      }

      setPartners(result as PartnerRow[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Logo mitra gagal dimuat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadPartners();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadPartners]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function resetForm() {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm(emptyForm);
    setFile(null);
    setPreviewUrl('');
    setFormOpen(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function openCreateForm() {
    resetForm();
    setFormOpen(true);
  }

  function openEditForm(partner: PartnerRow) {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setForm({
      id: partner.id,
      nama: partner.nama,
      urlLogo: partner.urlLogo,
    });
    setFile(null);
    setPreviewUrl(partner.urlLogo);
    setFormOpen(true);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (!selectedFile) return;

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function uploadLogo(selectedFile: File) {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const response = await fetch('/api/partners/upload', {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();

    if (!response.ok || !result.url) {
      throw new Error(result.message || 'Logo gagal diunggah.');
    }

    return {
      url: String(result.url),
      publicId: String(result.publicId || ''),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nama = form.nama.trim();

    if (!nama) {
      setError('Nama mitra wajib diisi.');
      return;
    }

    if (!file && !form.urlLogo) {
      setError('Pilih file logo terlebih dahulu.');
      return;
    }

    setSaving(true);
    setError('');
    let newPublicId = '';

    try {
      const uploadedLogo = file ? await uploadLogo(file) : null;
      const urlLogo = uploadedLogo?.url || form.urlLogo;
      newPublicId = uploadedLogo?.publicId || '';
      const isEdit = Boolean(form.id);
      const response = await fetch(isEdit ? `/api/partners/${form.id}` : '/api/partners', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nama,
          urlLogo,
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Data mitra gagal disimpan.');
      }

      resetForm();
      await loadPartners();
    } catch (submitError) {
      await cleanupCloudinaryUploads([newPublicId]);
      setError(submitError instanceof Error ? submitError.message : 'Data mitra gagal disimpan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(partner: PartnerRow) {
    const confirmed = window.confirm(`Hapus logo mitra “${partner.nama}”?`);

    if (!confirmed) return;

    setDeletingId(partner.id);
    setError('');

    try {
      const response = await fetch(`/api/partners/${partner.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Logo mitra gagal dihapus.');
      }

      setPartners((current) => current.filter((item) => item.id !== partner.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Logo mitra gagal dihapus.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="admin-panel overflow-hidden rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-300/15 bg-sky-400/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300">
              <Handshake size={14} /> Logo Mitra
            </div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Manajemen Logo Mitra</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Nama digunakan untuk identitas internal dan teks alternatif. Halaman publik hanya
              menampilkan logo dengan ukuran yang seragam.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void loadPartners()}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-slate-200 transition hover:border-sky-300/30 hover:text-white"
            >
              <RefreshCw size={17} /> Muat Ulang
            </button>
            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-4 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:brightness-110"
            >
              <Plus size={18} /> Tambah Mitra
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-300/15 bg-red-400/[0.06] px-5 py-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {formOpen && (
        <section className="admin-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">
                {form.id ? 'Edit Logo Mitra' : 'Tambah Logo Mitra'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                File otomatis dirapikan saat diunggah dan ditampilkan dengan mode object-contain.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:text-white disabled:opacity-50"
              aria-label="Tutup formulir"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Nama mitra
                </span>
                <input
                  type="text"
                  value={form.nama}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      nama: event.target.value,
                    }))
                  }
                  maxLength={120}
                  required
                  className="admin-field h-12 rounded-xl px-4"
                  placeholder="Contoh: PT Maju Jaya"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  File logo
                </span>
                <div className="relative flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-sky-300/20 bg-sky-400/[0.035] px-5 text-center transition hover:border-sky-300/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                  <div>
                    <Upload className="mx-auto mb-2 text-sky-300" size={23} />
                    <p className="text-sm font-semibold text-slate-200">
                      Klik atau tarik logo ke area ini
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      JPG, PNG, atau WEBP · maksimal 3MB
                    </p>
                  </div>
                </div>
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />}
                {saving ? 'Menyimpan...' : 'Simpan Mitra'}
              </button>
            </div>

            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Pratinjau seragam
              </span>
              <div className="flex h-44 items-center justify-center overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pratinjau logo mitra"
                    className="h-20 w-48 object-contain"
                  />
                ) : (
                  <div className="text-center text-slate-600">
                    <ImagePlus className="mx-auto mb-2" size={30} />
                    <p className="text-xs">Belum ada logo</p>
                  </div>
                )}
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="admin-panel overflow-hidden rounded-3xl">
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-5">
          <div>
            <h2 className="font-bold text-white">Daftar Mitra</h2>
            <p className="mt-1 text-xs text-slate-500">{partners.length} logo tersimpan</p>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-56 place-items-center">
            <LoaderCircle className="animate-spin text-sky-300" size={28} />
          </div>
        ) : partners.length === 0 ? (
          <div className="grid min-h-64 place-items-center px-6 text-center">
            <div>
              <Handshake className="mx-auto mb-3 text-slate-600" size={34} />
              <h3 className="font-semibold text-slate-300">Belum ada logo mitra</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tambahkan logo pertama melalui tombol Tambah Mitra.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {partners.map((partner) => (
              <article
                key={partner.id}
                className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
              >
                <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] p-5">
                  <img
                    src={partner.urlLogo}
                    alt={`Logo ${partner.nama}`}
                    className="h-16 w-40 object-contain"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{partner.nama}</p>
                    <p className="mt-1 text-xs text-slate-600">Hanya logo tampil di website</p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(partner)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-sky-300/10 text-sky-200 transition hover:bg-sky-400/10"
                      aria-label={`Edit ${partner.nama}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(partner)}
                      disabled={deletingId === partner.id}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-red-300/10 text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
                      aria-label={`Hapus ${partner.nama}`}
                    >
                      {deletingId === partner.id ? (
                        <LoaderCircle size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
