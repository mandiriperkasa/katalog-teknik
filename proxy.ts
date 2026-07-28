import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from './lib/admin-auth';

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientAddress(request: NextRequest) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

function consumeRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return null;
  }

  if (current.count >= limit) {
    return Math.max(1, Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/') && request.method !== 'GET') {
    const clientAddress = getClientAddress(request);
    const isLogin = pathname === '/api/admin/login';
    const isAnalytics = pathname === '/api/analytics/track';
    const retryAfter = consumeRateLimit(
      `${clientAddress}:${isLogin ? 'login' : isAnalytics ? 'analytics' : 'write'}`,
      isLogin ? 8 : isAnalytics ? 120 : 90,
      isLogin ? 15 * 60 * 1000 : 60 * 1000,
    );

    if (retryAfter) {
      return NextResponse.json(
        {
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'Cache-Control': 'no-store',
          },
        },
      );
    }
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const authSecret = process.env.ADMIN_AUTH_SECRET;

  const sessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  const session = authSecret && sessionToken ? verifyAdminSession(sessionToken, authSecret) : null;

  if (pathname === '/admin-login') {
    if (session) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL('/admin-login', request.url);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin-login', '/api/:path*'],
};
