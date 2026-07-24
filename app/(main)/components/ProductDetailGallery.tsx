'use client';

import { ChevronLeft, ChevronRight, Wrench } from 'lucide-react';
import Image from 'next/image';
import { useMemo, useState } from 'react';

import { getOptimizedCloudinaryUrl, isCloudinaryUrl } from '@/lib/cloudinary-image';

type ProductDetailGalleryProps = {
  name: string;
  imageUrl?: string | null;
  imageUrl2?: string | null;
  imageUrl3?: string | null;
  imageUrl4?: string | null;
};

export default function ProductDetailGallery({
  name,
  imageUrl,
  imageUrl2,
  imageUrl3,
  imageUrl4,
}: ProductDetailGalleryProps) {
  const images = useMemo(
    () =>
      Array.from(
        new Set(
          [imageUrl, imageUrl2, imageUrl3, imageUrl4]
            .map((item) => item?.trim())
            .filter((item): item is string => Boolean(item)),
        ),
      ),
    [imageUrl, imageUrl2, imageUrl3, imageUrl4],
  );

  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--surface-soft)] text-[var(--text-muted)]">
        <div className="text-center">
          <Wrench className="mx-auto" size={54} strokeWidth={1.2} />
          <p className="mt-3 text-sm">Foto produk belum tersedia</p>
        </div>
      </div>
    );
  }

  const safeIndex = Math.min(activeIndex, images.length - 1);
  const activeImage = images[safeIndex];

  const showPrevious = () => {
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  };

  const showNext = () => {
    setActiveIndex((current) => (current + 1) % images.length);
  };

  return (
    <div className="product-detail-gallery" aria-label={`Galeri foto ${name}`}>
      <div className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-[var(--border-color)] bg-[var(--surface-soft)]">
        <Image
          key={activeImage}
          src={getOptimizedCloudinaryUrl(activeImage, { width: 1200 })}
          alt={`${name} - foto ${safeIndex + 1}`}
          fill
          priority
          unoptimized={isCloudinaryUrl(activeImage)}
          sizes="(max-width: 900px) 100vw, 50vw"
          className="object-contain p-4 transition duration-300 group-hover:scale-[1.02]"
        />

        <span className="absolute left-4 top-4 rounded-full border border-black/5 bg-white/90 px-3 py-1 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
          {safeIndex + 1}/{images.length}
        </span>

        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/70"
              aria-label="Foto sebelumnya"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/40 bg-black/55 text-white shadow-lg backdrop-blur transition hover:scale-105 hover:bg-black/70"
              aria-label="Foto berikutnya"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-4 gap-2" role="tablist" aria-label="Pilih foto produk">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-[var(--surface-soft)] transition ${
                safeIndex === index
                  ? 'border-sky-500 shadow-[0_0_0_3px_rgba(14,165,233,0.12)]'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              role="tab"
              aria-selected={safeIndex === index}
              aria-label={`Tampilkan foto ${index + 1}`}
            >
              <Image
                src={getOptimizedCloudinaryUrl(image, { width: 240 })}
                alt=""
                fill
                unoptimized={isCloudinaryUrl(image)}
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
