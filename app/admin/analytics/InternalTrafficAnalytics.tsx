'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

type AnalyticsData = {
  days: number;
  totals: { views: number; visitors: number; todayVisitors: number; pages: number };
  daily: Array<{ date: string; views: number; visitors: number }>;
  topPages: Array<{ name: string; value: number }>;
  referrers: Array<{ name: string; value: number }>;
  devices: Array<{ name: string; value: number }>;
};

const numberFormatter = new Intl.NumberFormat('id-ID');

export default function InternalTrafficAnalytics() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/analytics?days=${days}`, {
        cache: 'no-store',
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Gagal memuat analytics.');
      setData(payload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Gagal memuat analytics.');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void loadData();
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [loadData]);

  const maxDaily = useMemo(
    () => Math.max(1, ...(data?.daily.map((item) => item.views) || [1])),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-400">
            Analytics internal
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">Kunjungan katalog</h1>
          <p className="mt-2 text-sm text-slate-400">
            Data halaman publik tersimpan langsung di NeonDB.
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white"
          >
            <option value={7}>7 hari</option>
            <option value={14}>14 hari</option>
            <option value={30}>30 hari</option>
          </select>
          <button
            type="button"
            onClick={() => void loadData()}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-400"
          >
            Refresh
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-5 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Page views', data?.totals.views ?? 0],
          ['Pengunjung', data?.totals.visitors ?? 0],
          ['Pengunjung hari ini', data?.totals.todayVisitors ?? 0],
          ['Halaman dikunjungi', data?.totals.pages ?? 0],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
          >
            <p className="text-sm text-slate-400">{label}</p>
            <p className="mt-3 text-3xl font-black text-white">
              {loading ? '…' : numberFormatter.format(Number(value))}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
        <h2 className="font-bold text-white">Tren kunjungan</h2>
        <div className="mt-6 flex h-64 items-end gap-2 overflow-x-auto border-b border-white/10 pb-1">
          {(data?.daily || []).map((item) => (
            <div
              key={item.date}
              className="flex min-w-10 flex-1 flex-col items-center justify-end gap-2"
            >
              <span className="text-[10px] text-slate-400">{item.views}</span>
              <div
                title={`${item.date}: ${item.views} views`}
                className="w-full max-w-12 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400"
                style={{ height: `${Math.max(4, (item.views / maxDaily) * 190)}px` }}
              />
              <span className="text-[10px] text-slate-500">{item.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Ranking
          title="Halaman teratas"
          items={data?.topPages || []}
          empty="Belum ada halaman tercatat."
        />
        <Ranking
          title="Sumber kunjungan"
          items={data?.referrers || []}
          empty="Belum ada referrer eksternal."
        />
        <Ranking title="Perangkat" items={data?.devices || []} empty="Belum ada data perangkat." />
      </div>

      <p className="text-xs text-slate-500">
        Statistik mulai terisi setelah pengunjung membuka halaman publik. Halaman admin dan API
        tidak dihitung.
      </p>
    </div>
  );
}

function Ranking({
  title,
  items,
  empty,
}: {
  title: string;
  items: Array<{ name: string; value: number }>;
  empty: string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
      <h2 className="font-bold text-white">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.length === 0 ? <p className="text-sm text-slate-500">{empty}</p> : null}
        {items.map((item) => (
          <div key={item.name}>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="truncate text-slate-300" title={item.name}>
                {item.name}
              </span>
              <span className="font-bold text-white">{numberFormatter.format(item.value)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
