import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang Kami',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
