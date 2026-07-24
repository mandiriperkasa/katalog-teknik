'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

const SESSION_KEY = 'katalog_analytics_session';

function createSessionId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const values = crypto.getRandomValues(new Uint32Array(4));
    return Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('-');
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getSessionId() {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const value = createSessionId();
    sessionStorage.setItem(SESSION_KEY, value);
    return value;
  } catch {
    return createSessionId();
  }
}

export default function InternalAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    const payload = JSON.stringify({
      path,
      sessionId: getSessionId(),
      referrer: document.referrer || null,
    });

    const timer = window.setTimeout(() => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          '/api/analytics/track',
          new Blob([payload], { type: 'application/json' }),
        );
        return;
      }

      void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [pathname, searchParams]);

  return null;
}
