import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import { config } from '../config';
import { Prisma } from '@prisma/client';
import { getPrisma } from '../config/database';
import { authenticate, addToBlacklist } from '../middleware/auth';
import { loginLimiter, registerLimiter } from '../middleware/rate-limiter';
import { createLogger, sendZodError, apiError } from '@cyfirma/shared';

const log = createLogger({ serviceName: 'auth-service' });

const prisma = getPrisma();

const router: Router = Router();

// ════════════════════════════════════════════════════════════
//  Zod Validation Schemas
// ════════════════════════════════════════════════════════════

const registerSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  name: z.string().min(1, 'Name is required').max(100),
  tenantName: z.string().min(1, 'Company / tenant name is required').max(100),
  tenantSlug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'refreshToken is required'),
});

// ════════════════════════════════════════════════════════════
//  Helpers
// ════════════════════════════════════════════════════════════

function generateTokens(payload: { userId: string; tenantId: string; role: string }) {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = jwt.sign({ ...payload, jti: accessJti }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as any,
  });
  const refreshToken = jwt.sign({ ...payload, jti: refreshJti }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  return { accessToken, refreshToken, accessJti, refreshJti };
}

/** Hash a jti untuk disimpan di database */
function hashJti(jti: string): string {
  return crypto.createHash('sha256').update(jti).digest('hex');
}

// ════════════════════════════════════════════════════════════
//  POST  /api/v1/auth/register
//  Creates a new Tenant + Admin User in a single transaction.
// ════════════════════════════════════════════════════════════
/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register new tenant with admin user
 *     description: Creates a company (tenant) and an admin user in one transaction. Starts a 14-day trial.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, name, tenantName, tenantSlug]
 *             properties:
 *               email:        { type: string, format: email, example: admin@company.com }
 *               password:     { type: string, minLength: 8, example: "Str0ng!Pass" }
 *               name:         { type: string, example: "Admin User" }
 *               tenantName:   { type: string, example: "PT Security Indonesia" }
 *               tenantSlug:   { type: string, example: "sec-indonesia" }
 *     responses:
 *       201:
 *         description: Registration successful — returns JWT pair + user + tenant
 *       409:
 *         description: Email already registered
 */

router.post('/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    // ── Check duplicate email ──
    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing) {
      res.status(409).json({ error: 'CONFLICT', message: 'Email is already registered.' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, config.bcrypt.saltRounds);

    // ── Transaction: create tenant → subscription → admin user ──
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.tenantName,
          slug: body.tenantSlug,
          subscriptions: {
            create: {
              plan: 'STARTER',
              status: 'TRIALING',
              endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14-day trial
            },
          },
        },
      });

      const user = await tx.user.create({
        data: {
          email: body.email,
          passwordHash,
          name: body.name,
          role: 'TENANT_ADMIN',
          tenantId: tenant.id,
        },
        select: { id: true, email: true, name: true, role: true, tenantId: true, createdAt: true },
      });

      return { tenant, user };
    });

    // ── Auto-login: generate tokens for the new user ──
    const { accessToken, refreshToken, refreshJti } = generateTokens({
      userId: result.user.id,
      tenantId: result.tenant.id,
      role: result.user.role,
    });
    // Simpan refresh token hash untuk reuse detection
    await prisma.user.update({
      where: { id: result.user.id },
      data: { refreshTokenHash: hashJti(refreshJti) },
    });

    res.status(201).json({
      message: 'Registration successful.',
      accessToken, refreshToken,
      user: result.user,
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Register failed');
    res.status(500).json(apiError('INTERNAL', 'Registration failed.'));
  }
});

