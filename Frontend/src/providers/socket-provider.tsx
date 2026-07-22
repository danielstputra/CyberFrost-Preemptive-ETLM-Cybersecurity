'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_GATEWAY_URL } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import type { Notification } from '@/types';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  lastNotification: Notification | null;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  lastNotification: null,
});

export const useSocket = () => useContext(SocketContext);

interface Props {
  children: ReactNode;
}

export function SocketProvider({ children }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastNotification, setLastNotification] = useState<Notification | null>(null);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token) return;

    const s = io(API_GATEWAY_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));

    s.on('notification', (data: Notification) => {
      setLastNotification(data);
    });

    s.on('scan:progress', (data) => {
      // Optionally handle scan progress events
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket, connected, lastNotification }}>
      {children}
    </SocketContext.Provider>
  );
}
