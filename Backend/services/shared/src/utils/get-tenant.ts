import type { Request } from 'express';

/** Type-safe helper untuk extract tenantId, userId, dan role dari request */
export function getTenant(req: Request) {
  const user = (req as any).user;
  return {
    tenantId: (user?.tenantId as string) || 'default',
    userId: (user?.userId as string) || 'anonymous',
    role: (user?.role as string) || '',
    isInternal: ['SUPER_ADMIN', 'SOC_MANAGER', 'SOC_ANALYST'].includes(user?.role),
  };
}
