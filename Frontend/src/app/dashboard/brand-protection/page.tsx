'use client';

import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { HUDCard } from '@/components/cyber/HUDCard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Badge } from '@/components/ui/badge';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ScanDialog } from '@/components/dashboard/scan-dialog';
import { useStartOsintScan, useOsintScanStatus } from '@/hooks/use-osint';
import { Search, AlertTriangle, Globe, Shield, Plus, Terminal } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import type { PaginatedResponse, DarkWebLeak, BrandExposure } from '@/types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function BrandProtectionPage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeJob, setActiveJob] = useState<string | null>(null);

  const { data: leaks, isLoading: lLoading } = useQuery({
    queryKey: ['osint-leaks'],
    queryFn: async () => { const r = await apiClient.get<PaginatedResponse<DarkWebLeak>>(`${ENDPOINTS.OSINT_LEAKS}?page=1&limit=5`); return r.data; },
  });
  const { data: exposures, isLoading: eLoading } = useQuery({
    queryKey: ['osint-exposures'],
    queryFn: async () => { const r = await apiClient.get<PaginatedResponse<BrandExposure>>(`${ENDPOINTS.OSINT_EXPOSURES}?page=1&limit=5`); return r.data; },
  });

  const startScan = useStartOsintScan();
  const { data: scanStatus } = useOsintScanStatus(activeJob);
  const queryClient = useQueryClient();

  // Refetch leaks & exposures ONLY when scan actually completes
  useEffect(() => {
    if (scanStatus?.status === 'COMPLETED') {
      queryClient.invalidateQueries({ queryKey: ['osint-leaks'] });
      queryClient.invalidateQueries({ queryKey: ['osint-exposures'] });
    }
  }, [scanStatus?.status, queryClient]);

  const handleScan = async (target: string) => {
    const r = await startScan.mutateAsync({ target, scanType: 'DOMAIN' });
    setActiveJob(r.jobId);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#FF003C] pl-4">
          <Terminal className="h-5 w-5 text-[#FF003C]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#FF003C] font-mono uppercase">{t('brandProtection.title')}</h1><FeatureGuide title={t('brandProtection.guideTitle')} steps={[{title:t('brandProtection.guideOsintScan'),desc:t('brandProtection.guideOsintScanDesc')},{title:t('brandProtection.guideResults'),desc:t('brandProtection.guideResultsDesc')}]} />
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('brandProtection.subtitle')}</p>
          </div>
        </div>
        <RoleGuard allowedRoles={['SUPER_ADMIN','SOC_MANAGER','SOC_ANALYST','TENANT_ADMIN','SECURITY_OPERATOR']}><HUDButton variant="red" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> {t('brandProtection.startOsint')}</HUDButton></RoleGuard>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t('brandProtection.totalLeaks'), value: leaks?.pagination?.total, icon: AlertTriangle, accent: 'red' as const },
          { label: t('brandProtection.withCredentials'), value: leaks?.data?.filter(l => l.leakedCredentials).length, icon: Search, accent: 'yellow' as const },
          { label: t('brandProtection.exposures'), value: exposures?.pagination?.total, icon: Globe, accent: 'yellow' as const },
          { label: t('brandProtection.typoSquats'), value: exposures?.data?.filter(e => e.exposureType === 'TYPOSQUATTING').length, icon: Shield, accent: 'cyan' as const },
        ].map((s, i) => (
          <HUDCard key={s.label} accent={s.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p>
                <p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value ?? '—'}</p>
              </div>
              <s.icon className="h-5 w-5" style={{ color: s.accent === 'red' ? '#FF003C' : s.accent === 'yellow' ? '#FCEE09' : '#00F6FF' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <motion.div variants={itemAnim} className="min-w-0"><HUDCard title={t('brandProtection.leaks')} accent="red" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          <div className="flex items-center justify-end mb-2">
            <Badge variant="outline" className="border-[#00F6FF] text-[#00F6FF] text-[9px] font-mono tracking-wider">{t('brandProtection.piiMasked')}</Badge>
          </div>
          {lLoading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse" />)}</div>
          : leaks?.data?.length ? leaks.data.map(leak => (
            <div key={leak._id} className="flex items-start justify-between gap-2 p-3 mb-2 last:mb-0 border border-white/5 hover:border-[#FF003C]/30 transition-all" style={{background:'rgba(5,5,5,0.4)'}}>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-mono text-white">{leak.title}</p>
                <p className="text-[9px] font-mono text-[#6F7C89] mt-0.5">{leak.source}</p>
              </div>
              <ThreatBadge level={leak.severity as any} />
            </div>
          )) : <p className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('brandProtection.noLeaks')}</p>}
        </HUDCard></motion.div>

        <motion.div variants={itemAnim}><HUDCard title={t('brandProtection.brandExposures')} accent="yellow" icon={<Search className="h-3.5 w-3.5" />}>
          {eLoading ? <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-white/5 animate-pulse" />)}</div>
          : exposures?.data?.length ? exposures.data.map(exp => (
            <div key={exp._id} className="flex items-start justify-between gap-2 p-3 mb-2 last:mb-0 border border-white/5 hover:border-[#FCEE09]/30 transition-all" style={{background:'rgba(5,5,5,0.4)'}}>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-mono text-white">{exp.domain}</p>
                <p className="text-[9px] font-mono text-[#6F7C89] mt-0.5">{exp.exposureType}</p>
              </div>
              <ThreatBadge level={exp.severity as any} />
            </div>
          )) : <p className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('brandProtection.noExposures')}</p>}
        </HUDCard></motion.div>
      </div>

      <ScanDialog open={dialogOpen} onOpenChange={setDialogOpen} scanType="osint"
        onStartScan={handleScan}
        scanStatus={{ status: scanStatus?.status || (startScan.isPending ? 'PENDING' : 'IDLE'), progress: scanStatus?.progress || 0 }} />
    </motion.div>
  );
}
