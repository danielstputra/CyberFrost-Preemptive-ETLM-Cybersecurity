'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import type { ScanJob } from '@/types';

export function useStartDiscoveryScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiClient.post<{ jobId: string; status: string; message: string }>(
        ENDPOINTS.DISCOVERY_SCAN, { domain },
      );
      return res.data;
    },
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['discovery-domains'] }), 2000);
    },
  });
}

export function useScanStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['scan-status', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiClient.get<ScanJob>(`${ENDPOINTS.DISCOVERY_SCAN}/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === 'COMPLETED' || data.status === 'FAILED') return false;
      return 2000; // poll every 2s while running
    },
  });
}
