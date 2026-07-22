import rateLimit from 'express-rate-limit';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Global rate limiter — 100 requests per 15 minutes per IP.
 * Disabled in development mode.
 */
export const globalRateLimiter = isDev
  ? rateLimit({ windowMs: 60 * 1000, max: 10000, standardHeaders: false, legacyHeaders: false, validate: { trustProxy: false, xForwardedForHeader: false } })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { trustProxy: false, xForwardedForHeader: false },
      message: { error: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
    });

/**
 * Stricter limiter for auth endpoints (login, register, forgot-password).
 * Disabled in development mode.
 */
export const authRateLimiter = isDev
  ? rateLimit({ windowMs: 60 * 1000, max: 10000, standardHeaders: false, legacyHeaders: false, validate: { trustProxy: false, xForwardedForHeader: false } })
  : rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 30,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { trustProxy: false, xForwardedForHeader: false },
      message: { error: 'RATE_LIMITED', message: 'Too many authentication attempts. Please try again later.' },
    });
