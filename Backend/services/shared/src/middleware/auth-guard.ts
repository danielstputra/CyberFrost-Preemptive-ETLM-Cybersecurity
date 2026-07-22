/**
 * Shared Auth Middleware — Defense-in-depth untuk semua Microservices
 * ==================================================================
 * Middleware ini memvalidasi JWT secara independen di setiap service.
 * Ini adalah lapisan keamanan kedua setelah API Gateway.
 *
 * Penggunaan:
 *   import { requireAuth } from '../../shared/src/middleware/auth-guard';
 *   app.use('/api', requireAuth({ secret: config.jwt.secret }));
 *
 * Type role wajib sinkron dengan Prisma UserRole enum.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── Type: Role — Sinkron dengan Prisma UserRole ────────────────────────────

export type ValidRole =
  | 'SUPER_ADMIN'
  | 'SOC_MANAGER'
  | 'SOC_ANALYST'
  | 'TENANT_ADMIN'
  | 'SECURITY_OPERATOR'
  | 'COMPLIANCE_OFFICER'
  | 'EXECUTIVE_VIEWER';

// ─── Type: Auth Payload ─────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: ValidRole;
}

// ─── Type: User info yang akan di-attach ke request ─────────────────────────

export interface RequestUser {
  userId: string;
  tenantId: string;
  role: ValidRole;
}

// ─── Extend Express Request ─────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
      tenantFilter?: Record<string, unknown>;
    }
  }
}

// ─── Options ────────────────────────────────────────────────────────────────

export interface AuthGuardOptions {
  /** JWT secret untuk verifikasi token (wajib) */
  secret: string;
  /** Jika true, request tanpa token akan mendapatkan 401 (default: true) */
  required?: boolean;
  /** Nama header yang berisi token (default: 'authorization') */
  headerName?: string;
}

// ─── Middleware: requireAuth ────────────────────────────────────────────

/**
 * Middleware utama untuk autentikasi di semua service.
 *
 * - required=true  → 401 jika tidak ada token / token invalid
 * - required=false → attach user jika token valid, lanjutkan tanpa error
 */
export function requireAuth(options: AuthGuardOptions) {
  const { secret, required = true, headerName = 'authorization' } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers[headerName] as string | undefined;

    if (!authHeader?.startsWith('Bearer ')) {
      if (!required) {
        next();
        return;
      }
      res.status(401).json({
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthPayload;

      // Validasi role — pastikan role yang dikenal
      const VALID_ROLES: readonly string[] = [
        'SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST',
        'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER',
      ];
      if (!VALID_ROLES.includes(decoded.role)) {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: `Invalid role in token: ${decoded.role}`,
        });
        return;
      }

      req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
      };

      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token has expired. Refresh your session.' });
        return;
      }
      if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid or malformed.' });
        return;
      }
      res.status(500).json({ error: 'INTERNAL', message: 'Authentication error.' });
    }
  };
}

// ─── Middleware: requireRole ─────────────────────────────────────────────────

/**
 * Memeriksa apakah user memiliki salah satu role yang diizinkan.
 * Harus dipanggil SETELAH requireAuth.
 */
export function requireRole(...allowedRoles: ValidRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}.`,
      });
      return;
    }

    next();
  };
}

// ─── Middleware: requireTenantAccess ─────────────────────────────────────────

/**
 * Memastikan user hanya bisa mengakses data tenant-nya sendiri.
 * Internal roles (SUPER_ADMIN, SOC_MANAGER, SOC_ANALYST) bisa cross-tenant.
 */
export function requireTenantAccess() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      // requireAuth seharusnya sudah blocking, tapi defense in depth
      _res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required.' });
      return;
    }

    const INTERNAL_ROLES: ValidRole[] = ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST'];

    if (INTERNAL_ROLES.includes(req.user.role)) {
      // Internal role — bisa akses semua tenant
      req.tenantFilter = {};
      next();
      return;
    }

    // External role — hanya bisa akses tenant sendiri
    if (!req.user.tenantId) {
      _res.status(403).json({ error: 'FORBIDDEN', message: 'No tenant assigned to your account.' });
      return;
    }

    req.tenantFilter = { tenantId: req.user.tenantId };
    next();
  };
}
