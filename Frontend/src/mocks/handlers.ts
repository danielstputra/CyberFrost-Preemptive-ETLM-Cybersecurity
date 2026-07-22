/**
 * MSW (Mock Service Worker)
 * ==========================
 * Intercepts HTTP requests in the browser for testing.
 *
 * Usage:
 *   1. Start: npx msw init public/ --save
 *   2. Import in tests: import { worker } from '@/mocks/browser';
 *   3. worker.start() before each test
 */

import type { HttpHandler } from 'msw';
import { http, HttpResponse } from 'msw';

// ──────────────────────────────────────
// Mock Handlers
// ──────────────────────────────────────

const authHandlers: HttpHandler[] = [
  // POST /auth/login — valid credentials mock
  http.post('*/api/v1/auth/login', () =>
    HttpResponse.json({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'mock-user-1',
        email: 'admin@cyberfrost.io',
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        tenant: { id: 'tnt-1', name: 'CyberFrost', slug: 'cyberfrost' },
      },
    }),
  ),

  // GET /auth/me — return mock user
  http.get('*/api/v1/auth/me', () =>
    HttpResponse.json({
      user: {
        id: 'mock-user-1',
        email: 'admin@cyberfrost.io',
        name: 'Admin User',
        role: 'SUPER_ADMIN',
        isActive: true,
        tenant: { id: 'tnt-1', name: 'CyberFrost', slug: 'cyberfrost' },
      },
    }),
  ),
];

export const handlers = [...authHandlers];
