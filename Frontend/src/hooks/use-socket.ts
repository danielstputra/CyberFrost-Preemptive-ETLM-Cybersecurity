'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { useAuthStore } from '@/store/auth-store';

/**
 * Hook to subscribe to Socket.io rooms when the user is authenticated.
 * Call this once in the dashboard layout.
 */
export function useSocketSubscription() {
  const { socket, connected } = useSocket();
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.tenant);

  useEffect(() => {
    if (!socket || !connected || !user) return;

    // Subscribe to tenant alerts
    const tenantId = tenant?.id || user.tenantId;
    socket.emit('subscribe:alerts', tenantId);

    // Subscribe to user notifications
    socket.emit('subscribe:notifications', user.id);

    return () => {
      socket.emit('unsubscribe:alerts', tenantId);
      socket.emit('unsubscribe:notifications', user.id);
    };
  }, [socket, connected, user, tenant]);
}
