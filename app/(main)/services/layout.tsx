import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Layanan',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
