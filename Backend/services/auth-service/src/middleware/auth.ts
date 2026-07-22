import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

// ── In-memory access token blacklist ──
const blacklistedJtis = new Set<string>();

export function addToBlacklist(jti: string): void {
  blacklistedJtis.add(jti);
  // Auto-cleanup setelah 24h
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

export interface ServiceAuthPayload {
  userId: string;
  tenantId: string;
  role: ValidRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: ServiceAuthPayload;
    }
  }
}

// ──────────────────────────────────────
// JWT Authentication (for Auth Service's own protected endpoints)
// ──────────────────────────────────────

/**
 * Validates the Bearer JWT on every protected route within this service.
 * This is the **service-level** check, distinct from the gateway-level
 * check. In production both run: gateway checks first, service re-validates.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'UNAUTHORIZED',
      message: 'Missing or invalid Authorization header.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as ServiceAuthPayload & { jti?: string };

    // Cek blacklist — token sudah di-invalidate via logout
    if (decoded.jti && isBlacklisted(decoded.jti)) {
      res.status(401).json({ error: 'TOKEN_BLACKLISTED', message: 'Token has been invalidated. Please login again.' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'JWT has expired. Refresh your token.' });
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'JWT is invalid or malformed.' });
      return;
    }
    res.status(500).json({ error: 'INTERNAL', message: 'Authentication error.' });
  }
};

// ──────────────────────────────────────
// Role-based Access Control
// ──────────────────────────────────────

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: `Required role: [${roles.join(', ')}]. Your role: ${req.user.role}.`,
      });
      return;
    }
    next();
  };
};
