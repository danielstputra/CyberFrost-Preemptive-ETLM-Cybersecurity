/**
 * Sentry Configuration (Backend)
 * ==============================
 * Placeholder — aktif hanya jika SENTRY_DSN environment variable diisi.
 *
 * Setup:
 *   1. Buat akun di https://sentry.io
 *   2. Buat project Node.js → copy DSN
 *   3. Set SENTRY_DSN di environment variable Railway/Vercel
 */

import { config } from '../config';

export const sentryConfig = {
  dsn: process.env.SENTRY_DSN || '',
  enabled: !!process.env.SENTRY_DSN,
  environment: config.nodeEnv,
  tracesSampleRate: process.env.SENTRY_DSN ? 0.1 : 0,
};

/**
 * Inisialisasi Sentry di entry point service:
 *
 *   import Sentry from '@sentry/node';
 *   import { sentryConfig } from './config/sentry';
 *
 *   if (sentryConfig.enabled) {
 *     Sentry.init({
 *       dsn: sentryConfig.dsn,
 *       environment: sentryConfig.environment,
 *       tracesSampleRate: sentryConfig.tracesSampleRate,
 *     });
 *   }
 */
