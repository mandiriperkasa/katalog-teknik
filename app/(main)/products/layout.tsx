import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Produk',
  alternates: {
    canonical: '/products',
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
