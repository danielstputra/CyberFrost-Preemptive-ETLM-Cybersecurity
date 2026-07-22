'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { ENDPOINTS, API_PREFIX } from '@/lib/constants';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import { HUDCard } from '@/components/cyber/HUDCard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { TerminalPanel } from '@/components/cyber/TerminalPanel';
import { HUDButton } from '@/components/cyber/HUDButton';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bug, AlertTriangle, Search, Shield, Activity, Terminal, ChevronLeft, ChevronRight, TrendingUp, FileText } from 'lucide-react';
import { SeverityBarChart, TrendLineChart } from '@/components/dashboard/risk-charts';
import { useTranslation } from '@/providers/translation-provider';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { useAuthStore } from '@/store/auth-store';
import type { IntelDashboard, PaginatedResponse, Vulnerability } from '@/types';

const sevColors: Record<string, string> = {
  CRITICAL: 'bg-[#FF003C]', HIGH: 'bg-[#FCEE09]', MEDIUM: 'bg-[#00F6FF]', LOW: 'bg-[#00FF41]',
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function ExecutiveViewPage() {
  const { t } = useTranslation();

  const { data: intel, isLoading } = useQuery<IntelDashboard>({
    queryKey: ['intel-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<IntelDashboard>(ENDPOINTS.INTEL_DASHBOARD);
      return res.data;
    },
  });

  // Fetch most recent vulnerabilities (sorted by publishedAt desc)
  const { data: vulnData } = useQuery({
    queryKey: ['vulnerabilities-recent'],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<Vulnerability>>(`${ENDPOINTS.INTEL_VULNERABILITIES}?page=1&limit=20&sortBy=publishedAt&sortOrder=desc`);
      return res.data;
    },
  });

  const { sorted, total, toggleSort, page: curPage, totalPages, setPage, sortIcon, search, setSearch } = useSortableTable(vulnData?.data, { key: 'publishedAt', dir: 'desc' });

  const exportMutation = useMutation({
    mutationFn: async () => {
      const tenantId = useAuthStore.getState().user?.tenantId || 'default';
      const res = await apiClient.post(`${API_PREFIX}/reports/generate`,
        { tenantId, reportType: 'executive' },
        { responseType: 'blob' }
      );
      return { blob: res.data as Blob, contentType: (res.headers?.['content-type'] as string) || 'application/pdf' };
    },
    onSuccess: ({ blob, contentType }: { blob: Blob; contentType: string }) => {
      const isPdf = contentType?.includes('pdf');
      const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `executive-report-${new Date().toISOString().split('T')[0]}.${isPdf ? 'pdf' : 'html'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });

  const metrics = [
    { label: t('dashboard.totalVulns'), value: intel?.totalVulnerabilities, icon: Bug, accent: 'cyan' as const },
    { label: t('dashboard.exploitsAvailable'), value: intel?.exploitsAvailable, icon: AlertTriangle, accent: 'red' as const },
    { label: t('dashboard.activeThreats'), value: intel?.activeThreats?.length, icon: Search, accent: 'yellow' as const },
    { label: t('dashboard.critical'), value: intel?.severityBreakdown?.CRITICAL, icon: Shield, accent: 'red' as const },
  ];

  const execGuide = [
    { title: t('dashboard.guideStatCards'), desc: t('dashboard.guideStatCardsDesc') },
    { title: t('dashboard.guideSevBreakdown'), desc: t('dashboard.guideSevBreakdownDesc') },
    { title: t('dashboard.activeThreats'), desc: t('dashboard.guideActiveThreatsDesc') },
    { title: t('dashboard.guideRecentCVEs'), desc: t('dashboard.guideRecentCVEsDesc') },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#FCEE09] pl-4">
        <Activity className="h-5 w-5 text-[#FCEE09]" />
        <FeatureGuide title={t('dashboard.guideTitle')} steps={execGuide} />
        <div className="flex-1">
          <h1 className="text-base font-bold tracking-[0.15em] text-[#FCEE09] font-mono uppercase">{t('dashboard.executive')}</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('dashboard.subtitle')}</p>
        </div>
        <RoleGuard allowedRoles={['SUPER_ADMIN','SOC_MANAGER','TENANT_ADMIN','EXECUTIVE_VIEWER']}>
          <HUDButton variant="yellow" size="sm" onClick={() => exportMutation.mutate()} loading={exportMutation.isPending}>
            <FileText className="h-3.5 w-3.5" /> Export Report
          </HUDButton>
        </RoleGuard>
      </motion.div>

      {/* Metric Cards */}
      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m, i) => (
          <HUDCard key={m.label} accent={m.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{m.label}</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-16 bg-white/5 animate-pulse" />
                ) : (
                  <p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{m.value ?? '—'}</p>
                )}
              </div>
              <m.icon className="h-5 w-5" style={{ color: m.accent === 'cyan' ? '#00F6FF' : m.accent === 'red' ? '#FF003C' : '#FCEE09' }} />
            </div>
            <div className="mt-3 h-1 w-full bg-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((Number(m.value) || 0) * 3, 100)}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
                className="h-full" style={{ background: m.accent === 'cyan' ? '#00F6FF' : m.accent === 'red' ? '#FF003C' : '#FCEE09' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      {/* Two-column */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Severity */}
        <motion.div variants={itemAnim} className="min-w-0">
          <HUDCard title={t('dashboard.severityBreakdown')} accent="cyan" icon={<Activity className="h-3.5 w-3.5" />}>
            {intel?.severityBreakdown ? Object.entries(intel.severityBreakdown).map(([sev, count]) => {
              const total = Object.values(intel.severityBreakdown).reduce((a, b) => a + b, 0);
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={sev} className="mb-3 last:mb-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <ThreatBadge level={sev as any}>{sev}</ThreatBadge>
                    <span className="text-xs font-mono text-white shrink-0">{count}</span>
                  </div>
                  <div className="h-2 w-full bg-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full ${sevColors[sev] || 'bg-gray-500'}`} />
                  </div>
                </div>
              );
            }) : <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-10 bg-white/5 animate-pulse" />)}</div>}
          </HUDCard>
        </motion.div>

        {/* Threats */}
        <motion.div variants={itemAnim} className="min-w-0">
          <HUDCard title={t('dashboard.activeThreats')} accent="yellow" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            {intel?.activeThreats?.length ? intel.activeThreats.slice(0, 5).map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-2.5 mb-2 last:mb-0 border border-white/5 hover:border-[#FCEE09]/30 transition-all"
                style={{ background: 'rgba(5,5,5,0.4)' }}>
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FCEE09]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-mono text-white">{t.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t.threatType}</span>
                    <ThreatBadge level={t.severity as any} />
                  </div>
                </div>
              </motion.div>
            )) : <p className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('dashboard.noThreats')}</p>}
          </HUDCard>
        </motion.div>
      </div>

      {/* Enhanced CVE Table — like CVE Database */}
      <motion.div variants={itemAnim}>
        <HUDCard title={t('dashboard.recentVulns')} accent="cyan" icon={<Bug className="h-3.5 w-3.5" />}>
          {/* Search + count */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
            <div className="relative w-full sm:flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
              <input placeholder={t('dashboard.searchCve')} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30 transition-colors" />
            </div>
            <span className="text-[9px] font-mono text-[#6F7C89]">{t('dashboard.cveCount', `${total} CVEs`)}</span>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('cveId')}>{t('dashboard.cve')} {sortIcon('cveId')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('title')}>{t('dashboard.title')} {sortIcon('title')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase text-center cursor-pointer select-none" onClick={() => toggleSort('cvss.score')}>{t('dashboard.cvss')} {sortIcon('cvss.score')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('severity')}>{t('dashboard.severity')} {sortIcon('severity')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('exploitAvailable')}>{t('dashboard.exploit')} {sortIcon('exploitAvailable')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted?.map((v) => (
                  <TableRow key={v.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-[11px] text-[#00F6FF]">{v.cveId}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono text-white">{v.title}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-white">{v.cvss?.score?.toFixed(1) || '—'}</TableCell>
                    <TableCell><ThreatBadge level={v.severity as any} /></TableCell>
                    <TableCell>{v.exploitAvailable ? <span className="font-mono text-xs font-bold text-[#FF003C] hud-pulse">{t('dashboard.active')}</span> : <span className="font-mono text-xs text-[#6F7C89]">—</span>}</TableCell>
                  </TableRow>
                ))}
                {(!sorted || sorted.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center font-mono text-xs text-[#6F7C89]">
                    <Search className="mx-auto mb-2 h-6 w-6 opacity-30" />{search ? t('common.noResults') : t('dashboard.noData')}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono text-[#6F7C89]">{t('dashboard.pageOf', `Page ${curPage} of ${totalPages}`)}</span>
              <div className="flex gap-1">
                <HUDButton variant="cyan" size="sm" onClick={() => setPage(Math.max(1, curPage - 1))} disabled={curPage <= 1}><ChevronLeft className="h-3 w-3" /></HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={() => setPage(Math.min(totalPages, curPage + 1))} disabled={curPage >= totalPages}><ChevronRight className="h-3 w-3" /></HUDButton>
              </div>
            </div>
          )}
        </HUDCard>
      </motion.div>


      {/* Risk Charts */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <motion.div variants={itemAnim} className="min-w-0">
          <HUDCard title="Severity Distribution" accent="cyan" icon={<Activity className="h-3.5 w-3.5" />}>
            <SeverityBarChart />
          </HUDCard>
        </motion.div>
        <motion.div variants={itemAnim} className="min-w-0">
          <HUDCard title="Historical Trend" accent="yellow" icon={<TrendingUp className="h-3.5 w-3.5" />}>
            <TrendLineChart />
          </HUDCard>
        </motion.div>
      </div>

      {/* Terminal Log */}
      <motion.div variants={itemAnim}>
        <TerminalPanel lines={[
          `${t('dashboard.systemInit')} — 7 ${t('dashboard.modulesOnline')}`,
          `${t('dashboard.vulnDb')}: ${intel?.totalVulnerabilities ?? 0} ${t('dashboard.entries')}`,
          `${t('dashboard.activeThreats')}: ${intel?.activeThreats?.length ?? 0} ${t('dashboard.campaigns')}`,
          t('dashboard.cronJob'),
          t('dashboard.socketConnected'),
        ]} title={t('dashboard.systemLog')} />
      </motion.div>
    </motion.div>
  );
}
