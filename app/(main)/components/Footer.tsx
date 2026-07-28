'use client';

import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type SettingRow = {
  key?: string;
  value?: string;
};

type SocialKind = 'tiktok' | 'facebook' | 'youtube' | 'instagram' | 'tokopedia' | 'tiktok-shop';

function SocialGlyph({ kind }: { kind: SocialKind }) {
  if (kind === 'facebook') {
    return (
      <svg
        className="footer-social-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M14 21v-8h3.2l.6-4H14V7.4c0-1.2.7-1.8 2.1-1.8H18V2.3c-.8-.2-1.8-.3-3-.3-3.2 0-5 2-5 5.4V9H7v4h3v8" />
      </svg>
    );
  }

  if (kind === 'youtube') {
    return (
      <svg
        className="footer-social-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="m10 9 5 3-5 3V9Z" />
      </svg>
    );
  }

  if (kind === 'instagram') {
    return (
      <svg
        className="footer-social-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  if (kind === 'tokopedia') {
    return (
      <svg
        className="footer-social-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3.5 7.5h17l-1.3 13h-14l-1.7-13Z" />
        <path d="M8 7.5a4 4 0 0 1 8 0" />
        <circle cx="9.5" cy="13" r="1.7" />
        <circle cx="14.5" cy="13" r="1.7" />
        <path d="m10.5 16.5 1.5 1 1.5-1" />
      </svg>
    );
  }

  if (kind === 'tiktok-shop') {
    return (
      <svg
        className="footer-social-glyph"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3.5 8h17l-1.3 12.5h-14L3.5 8Z" />
        <path d="M8 8a4 4 0 0 1 8 0" />
        <path d="M13 11v5a2.2 2.2 0 1 1-2-2.2" />
        <path d="M13 11c.5 1.2 1.4 2 2.8 2.2" />
      </svg>
    );
  }

  return (
    <svg
      className="footer-social-glyph"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 3v11.5a4.5 4.5 0 1 1-4-4.5" />
      <path d="M14 5c1.1 2.2 2.8 3.4 5 3.5" />
    </svg>
  );
}

const quickLinks = [
  { href: '/', key: 'footer_link_home', fallback: 'Beranda' },
  { href: '/products', key: 'footer_link_products', fallback: 'Produk' },
  { href: '/services', key: 'footer_link_services', fallback: 'Layanan' },
  { href: '/gallery', key: 'footer_link_gallery', fallback: 'Galeri' },
  { href: '/contact', key: 'footer_link_contact', fallback: 'Kontak' },
];

export default function Footer() {
  const [settings, setSettings] = useState<SettingRow[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadSettings = async () => {
      try {
        const response = await fetch('/api/settings', {
          method: 'GET',
          cache: 'no-store',
        });

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        if (!cancelled && Array.isArray(result)) {
          setSettings(result);
        }
      } catch {
        // Footer tetap memakai nilai fallback jika database tidak tersedia.
      }
    };

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const settingsMap = useMemo(
    () =>
      Object.fromEntries(
        settings
          .filter(
            (item): item is Required<SettingRow> =>
              typeof item.key === 'string' && item.key.trim().length > 0,
          )
          .map((item) => [item.key, item.value ?? '']),
      ),
    [settings],
  );

  const getContent = (key: string, fallback: string) => {
    return settingsMap[key]?.trim() || fallback;
  };

  const socialLinks = [
    { label: 'TikTok', href: settingsMap.link_tiktok, kind: 'tiktok' as const },
    { label: 'Facebook', href: settingsMap.link_fb, kind: 'facebook' as const },
    { label: 'YouTube', href: settingsMap.link_youtube, kind: 'youtube' as const },
    { label: 'Instagram', href: settingsMap.link_instagram, kind: 'instagram' as const },
    { label: 'Tokopedia', href: settingsMap.link_tokopedia, kind: 'tokopedia' as const },
    {
      label: 'TikTok Shop',
      href: settingsMap.link_tiktok_shop,
      kind: 'tiktok-shop' as const,
    },
  ].filter((item) => item.href && item.href !== '#');

  const phone = settingsMap.footer_phone || '0856 4010 0044';
  const email = settingsMap.footer_email || 'anang.widhi.p@gmail.com';
  const address =
    settingsMap.footer_address ||
    'Jl. Mayor Oking Citeureup, Puspanegara, Kabupaten Bogor, Jawa Barat.';

  return (
    <footer className="site-footer">
      <div className="section-shell">
        <div className="footer-cta" data-aos="zoom-in">
          <div>
            <div className="site-eyebrow">
              {getContent('footer_cta_eyebrow', 'Mari berkolaborasi')}
            </div>
            <h2>{getContent('footer_cta_title', 'Butuh solusi peralatan yang tepat?')}</h2>
            <p>
              {getContent(
                'footer_cta_description',
                'Diskusikan kebutuhan workshop dan operasional Anda bersama tim kami.',
              )}
            </p>
          </div>

          <Link href="/contact" className="site-button site-button-primary">
            {getContent('footer_cta_button', 'Mulai Konsultasi')} <ArrowUpRight size={18} />
          </Link>
        </div>

        <div className="footer-grid">
          <div className="footer-brand" data-aos="fade-up">
            <Link href="/" className="brand-mark">
              <span className="brand-symbol">{getContent('footer_brand_initials', 'MP')}</span>
              <span className="brand-copy">
                <strong>{getContent('footer_brand_name', 'Katalog Teknik')}</strong>
                <small>{getContent('footer_brand_tagline', 'Professional Equipment')}</small>
              </span>
            </Link>

            <p>
              {getContent(
                'footer_brand_description',
                'Mitra penyedia peralatan otomotif, hidraulis, dan perlengkapan teknik dengan fokus pada kualitas, presisi, dan layanan purna jual.',
              )}
            </p>

            <div className="footer-socials">
              {socialLinks.map(({ label, href, kind }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="footer-social-link"
                >
                  <SocialGlyph kind={kind} />
                </a>
              ))}
            </div>
          </div>

          <div data-aos="fade-up" data-aos-delay="80">
            <h3 className="footer-title">{getContent('footer_navigation_title', 'Jelajahi')}</h3>

            <ul className="footer-links">
              {quickLinks.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{getContent(item.key, item.fallback)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div data-aos="fade-up" data-aos-delay="160">
            <h3 className="footer-title">{getContent('footer_contact_title', 'Hubungi')}</h3>

            <ul className="footer-contact-list">
              <li>
                <Phone size={17} />
                <a href={`tel:${phone.replace(/[^+\d]/g, '')}`}>{phone}</a>
              </li>

              <li>
                <Mail size={17} />
                <a href={`mailto:${email}`}>{email}</a>
              </li>

              <li>
                <MapPin size={18} />
                <span>{address}</span>
              </li>
            </ul>
          </div>

          <div data-aos="fade-up" data-aos-delay="240">
            <h3 className="footer-title">{getContent('footer_hours_title', 'Jam Operasional')}</h3>

            <div className="footer-hours">
              <p>
                <span>{getContent('footer_hours_weekday_label', 'Senin – Jumat')}</span>
                <strong>{getContent('footer_hours_weekday_value', '09.00 – 16.30')}</strong>
              </p>

              <p>
                <span>{getContent('footer_hours_saturday_label', 'Sabtu')}</span>
                <strong>{getContent('footer_hours_saturday_value', '09.00 – 15.00')}</strong>
              </p>

              <p>
                <span>{getContent('footer_hours_sunday_label', 'Minggu')}</span>
                <strong className="footer-closed">
                  {getContent('footer_hours_sunday_value', 'Libur')}
                </strong>
              </p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()}{' '}
            {getContent('footer_copyright', 'MP Katalog Teknik. All rights reserved.')}
          </p>

          <div>
            <span>{getContent('footer_bottom_tagline', 'Built for precision')}</span>
            <span className="footer-pulse" />
          </div>
        </div>
      </div>
    </footer>
  );
}
