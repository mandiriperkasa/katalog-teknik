import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Galeri',
  alternates: {
    canonical: '/gallery',
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
