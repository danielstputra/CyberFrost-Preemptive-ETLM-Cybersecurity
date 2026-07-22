/**
 * Sentry Configuration
 * =====================
 * Placeholder — aktif hanya jika SENTRY_DSN environment variable diisi.
 *
 * Setup:
 *   1. Buat akun di https://sentry.io
 *   2. Buat project → copy DSN
 *   3. Set SENTRY_DSN di .env.local / Vercel Environment Variables
 */

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';

export const sentryConfig = {
  dsn: sentryDsn,
  enabled: !!sentryDsn,
  environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  tracesSampleRate: sentryDsn ? 0.2 : 0, // 20% sampling di prod
};

/**
 * Log a warning jika Sentry belum dikonfigurasi (hanya di dev).
 */
if (typeof window !== 'undefined' && !sentryDsn && process.env.NODE_ENV === 'development') {
  console.warn(
    '[Sentry] DSN not configured. Set NEXT_PUBLIC_SENTRY_DSN in .env.local to enable error tracking.',
  );
}
