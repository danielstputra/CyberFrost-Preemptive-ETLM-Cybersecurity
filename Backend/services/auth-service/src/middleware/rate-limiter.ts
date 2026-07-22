/**
 * Rate Limiter Middleware — Mencegah brute-force dan abuse
 * =========================================================
 */
import rateLimit from 'express-rate-limit';

// Login: max 5 attempts per 15 menit per IP
function createLimiter(opts: { windowMs: number; max: number; message: { error: string; message: string } }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { trustProxy: false, xForwardedForHeader: false },
    message: opts.message,
  });
}

export const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many login attempts. Try again after 15 minutes.' },
});

export const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Too many registration attempts. Try again later.' },
});

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded.' },
});