// ════════════════════════════════════════════════════════════
//  POST  /api/v1/auth/login
//  Authenticates user by email + password, returns JWT pair.
// ════════════════════════════════════════════════════════════
/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login dengan email + password
 *     description: |
 *       Mengembalikan JWT pair. Jika 2FA aktif, response berisi `requires2fa: true` + `userId`.
 *       Lanjutkan ke `POST /auth/2fa/authenticate` untuk menyelesaikan login.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: admin@cyberfrost.io }
 *               password: { type: string, example: "Str0ng!Pass" }
 *     responses:
 *       200:
 *         description: Login sukses — returns accessToken + refreshToken + user
 *       401:
 *         description: Invalid email or password / requires 2FA
 */

router.post('/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: body.email },
      select: {
        id: true, email: true, passwordHash: true, name: true, role: true,
        isActive: true, totpEnabled: true, tenantId: true, lastLoginAt: true,
        tenant: { select: { id: true, name: true, slug: true, isActive: true } },
      },
    });

    // ── Generic error to avoid user enumeration ──
    if (!user || !user.isActive || !user.tenant?.isActive) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid email or password.' });
      return;
    }

    const passwordValid = await bcrypt.compare(body.password, user.passwordHash);
    if (!passwordValid) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid email or password.' });
      return;
    }

    // ── Jika 2FA aktif, return requires2fa — jangan kasih token ──
    if (user.totpEnabled) {
      res.json({
        requires2fa: true,
        userId: user.id,
        message: '2FA code required. Call POST /auth/2fa/authenticate to complete login.',
      });
      return;
    }

    // ── Update last login timestamp ──
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // ── Generate tokens with rotation support ──
    const { accessToken, refreshToken, refreshJti } = generateTokens({
      userId: user.id,
      tenantId: user.tenantId!,
      role: user.role,
    });
    // Simpan refresh token hash untuk reuse detection
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashJti(refreshJti) },
    });

    res.json({
      accessToken, refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        lastLoginAt: user.lastLoginAt,
        tenant: user.tenant ? {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
        } : null,
      },
    });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Login failed');
    res.status(500).json(apiError('INTERNAL', 'Login failed.'));
  }
});

// ════════════════════════════════════════════════════════════
//  POST  /api/v1/auth/refresh
//  Exchanges a valid refresh token for a new access + refresh pair.
// ════════════════════════════════════════════════════════════
/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     description: Menukar refresh token yang valid dengan access token + refresh token baru (token rotation).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string, example: "eyJhbGciOiJIUzI1NiIs..." }
 *     responses:
 *       200:
 *         description: Token baru — accessToken + refreshToken
 *       401:
 *         description: Token expired / invalid / reused (session di-invalidate)
 */

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);

    const decoded = jwt.verify(refreshToken, config.jwt.secret) as {
      userId: string;
      tenantId: string;
      role: string;
      jti?: string;
    };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true, refreshTokenHash: true, tenant: { select: { isActive: true } } },
    });

    if (!user || !user.isActive || !user.tenant?.isActive) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'User or tenant is inactive.' });
      return;
    }

    // ── Refresh Token Rotation: cek reuse detection ──
    if (!decoded.jti) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token format invalid (missing jti).' });
      return;
    }

    const providedHash = hashJti(decoded.jti);

    if (!user.refreshTokenHash) {
      // Tidak ada stored hash → token sudah dirotasi atau session di-invalidate
      res.status(401).json({ error: 'TOKEN_REUSED', message: 'Session expired or token already rotated. Please login again.' });
      return;
    }

    if (user.refreshTokenHash !== providedHash) {
      // Hash mismatch → kemungkinan token curian sudah dipakai orang lain
      // Invalidate ALL sessions dengan clear stored hash
      await prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      console.warn(`[Auth] Refresh token reuse detected for user ${user.id}. All sessions invalidated.`);
      res.status(401).json({ error: 'TOKEN_REUSED', message: 'Refresh token has been reused. All sessions invalidated. Please login again.' });
      return;
    }

    // ── Hash match → issue new tokens, update stored hash ──
    const { accessToken, refreshToken: newRefreshToken, refreshJti } = generateTokens({
      userId: user.id,
      tenantId: decoded.tenantId,
      role: decoded.role,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: hashJti(refreshJti) },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    if (sendZodError(res, err)) return;
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json(apiError('TOKEN_EXPIRED', 'Refresh token has expired. Login again.'));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json(apiError('INVALID_TOKEN', 'Refresh token is invalid.'));
      return;
    }
    log.error({ err }, 'Refresh failed');
    res.status(500).json(apiError('INTERNAL', 'Token refresh failed.'));
  }
});

