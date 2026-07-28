'use client';

import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import Link from 'next/link';

import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary-image';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ThemeToggle from './ThemeToggle';

type SettingRow = {
  key?: string;
  value?: string;
};

const navItems = [
  { href: '/', key: 'header_nav_home', fallback: 'Beranda' },
  { href: '/products', key: 'header_nav_products', fallback: 'Produk' },
  { href: '/services', key: 'header_nav_services', fallback: 'Layanan' },
  { href: '/gallery', key: 'header_nav_gallery', fallback: 'Galeri' },
  { href: '/about', key: 'header_nav_about', fallback: 'Tentang' },
];

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    mass: 0.35,
  });

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        // Header tetap memakai nilai fallback jika database tidak tersedia.
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

  return (
    <>
      <motion.div className="site-scroll-progress" style={{ scaleX: progress }} />
      <header className="site-header">
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className={`site-header-inner ${isScrolled ? 'is-scrolled' : ''}`}
        >
          <Link
            href="/"
            className="brand-mark"
            aria-label={getContent('header_brand_aria_label', 'MP Katalog Teknik')}
          >
            <span
              className={`brand-symbol ${
                getContent('header_brand_logo_url', '') ? 'has-logo' : ''
              }`}
            >
              {getContent('header_brand_logo_url', '') ? (
                // URL logo berasal dari Cloudinary melalui dashboard admin.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getOptimizedCloudinaryUrl(getContent('header_brand_logo_url', ''), {
                    width: 160,
                    quality: 'auto:best',
                  })}
                  alt=""
                  className="brand-logo-image"
                />
              ) : (
                <>
                  <span className="brand-electric-line" />
                  {getContent('header_brand_initials', 'MP')}
                </>
              )}
            </span>
            <span className="brand-copy">
              <strong>{getContent('header_brand_name', 'Katalog Teknik')}</strong>
              <small>{getContent('header_brand_tagline', 'Professional Equipment')}</small>
            </span>
          </Link>

          <nav
            className="site-nav"
            aria-label={getContent('header_nav_aria_label', 'Navigasi utama')}
          >
            {navItems.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`site-nav-link ${active ? 'is-active' : ''}`}
                >
                  {getContent(item.key, item.fallback)}
                  {active && <motion.span layoutId="nav-active" className="site-nav-active" />}
                </Link>
              );
            })}
          </nav>

          <div className="site-header-actions">
            <ThemeToggle compact />
            <Link href="/contact" className="site-button site-button-primary site-header-cta">
              {getContent('header_contact_button', 'Kontak')}
              <ArrowUpRight size={16} />
            </Link>
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setMenuOpen((current) => !current)}
              aria-label={
                menuOpen
                  ? getContent('header_mobile_close_label', 'Tutup menu')
                  : getContent('header_mobile_open_label', 'Buka menu')
              }
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </motion.div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="mobile-menu-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.nav
              initial={{ y: -24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              className="mobile-menu-panel"
            >
              <div className="mobile-menu-heading">
                {getContent('header_mobile_heading', 'Navigasi')}
              </div>
              {navItems.map((item, index) => {
                const active =
                  item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`mobile-menu-link ${active ? 'is-active' : ''}`}
                    >
                      <span>0{index + 1}</span>
                      {getContent(item.key, item.fallback)}
                    </Link>
                  </motion.div>
                );
              })}
              <Link
                href="/contact"
                onClick={() => setMenuOpen(false)}
                className="site-button site-button-primary mt-4 w-full justify-center"
              >
                {getContent('header_mobile_contact_button', 'Hubungi Kami')}{' '}
                <ArrowUpRight size={17} />
              </Link>
              <div className="mt-4 flex items-center justify-between border-t border-(--border) pt-4">
                <span className="text-sm text-(--text-muted)">
                  {getContent('header_theme_label', 'Tampilan')}
                </span>
                <ThemeToggle />
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
