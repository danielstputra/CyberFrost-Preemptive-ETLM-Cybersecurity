'use client';

import { ReactNode } from 'react';
import { useAuthStore } from '@/store/auth-store';
import type { UserRoleType } from '@/types';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRoleType[];
  fallback?: ReactNode;
}

const ROLE_HIERARCHY: Record<UserRoleType, number> = {
  SUPER_ADMIN: 100,
  SOC_MANAGER: 80,
  SOC_ANALYST: 60,
  TENANT_ADMIN: 70,
  SECURITY_OPERATOR: 40,
  COMPLIANCE_OFFICER: 50,
  EXECUTIVE_VIEWER: 30,
};

export function hasMinRole(userRole: UserRoleType | undefined, minRole: UserRoleType): boolean {
  if (!userRole) return false;
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minRole] || 0);
}

export function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const userRole = useAuthStore(s => s.user?.role);

  if (!userRole || !allowedRoles.includes(userRole as UserRoleType)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

export function useRoleCheck() {
  const userRole = useAuthStore(s => s.user?.role) as UserRoleType | undefined;

  return {
    role: userRole,
    isInternal: userRole ? ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST'].includes(userRole) : false,
    isExternal: userRole ? ['TENANT_ADMIN', 'SECURITY_OPERATOR', 'COMPLIANCE_OFFICER', 'EXECUTIVE_VIEWER'].includes(userRole) : false,
    hasRole: (roles: UserRoleType[]) => !!userRole && roles.includes(userRole),
    hasMinRole: (minRole: UserRoleType) => hasMinRole(userRole, minRole),
  };
}

// Role display labels
export const ROLE_LABELS: Record<UserRoleType, string> = {
  SUPER_ADMIN: 'Super Admin',
  SOC_MANAGER: 'SOC Manager',
  SOC_ANALYST: 'SOC Analyst',
  TENANT_ADMIN: 'Tenant Admin',
  SECURITY_OPERATOR: 'Security Operator',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  EXECUTIVE_VIEWER: 'Executive Viewer',
};
