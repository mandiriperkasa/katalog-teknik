'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SiteTheme = 'dark' | 'light';

type ThemeContextValue = {
  theme: SiteTheme;
  toggleTheme: () => void;
  setTheme: (theme: SiteTheme) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'mp-site-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<SiteTheme>('light');

  useEffect(() => {
    let saved: SiteTheme | null = null;

    try {
      saved = window.localStorage.getItem(STORAGE_KEY) as SiteTheme | null;
    } catch {
      // Gunakan tema terang saat penyimpanan browser tidak tersedia.
    }

    const nextTheme = saved === 'dark' || saved === 'light' ? saved : 'light';

    document.documentElement.dataset.siteTheme = nextTheme;
    const frame = window.requestAnimationFrame(() => setThemeState(nextTheme));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const setTheme = (nextTheme: SiteTheme) => {
    document.documentElement.dataset.siteTheme = nextTheme;
    setThemeState(nextTheme);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Tema tetap berubah meskipun penyimpanan browser tidak tersedia.
    }
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <div className="site-shell">{children}</div>
    </ThemeContext.Provider>
  );
}

export function useSiteTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useSiteTheme harus digunakan di dalam ThemeProvider.');
  }

  return context;
}
