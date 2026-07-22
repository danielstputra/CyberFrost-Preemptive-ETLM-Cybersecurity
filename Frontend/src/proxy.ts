/**
 * Next.js Proxy — Route Protection (formerly Middleware)
 * =====================================================
 * Melindungi halaman dashboard dari akses tanpa autentikasi.
 * Berjalan di Edge sebelum request mencapai halaman.
 *
 * Catatan: ini adalah server-side protection layer pertama.
 * Client-side AuthHydrator + RoleGuard sebagai lapisan kedua.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/',
  '/favicon.ico',
];

const DASHBOARD_ROUTE_PREFIX = '/dashboard';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith('/_next') || pathname.startsWith('/api'))) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (pathname.startsWith(DASHBOARD_ROUTE_PREFIX)) {
    const token = request.cookies.get('accessToken')?.value
      || request.headers.get('authorization')?.replace('Bearer ', '')
      || '';

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verifikasi token format (minimal ada 2 dots — JWT standard)
    // Full verification dilakukan oleh backend
    const parts = token.split('.');
    if (parts.length !== 3) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