// ════════════════════════════════════════════════════════════
//  GET  /api/v1/auth/me
//  Returns the currently authenticated user's profile.
// ════════════════════════════════════════════════════════════

router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'User not found.' });
      return;
    }

    res.json({ user });
  } catch (err) {
    log.error({ err }, 'Fetch profile failed');
    res.status(500).json(apiError('INTERNAL', 'Failed to fetch profile.'));
  }
});

// ════════════════════════════════════════════════════════════
//  POST  /api/v1/auth/logout
//  Invalidates the current session by clearing the refresh token hash.
// ════════════════════════════════════════════════════════════

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  try {
    // ── Blacklist access token ──
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.decode(token) as { jti?: string } | null;
        if (decoded?.jti) {
          addToBlacklist(decoded.jti);
        }
      } catch { /* skip — blacklist failure is non-critical */ }
    }

    // ── Clear refresh token hash ──
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { refreshTokenHash: null },
    });

    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    log.error({ err }, 'Logout failed');
    res.status(500).json(apiError('INTERNAL', 'Logout failed.'));
  }
});

// ════════════════════════════════════════════════════════════
//  PUT  /api/v1/auth/me
//  Updates user profile (name, email, avatar)
// ════════════════════════════════════════════════════════════

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Valid email is required").optional(),
  avatarUrl: z.string().max(500000).optional(),
});

router.put("/me", authenticate, async (req: Request, res: Response) => {
  try {
    const body = updateProfileSchema.parse(req.body);
    const userId = req.user!.userId;

    // Check email uniqueness if being changed
    if (body.email) {
      const existing = await getPrisma().user.findUnique({ where: { email: body.email } });
      if (existing && existing.id !== userId) {
        res.status(409).json({ error: "CONFLICT", message: "Email is already in use." });
        return;
      }
    }

    const updated = await getPrisma().user.update({
      where: { id: userId },
      data: { ...body, updatedAt: new Date() },
      select: {
        id: true, email: true, name: true, role: true, isActive: true,
        lastLoginAt: true, createdAt: true, updatedAt: true,
        tenant: { select: { id: true, name: true, slug: true, logoUrl: true } },
      },
    });

    res.json({ user: updated });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Update profile failed');
    res.status(500).json(apiError('INTERNAL', 'Failed to update profile.'));
  }
});

// ════════════════════════════════════════════════════════════
//  POST  /api/v1/auth/change-password
//  Changes password with validation (min 8 chars, uppercase, lowercase, number, special)
// ════════════════════════════════════════════════════════════

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
});

router.post("/change-password", authenticate, async (req: Request, res: Response) => {
  try {
    const body = changePasswordSchema.parse(req.body);
    const userId = req.user!.userId;

    const user = await getPrisma().user.findUnique({ where: { id: userId } });
    if (!user) { res.status(404).json({ error: "NOT_FOUND", message: "User not found." }); return; }

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "UNAUTHORIZED", message: "Current password is incorrect." }); return; }

    const passwordHash = await bcrypt.hash(body.newPassword, config.bcrypt.saltRounds);
    await getPrisma().user.update({ where: { id: userId }, data: { passwordHash } });

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    if (sendZodError(res, err)) return;
    log.error({ err }, 'Change password failed');
    res.status(500).json(apiError('INTERNAL', 'Failed to change password.'));
  }
});

export default router;
