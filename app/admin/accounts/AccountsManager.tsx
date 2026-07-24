'use client';

import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  LoaderCircle,
  Mail,
  Pencil,
  Power,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

type AdminItem = {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdminForm = {
  name: string;
  email: string;
  password: string;
  isActive: boolean;
};

const emptyForm: AdminForm = {
  name: '',
  email: '',
  password: '',
  isActive: true,
};

function formatDate(value: string | null) {
  if (!value) {
    return 'Belum pernah login';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

async function readMessage(response: Response) {
  const result = (await response.json().catch(() => null)) as { message?: string } | null;

  return result?.message;
}

export default function AccountsManager({ superAdminEmail }: { superAdminEmail: string }) {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyAdminId, setBusyAdminId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeAdminCount = useMemo(() => admins.filter((admin) => admin.isActive).length, [admins]);

  const loadAdmins = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/admin/accounts', {
        cache: 'no-store',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error((await readMessage(response)) || 'Gagal mengambil akun admin.');
      }

      const data = (await response.json()) as AdminItem[];
      setAdmins(data);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Gagal mengambil akun admin.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadAdmins();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadAdmins]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setErrorMessage('');
  };

  const startEditing = (admin: AdminItem) => {
    setEditingId(admin.id);
    setForm({
      name: admin.name,
      email: admin.email,
      password: '',
      isActive: admin.isActive,
    });
    setErrorMessage('');
    setSuccessMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      isActive: form.isActive,
    };

    if (form.password) {
      payload.password = form.password;
    }

    try {
      const isEditing = editingId !== null;
      const response = await fetch(
        isEditing ? `/api/admin/accounts/${editingId}` : '/api/admin/accounts',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error((await readMessage(response)) || 'Akun admin gagal disimpan.');
      }

      setSuccessMessage(
        isEditing ? 'Akun admin berhasil diperbarui.' : 'Akun admin berhasil ditambahkan.',
      );
      resetForm();
      await loadAdmins();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Akun admin gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAdmin = async (admin: AdminItem) => {
    setBusyAdminId(admin.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/accounts/${admin.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          isActive: !admin.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error((await readMessage(response)) || 'Status admin gagal diubah.');
      }

      setSuccessMessage(admin.isActive ? 'Akun admin dinonaktifkan.' : 'Akun admin diaktifkan.');
      await loadAdmins();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Status admin gagal diubah.');
    } finally {
      setBusyAdminId(null);
    }
  };

  const deleteAdmin = async (admin: AdminItem) => {
    const confirmed = window.confirm(`Hapus akun admin ${admin.name} (${admin.email})?`);

    if (!confirmed) {
      return;
    }

    setBusyAdminId(admin.id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(`/api/admin/accounts/${admin.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error((await readMessage(response)) || 'Akun admin gagal dihapus.');
      }

      if (editingId === admin.id) {
        resetForm();
      }

      setSuccessMessage('Akun admin berhasil dihapus.');
      await loadAdmins();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Akun admin gagal dihapus.');
    } finally {
      setBusyAdminId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="admin-panel relative overflow-hidden rounded-[26px] px-6 py-7 sm:px-8">
        <div
          aria-hidden="true"
          className="absolute -right-14 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-semibold text-emerald-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Khusus super admin
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Kelola Akun Admin
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Super admin tetap berasal dari ENV. Akun pada daftar ini adalah admin biasa yang
              disimpan di NeonDB.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[310px]">
            <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Total admin
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">{admins.length}</p>
            </div>
            <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                Aktif
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-200">{activeAdminCount}</p>
            </div>
          </div>
        </div>
      </section>

      {(errorMessage || successMessage) && (
        <section
          className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
            errorMessage
              ? 'border-red-300/15 bg-red-400/[0.06] text-red-200'
              : 'border-emerald-300/15 bg-emerald-400/[0.06] text-emerald-200'
          }`}
        >
          {errorMessage ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{errorMessage || successMessage}</span>
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="admin-panel rounded-[24px] p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-amber-300/10 bg-amber-400/[0.06] text-amber-200">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-200/60">
                  Super admin ENV
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-white">{superAdminEmail}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Tidak disimpan di tabel admins dan tidak dapat dihapus dari halaman ini.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="admin-panel rounded-[24px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="flex items-center gap-2 font-semibold text-white">
                  {editingId ? (
                    <Pencil className="h-4 w-4 text-sky-300" />
                  ) : (
                    <UserPlus className="h-4 w-4 text-sky-300" />
                  )}
                  {editingId ? 'Edit admin' : 'Tambah admin'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {editingId
                    ? 'Kosongkan password jika tidak ingin menggantinya.'
                    : 'Password minimal 8 karakter.'}
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Batal edit"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">Nama admin</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Nama lengkap"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/10"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">Email login</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    maxLength={190}
                    placeholder="admin@perusahaan.com"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-slate-300">
                  {editingId ? 'Password baru' : 'Password'}
                </span>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    required={!editingId}
                    minLength={form.password || !editingId ? 8 : undefined}
                    maxLength={128}
                    placeholder={editingId ? 'Kosongkan jika tetap' : 'Minimal 8 karakter'}
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-4 focus:ring-sky-400/10"
                  />
                </div>
              </label>

              <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-white/[0.07] bg-black/15 px-4 py-3">
                <span>
                  <span className="block text-sm font-medium text-slate-200">Akun aktif</span>
                  <span className="mt-0.5 block text-xs text-slate-600">
                    Admin dapat login dan menggunakan dashboard.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-sky-500"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,165,233,0.18)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Pencil className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {isSaving ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah admin'}
            </button>
          </form>
        </div>

        <div className="admin-panel overflow-hidden rounded-[24px]">
          <div className="flex flex-col gap-4 border-b border-white/[0.07] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Users className="h-4 w-4 text-sky-300" />
                Admin biasa
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Data tersimpan di tabel admins pada NeonDB.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadAdmins()}
              disabled={isLoading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Muat ulang
            </button>
          </div>

          {isLoading ? (
            <div className="grid min-h-[280px] place-items-center px-6 py-12">
              <div className="text-center">
                <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-sky-300" />
                <p className="mt-3 text-sm text-slate-500">Memuat akun admin...</p>
              </div>
            </div>
          ) : admins.length === 0 ? (
            <div className="grid min-h-[280px] place-items-center px-6 py-12 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03] text-slate-500">
                  <Users className="h-6 w-6" />
                </span>
                <p className="mt-4 text-sm font-medium text-slate-300">Belum ada admin biasa</p>
                <p className="mt-1 text-xs text-slate-600">
                  Tambahkan admin melalui formulir di samping.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {admins.map((admin) => {
                const isBusy = busyAdminId === admin.id;

                return (
                  <article key={admin.id} className="px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <span
                          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${
                            admin.isActive
                              ? 'border-emerald-300/10 bg-emerald-400/[0.06] text-emerald-200'
                              : 'border-slate-300/10 bg-slate-400/[0.05] text-slate-500'
                          }`}
                        >
                          <Users className="h-5 w-5" />
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-sm font-semibold text-white">
                              {admin.name}
                            </h4>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                                admin.isActive
                                  ? 'border-emerald-300/10 bg-emerald-400/[0.06] text-emerald-200'
                                  : 'border-slate-300/10 bg-slate-400/[0.05] text-slate-500'
                              }`}
                            >
                              {admin.isActive ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-sky-200/80">{admin.email}</p>
                          <p className="mt-2 text-[11px] text-slate-600">
                            Login terakhir: {formatDate(admin.lastLoginAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => startEditing(admin)}
                          disabled={isBusy}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-sky-300/10 bg-sky-400/[0.05] text-sky-200 transition hover:bg-sky-400/10 disabled:opacity-50"
                          aria-label={`Edit ${admin.name}`}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => void toggleAdmin(admin)}
                          disabled={isBusy}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-amber-300/10 bg-amber-400/[0.05] text-amber-200 transition hover:bg-amber-400/10 disabled:opacity-50"
                          aria-label={
                            admin.isActive ? `Nonaktifkan ${admin.name}` : `Aktifkan ${admin.name}`
                          }
                          title={admin.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {isBusy ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Power className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => void deleteAdmin(admin)}
                          disabled={isBusy}
                          className="grid h-9 w-9 place-items-center rounded-xl border border-red-300/10 bg-red-400/[0.05] text-red-200 transition hover:bg-red-400/10 disabled:opacity-50"
                          aria-label={`Hapus ${admin.name}`}
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
