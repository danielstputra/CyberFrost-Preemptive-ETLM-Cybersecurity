'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import type { TakedownRequest, MitigationAction, MitigationStats, PaginatedResponse, TakedownStatus, MitigationStatus } from '@/types';

// ── Takedown Hooks ──

export function useTakedownList(page = 1, status?: string) {
  const qs = status ? `&status=${status}` : '';
  return useQuery({
    queryKey: ['takedown', page, status],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<TakedownRequest>>(
        `${ENDPOINTS.ACTION_TAKEDOWN}?page=${page}&limit=20${qs}`,
      );
      return res.data;
    },
  });
}

export function useSubmitTakedown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { targetUrl: string; domain: string; threatType: string; evidence?: string }) => {
      const res = await apiClient.post(ENDPOINTS.ACTION_TAKEDOWN, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['takedown'] }),
  });
}

export function useUpdateTakedownStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: TakedownStatus; note?: string }) => {
      const res = await apiClient.patch(`${ENDPOINTS.ACTION_TAKEDOWN}/${id}/status`, { status, note });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['takedown'] }),
  });
}

// ── Mitigation Hooks ──

export function useMitigationList(page = 1, status?: string) {
  const qs = status ? `&status=${status}` : '';
  return useQuery({
    queryKey: ['mitigation', page, status],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<MitigationAction>>(
        `${ENDPOINTS.ACTION_MITIGATION}?page=${page}&limit=20${qs}`,
      );
      return res.data;
    },
  });
}

export function useMitigationStats() {
  return useQuery({
    queryKey: ['mitigation-stats'],
    queryFn: async () => {
      const res = await apiClient.get<MitigationStats>(ENDPOINTS.ACTION_MITIGATION_STATS);
      return res.data;
    },
  });
}

export function useManualBlock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { targetIp?: string; targetDomain?: string; mitigationType: string; description?: string }) => {
      const res = await apiClient.post(ENDPOINTS.ACTION_MITIGATION_BLOCK, { ...data, durationSeconds: 86400 });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mitigation'] }),
  });
}

export function useUpdateMitigationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MitigationStatus }) => {
      const res = await apiClient.patch(`${ENDPOINTS.ACTION_MITIGATION}/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mitigation'] }),
  });
}
