'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Hydrates auth state from localStorage on app load.
 * Must be placed inside a client boundary.
 */
export function AuthHydrator() {
  const hydrate = useAuthStore(s => s.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
