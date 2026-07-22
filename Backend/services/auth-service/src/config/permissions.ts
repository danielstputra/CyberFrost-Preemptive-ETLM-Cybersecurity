import { Request, Response, NextFunction } from 'express';

// ── Permission Definitions ──
export enum Permission {
  MANAGE_TENANTS = 'MANAGE_TENANTS',
  VIEW_TENANTS = 'VIEW_TENANTS',
  MANAGE_USERS = 'MANAGE_USERS',
  REVIEW_TAKEDOWN = 'REVIEW_TAKEDOWN',
  APPROVE_TAKEDOWN = 'APPROVE_TAKEDOWN',
  VIEW_TAKEDOWN = 'VIEW_TAKEDOWN',
  VIEW_THREATS = 'VIEW_THREATS',
  REQUEST_SCAN = 'REQUEST_SCAN',
  EXPORT_REPORTS = 'EXPORT_REPORTS',
  VIEW_REPORTS = 'VIEW_REPORTS',
}

// ── Role → Permission Mapping ──
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.values(Permission),
  SOC_MANAGER: [Permission.MANAGE_TENANTS, Permission.VIEW_TENANTS, Permission.MANAGE_USERS, Permission.REVIEW_TAKEDOWN, Permission.APPROVE_TAKEDOWN, Permission.VIEW_TAKEDOWN, Permission.VIEW_THREATS, Permission.REQUEST_SCAN, Permission.EXPORT_REPORTS],
  SOC_ANALYST: [Permission.REVIEW_TAKEDOWN, Permission.APPROVE_TAKEDOWN, Permission.VIEW_TAKEDOWN, Permission.VIEW_THREATS, Permission.REQUEST_SCAN],
  TENANT_ADMIN: [Permission.MANAGE_USERS, Permission.VIEW_TAKEDOWN, Permission.VIEW_THREATS, Permission.REQUEST_SCAN, Permission.APPROVE_TAKEDOWN, Permission.EXPORT_REPORTS],
  SECURITY_OPERATOR: [Permission.VIEW_TAKEDOWN, Permission.VIEW_THREATS, Permission.REQUEST_SCAN],
  COMPLIANCE_OFFICER: [Permission.VIEW_TAKEDOWN, Permission.VIEW_THREATS, Permission.VIEW_REPORTS, Permission.EXPORT_REPORTS],
  EXECUTIVE_VIEWER: [Permission.VIEW_TAKEDOWN, Permission.VIEW_THREATS, Permission.VIEW_REPORTS],
};

export function hasPermission(role: string, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

// ── Middleware: Require specific permission ──
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;
    if (!userRole) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
      return;
    }
    const hasAny = permissions.some(p => hasPermission(userRole, p));
    if (!hasAny) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Insufficient permissions' });
      return;
    }
    next();
  };
}

// ── Middleware: Tenant data isolation ──
export function requireTenantAccess() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const userTenantId = user?.tenantId;
    const userType = user?.userType || (user?.role === 'SUPER_ADMIN' || user?.role === 'SOC_ANALYST' || user?.role === 'SOC_MANAGER' ? 'INTERNAL' : 'EXTERNAL');

    // Internal users can access all data
    if (userType === 'INTERNAL' || ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST'].includes(user?.role)) {
      (req as any).tenantFilter = {};
      next();
      return;
    }

    // External users can only access their tenant's data
    if (!userTenantId) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'No tenant assigned' });
      return;
    }
    (req as any).tenantFilter = { tenantId: userTenantId };
    next();
  };
}
