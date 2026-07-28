import './admin.css';

import type { Metadata } from 'next';

import { requireSuperAdmin } from '@/lib/require-super-admin';

import AdminShell from './components/admin/AdminShell';

export const metadata: Metadata = {
  title: 'Admin | Katalog Teknik',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isSuperAdmin = await requireSuperAdmin();

  return <AdminShell isSuperAdmin={isSuperAdmin}>{children}</AdminShell>;
}
