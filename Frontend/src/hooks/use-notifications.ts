'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import type { Notification, PaginatedResponse } from '@/types';

export function useNotifications(page = 1, limit = 20) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<Notification>>(
        `${ENDPOINTS.NOTIFICATIONS}?page=${page}&limit=${limit}`,
      );
      return res.data;
    },
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await apiClient.get<{ total: number; unread: number; criticalUnread: number }>(
        ENDPOINTS.NOTIFICATIONS_UNREAD,
      );
      return res.data;
    },
    refetchInterval: 15_000, // auto-refresh every 15s
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`${ENDPOINTS.NOTIFICATIONS}/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`${ENDPOINTS.NOTIFICATIONS_READ_ALL}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });
}
