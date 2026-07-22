import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// ── In-memory access token blacklist ──
// NOTE: Gunakan Redis untuk production agar persist antar instance
const blacklistedJtis = new Set<string>();

export function addToBlacklist(jti: string): void {
  blacklistedJtis.add(jti);
  // Auto-cleanup setelah expired (default 24h)
  setTimeout(() => blacklistedJtis.delete(jti), 24 * 60 * 60 * 1000);
}

export function isBlacklisted(jti: string): boolean {
  return blacklistedJtis.has(jti);
}

// ──────────────────────────────────────
// Types — Wajib sinkron dengan Prisma UserRole enum
// ──────────────────────────────────────

export type ValidRole =
  | 'SUPER_ADMIN'
  | 'SOC_MANAGER'
  | 'SOC_ANALYST'
  | 'TENANT_ADMIN'
  | 'SECURITY_OPERATOR'
  | 'COMPLIANCE_OFFICER'
  | 'EXECUTIVE_VIEWER';

export interface AuthPayload {
  userId: string;
  tenantId: string;
  role: ValidRole;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ──────────────────────────────────────
// JWT Authentication Middleware
// ──────────────────────────────────────

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as AuthPayload & { jti?: string };

    // Cek blacklist — token sudah di-invalidate via logout
    if (decoded.jti && isBlacklisted(decoded.jti)) {
      res.status(401).json({ error: 'TOKEN_BLACKLISTED', message: 'Token has been invalidated. Please login again.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'JWT token has expired' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'JWT token is invalid' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL', message: 'Authentication error' });
  }
};

// ──────────────────────────────────────
// Role-based Access Control (RBAC)
// ──────────────────────────────────────

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Requires one of: [${roles.join(', ')}]. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
};

// ──────────────────────────────────────
// Optional Auth — attach user if token present, don't block
// ──────────────────────────────────────

export const optionalAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], config.jwt.secret) as AuthPayload;
    req.user = decoded;
  } catch {
    // silently ignore — user stays undefined
  }

  next();
};
