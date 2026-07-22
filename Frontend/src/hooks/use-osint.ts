'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';

interface OsintScanResponse {
  jobId: string;
  target: string;
  scanType: string;
  status: string;
  message: string;
}

interface OsintScanJob {
  jobId: string;
  target: string;
  scanType: string;
  status: string;
  progress: number;
  leaksFound: number;
  exposuresFound: number;
  error?: string;
}

export function useStartOsintScan() {
  return useMutation({
    mutationFn: async ({ target, scanType }: { target: string; scanType: string }) => {
      const res = await apiClient.post<OsintScanResponse>(
        ENDPOINTS.OSINT_SCAN, { target, scanType },
      );
      return res.data;
    },
  });
}

export function useOsintScanStatus(jobId: string | null) {
  return useQuery({
    queryKey: ['osint-scan-status', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const res = await apiClient.get<OsintScanJob>(`${ENDPOINTS.OSINT_SCAN}/${jobId}`);
      return res.data;
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.status === 'COMPLETED' || data.status === 'FAILED') return false;
      return 2000;
    },
  });
}
