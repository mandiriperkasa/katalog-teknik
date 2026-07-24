/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useMemo, useState } from 'react';

import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary-image';

type PartnerRow = {
  id: string;
  nama: string;
  urlLogo: string;
};

export default function PartnerLogoStrip() {
  const [partners, setPartners] = useState<PartnerRow[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPartners() {
      try {
        const response = await fetch('/api/partners', {
          cache: 'no-store',
          signal: controller.signal,
        });

        if (!response.ok) return;

        const result = await response.json();

        if (Array.isArray(result)) {
          setPartners(result as PartnerRow[]);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Logo mitra gagal dimuat:', error);
      }
    }

    void loadPartners();

    return () => controller.abort();
  }, []);

  const repeatedPartners = useMemo(() => {
    if (partners.length === 0) return [];

    const repeatCount = Math.max(2, Math.ceil(10 / partners.length));

    return Array.from({ length: repeatCount }, (_, repeatIndex) =>
      partners.map((partner) => ({
        ...partner,
        repeatIndex,
      })),
    ).flat();
  }, [partners]);

  if (repeatedPartners.length === 0) return null;

  return (
    <>
      {repeatedPartners.map((partner) => (
        <div
          className="partner-pill flex items-center justify-center overflow-hidden"
          key={`${partner.id}-${partner.repeatIndex}`}
          title={partner.nama}
          style={{
            width: 190,
            height: 80,
            flex: '0 0 190px',
            padding: '14px 22px',
          }}
        >
          <img
            src={getOptimizedCloudinaryUrl(partner.urlLogo, { width: 380 })}
            alt={`Logo ${partner.nama}`}
            className="h-12 w-36 object-contain"
            loading="lazy"
            decoding="async"
          />
        </div>
      ))}
    </>
  );
}
