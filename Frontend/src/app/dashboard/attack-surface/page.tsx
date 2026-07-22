'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ScanDialog } from '@/components/dashboard/scan-dialog';
import { useStartDiscoveryScan, useScanStatus } from '@/hooks/use-discovery';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Shield, Globe, Activity, Search, Plus, Terminal, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/providers/translation-provider';
import type { PaginatedResponse, DiscoveredDomain } from '@/types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function AttackSurfacePage() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeJob, setActiveJob] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['discovery-domains', page],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<DiscoveredDomain>>(`${ENDPOINTS.DISCOVERY_DOMAINS}?page=${page}&limit=50`);
      return res.data;
    },
  });

  const startScan = useStartDiscoveryScan();
  const { data: scanStatus } = useScanStatus(activeJob);
  const handleScan = async (domain: string) => { const r = await startScan.mutateAsync(domain); setActiveJob(r.jobId); };

  const { sorted, total, toggleSort, page: curPage, pageSize, totalPages, setPage: setPageS, sortIcon, search, setSearch } = useSortableTable(data?.data, { key: '', dir: null });

  const stats = [
    { label: t('attackSurface.totalAssets'), value: data?.pagination?.total, icon: Globe },
    { label: t('attackSurface.active'), value: data?.data?.filter(d => d.isActive).length, icon: Activity },
    { label: t('attackSurface.uniquePorts'), value: [...new Set(data?.data?.flatMap(d => d.ports.map(p => p.port)) || [])].length, icon: Shield },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
          <Terminal className="h-5 w-5 text-[#00F6FF]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">{t('attackSurface.title')}</h1>
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('attackSurface.subtitle')}</p>
          </div>
        </div>
        <RoleGuard allowedRoles={['SUPER_ADMIN','SOC_MANAGER','SOC_ANALYST','TENANT_ADMIN','SECURITY_OPERATOR']}><HUDButton variant="cyan" size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-3.5 w-3.5" /> {t('attackSurface.startScan')}</HUDButton></RoleGuard>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <HUDCard key={s.label} accent="cyan" delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p><p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value ?? '—'}</p></div>
              <s.icon className="h-5 w-5 text-[#00F6FF]" />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title={t('attackSurface.domains')} accent="cyan" icon={<Globe className="h-3.5 w-3.5" />}>
          {/* Search + sort info */}
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-3">
            <div className="relative w-full sm:flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
              <input placeholder={t('attackSurface.scanPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30 transition-colors" />
            </div>
            <span className="text-[9px] font-mono text-[#6F7C89]">{t('attackSurface.records', `${total} records`)}</span>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('domain')}>
                    {t('attackSurface.domain')} {sortIcon('domain')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('ipAddress')}>
                    {t('attackSurface.ip')} {sortIcon('ipAddress')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('ports')}>
                    {t('attackSurface.ports')} {sortIcon('ports')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('attackSurface.technology')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('isActive')}>
                    {t('attackSurface.status')} {sortIcon('isActive')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted?.map((d) => (
                  <TableRow key={d.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-white">{d.domain}</TableCell>
                    <TableCell className="font-mono text-[11px] text-[#6F7C89]">{d.ipAddress || '—'}</TableCell>
                    <TableCell className="font-mono text-[11px] text-[#6F7C89]">{d.ports.slice(0, 3).map(p => `${p.port}`).join(', ')}{d.ports.length > 3 ? ` +${d.ports.length - 3}` : ''}</TableCell>
                    <TableCell className="font-mono text-[11px] text-[#6F7C89]">{d.technologies.slice(0, 2).map(t => t.name).join(', ')}</TableCell>
                    <TableCell><span className={`text-[10px] font-mono ${d.isActive ? 'text-[#00FF41]' : 'text-[#6F7C89]'}`}>{d.isActive ? t('attackSurface.activeStatus') : t('attackSurface.inactiveStatus')}</span></TableCell>
                  </TableRow>
                ))}
                {(!sorted || sorted.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="py-12 text-center font-mono text-xs text-[#6F7C89]">
                    <Search className="mx-auto mb-2 h-6 w-6 opacity-30" />{search ? t('attackSurface.noResults') : t('attackSurface.noData')}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono text-[#6F7C89]">{t('attackSurface.pagination', `Page ${curPage} of ${totalPages} (${total} items)`)}</span>
              <div className="flex gap-1">
                <HUDButton variant="cyan" size="sm" onClick={() => setPageS(Math.max(1, curPage - 1))} disabled={curPage <= 1}>
                  <ChevronLeft className="h-3 w-3" />
                </HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={() => setPageS(Math.min(totalPages, curPage + 1))} disabled={curPage >= totalPages}>
                  <ChevronRight className="h-3 w-3" />
                </HUDButton>
              </div>
            </div>
          )}
        </HUDCard>
      </motion.div>

      <ScanDialog open={dialogOpen} onOpenChange={setDialogOpen} scanType="discovery" onStartScan={handleScan}
        scanStatus={{ status: scanStatus?.status || (startScan.isPending ? 'PENDING' : 'IDLE'), progress: scanStatus?.progress || 0 }} />

      {/* Shadow IT — assets on unusual ports */}
      {data?.data && data.data.filter(d => d.ports.some(p => ![80, 443, 22, 21, 25, 110, 143, 993, 587, 3306, 5432, 6379, 27017, 8080, 8443].includes(p.port))).length > 0 && (
        <motion.div variants={itemAnim}>
          <HUDCard title={t('attackSurface.shadowIt')} accent="yellow" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="border-b border-[rgba(252,238,9,0.08)] bg-[rgba(252,238,9,0.02)] hover:bg-transparent">
                    <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('attackSurface.domain')}</TableHead>
                    <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('attackSurface.ip')}</TableHead>
                    <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('attackSurface.ports')}</TableHead>
                    <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('attackSurface.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.filter(d => d.ports.some(p => ![80, 443, 22, 21, 25, 110, 143, 993, 587, 3306, 5432, 6379, 27017, 8080, 8443].includes(p.port))).map((d) => (
                    <TableRow key={d.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono text-xs text-white">
                        <div className="flex items-center gap-2">
                          {d.domain}
                          <Badge className="text-[9px] font-mono tracking-wider" style={{ background: 'rgba(252,238,9,0.12)', color: '#FCEE09', border: '1px solid rgba(252,238,9,0.3)' }}>Shadow IT</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-[#6F7C89]">{d.ipAddress || '—'}</TableCell>
                      <TableCell className="font-mono text-[11px] text-[#FCEE09]">{d.ports.filter(p => ![80, 443, 22, 21, 25, 110, 143, 993, 587, 3306, 5432, 6379, 27017, 8080, 8443].includes(p.port)).map(p => `${p.port}/${p.service}`).join(', ')}</TableCell>
                      <TableCell><span className={`text-[10px] font-mono ${d.isActive ? 'text-[#00FF41]' : 'text-[#6F7C89]'}`}>{d.isActive ? t('attackSurface.activeStatus') : t('attackSurface.inactiveStatus')}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </HUDCard>
        </motion.div>
      )}
    </motion.div>
  );
}
