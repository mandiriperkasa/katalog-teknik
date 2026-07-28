import type { Metadata } from 'next';
import { Suspense } from 'react';

import './globals.css';

import { getDatabase } from '../../lib/database/neon';
import AOSProvider from './components/AOSProvider';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Footer from './components/Footer';
import Header from './components/Header';
import HiddenAdminAccess from './components/HiddenAdminAccess';
import InternalAnalyticsTracker from './components/InternalAnalyticsTracker';
import SiteBackground from './components/SiteBackground';
import { ThemeProvider } from './components/ThemeProvider';

type SettingRow = {
  key: string;
  value: string | null;
};

const metadataFallback = {
  siteName: 'Mandiri Perkakas',
  description: 'Katalog peralatan otomotif, hidraulis, dan perlengkapan teknik profesional.',
};
const SITE_URL = 'https://www.mandiriperkakas.com';

export const revalidate = 60;

async function getMetadataSettings() {
  try {
    const sql = getDatabase();

    const rows = (await sql`
      SELECT
        key,
        value
      FROM settings
      WHERE key IN (
        'general_site_name',
        'general_meta_description'
      )
    `) as SettingRow[];

    return Object.fromEntries(rows.map((item) => [item.key, item.value ?? ''])) as Record<
      string,
      string
    >;
  } catch (error) {
    console.error('Gagal memuat metadata umum dari NeonDB:', error);
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getMetadataSettings();

  const configuredSiteName = settings.general_site_name?.trim();
  const siteName =
    !configuredSiteName || configuredSiteName === 'MP Katalog Teknik'
      ? metadataFallback.siteName
      : configuredSiteName;
  const description = settings.general_meta_description?.trim() || metadataFallback.description;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      url: '/',
      siteName,
      title: siteName,
      description,
    },
  };
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AOSProvider />
      <SiteBackground />
      <Header />
      <HiddenAdminAccess />
      <Suspense fallback={null}>
        <InternalAnalyticsTracker />
      </Suspense>
      <div className="site-content">{children}</div>

      <Footer />
      <FloatingWhatsApp />
    </ThemeProvider>
  );
}

