/**
 * Auth / RBAC Middleware — Action Mitigation Service
 * ===================================================
 * Defense-in-depth: validasi JWT independen di service level.
 * Wajib sync dengan Prisma UserRole enum.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type ValidRole =
  | 'SUPER_ADMIN'
  | 'SOC_MANAGER'
  | 'SOC_ANALYST'
  | 'TENANT_ADMIN'
  | 'SECURITY_OPERATOR'
  | 'COMPLIANCE_OFFICER'
  | 'EXECUTIVE_VIEWER';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        tenantId: string;
        role: ValidRole;
      };
      tenantFilter?: Record<string, unknown>;
    }
  }
}

/** Middleware: Wajib autentikasi — 401 jika tidak ada token valid */
export function requireAuth(secret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header.' });
      return;
    }

    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], secret, { algorithms: ['HS256'] }) as any;
      const role = decoded.role as ValidRole;

      const VALID_ROLES: readonly string[] = [
        'SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST',
        'TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER',
      ];
      if (!VALID_ROLES.includes(role)) {
        res.status(403).json({ error: 'FORBIDDEN', message: `Unknown role: ${role}` });
        return;
      }

      req.user = { userId: decoded.userId, tenantId: decoded.tenantId, role };
      req.tenantFilter = {};
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Token has expired.' });
        return;
      }
      res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token is invalid.' });
    }
  };
}

/** Set tenantFilter based on user role — tenant isolation */
export function applyTenantFilter(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) { next(); return; }

  const INTERNAL_ROLES: ValidRole[] = ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST'];
  if (INTERNAL_ROLES.includes(req.user.role)) {
    req.tenantFilter = {}; // cross-tenant access
  } else {
    req.tenantFilter = { tenantId: req.user.tenantId };
  }
  next();
}
