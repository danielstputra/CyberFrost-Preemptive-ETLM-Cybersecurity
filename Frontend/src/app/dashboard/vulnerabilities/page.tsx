'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { HUDCard } from '@/components/cyber/HUDCard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { HUDButton } from '@/components/cyber/HUDButton';
import { useSortableTable } from '@/hooks/use-sortable-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Bug, AlertTriangle, Terminal, Search, ChevronLeft, ChevronRight, MoreVertical, Swords, ShieldOff, GitPullRequest } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaginatedResponse, Vulnerability } from '@/types';

const SEVERITIES = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function VulnerabilitiesPage() {
  const { t } = useTranslation();
  const [errorDialog, setErrorDialog] = useState<{ title: string; message: string } | null>(null);
  const [successDialog, setSuccessDialog] = useState<{ title: string; message: string } | null>(null);
  const [sev, setSev] = useState('ALL');
  const [page, setPage] = useState(1);
  const qs = sev !== 'ALL' ? `&severity=${sev}` : '';

  const { data, isLoading } = useQuery({
    queryKey: ['vulnerabilities', page, sev],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedResponse<Vulnerability>>(`${ENDPOINTS.INTEL_VULNERABILITIES}?page=${page}&limit=50${qs}`);
      return res.data;
    },
  });

  const { sorted, total, toggleSort, pageSize, totalPages, page: curPage, setPage: setPageS, sortIcon, search, setSearch } = useSortableTable(data?.data, { key: '', dir: null });
  const queryClient = useQueryClient();

  const action = useMutation({
    mutationFn: async ({ actionType, cveId, title }: { actionType: string; cveId: string; title?: string }) => {
      if (actionType === 'takedown') {
        await apiClient.post(ENDPOINTS.ACTION_TAKEDOWN, { targetUrl: `https://nvd.nist.gov/vuln/detail/${cveId}`, domain: 'nvd.nist.gov', threatType: 'TRADEMARK', evidence: `Auto-submitted CVE: ${cveId} - ${title || ''}` });
      } else if (actionType === 'block') {
        await apiClient.post(ENDPOINTS.ACTION_MITIGATION_BLOCK, { targetIp: '0.0.0.0', mitigationType: 'BLOCK_IP', description: `CVE Block: ${cveId} - ${title || ''}` });
      } else if (actionType === 'jira') {
        await apiClient.post('/api/v1/action/ticket', { title: `[CVE] ${title || cveId}`, description: `Investigate ${cveId}: ${title || ''}\nSeverity: CRITICAL\nURL: https://nvd.nist.gov/vuln/detail/${cveId}`, provider: 'JIRA' });
      }
    },
    onSuccess: (_data, variables) => { queryClient.invalidateQueries({ queryKey: ['mitigation'] }); setSuccessDialog({ title: 'Action Successful', message: `${variables.actionType === 'takedown' ? 'Takedown request' : variables.actionType === 'block' ? 'Block action' : 'Jira ticket'} has been created for ${variables.cveId}.` }); },
    onError: (err: any) => { setErrorDialog({ title: 'Action Failed', message: err?.message || 'Unknown error occurred.' }); },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#FF003C] pl-4">
        <Terminal className="h-5 w-5 text-[#FF003C]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#FF003C] font-mono uppercase">{t('vulns.title')}</h1><FeatureGuide title={t('vulns.guideTitle')} steps={[{title:t('vulns.guideFilter'),desc:t('vulns.guideFilterDesc')},{title:t('vulns.guideSearchSort'),desc:t('vulns.guideSearchSortDesc')}]} />
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('vulns.subtitle')}</p>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('vulns.totalCves'), value: data?.pagination?.total, icon: Bug, accent: 'cyan' as const },
          { label: t('vulns.exploitsAvailable'), value: data?.data?.filter(v => v.exploitAvailable).length, icon: AlertTriangle, accent: 'red' as const },
          { label: t('vulns.critical'), value: data?.data?.filter(v => v.severity === 'CRITICAL').length, icon: AlertTriangle, accent: 'red' as const },
        ].map((s, i) => (
          <HUDCard key={s.label} accent={s.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p><p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value ?? '—'}</p></div>
              <s.icon className="h-5 w-5" style={{ color: s.accent === 'red' ? '#FF003C' : '#00F6FF' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title={t('vulns.cveDatabase')} accent="cyan" icon={<Bug className="h-3.5 w-3.5" />}>
          {/* Filter + Search row */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            {SEVERITIES.map(s => (
              <HUDButton key={s} variant={sev === s ? 'yellow' : 'cyan'} size="sm" onClick={() => { setSev(s); setPage(1); }} className="flex-1 sm:flex-none">
                {s === 'ALL' ? t('vulns.filterAll') : s}
              </HUDButton>
            ))}
            <div className="relative w-full sm:flex-1 sm:max-w-xs sm:ml-auto">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
              <input placeholder={t('vulns.search')} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30 transition-colors" />
            </div>
            <span className="text-[9px] font-mono text-[#6F7C89]">{t('vulns.cveCount', `${total} CVEs`)}</span>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('cveId')}>{t('vulns.cveId')} {sortIcon('cveId')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('title')}>{t('vulns.title2')} {sortIcon('title')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase text-center cursor-pointer select-none" onClick={() => toggleSort('cvss.score')}>{t('vulns.cvss')} {sortIcon('cvss.score')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('severity')}>{t('vulns.severity')} {sortIcon('severity')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase cursor-pointer select-none" onClick={() => toggleSort('exploitAvailable')}>{t('vulns.exploit')} {sortIcon('exploitAvailable')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase text-center w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted?.map((v) => (
                  <TableRow key={v.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-[11px] text-[#00F6FF]">{v.cveId}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono text-white">{v.title}</TableCell>
                    <TableCell className="text-center font-mono text-xs text-white">{v.cvss?.score?.toFixed(1) || '—'}</TableCell>
                    <TableCell><ThreatBadge level={v.severity as any} /></TableCell>
                    <TableCell>{v.exploitAvailable ? <span className="font-mono text-xs font-bold text-[#FF003C] hud-pulse">{t('vulns.active')}</span> : <span className="font-mono text-xs text-[#6F7C89]">—</span>}</TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1 text-[#6F7C89] hover:text-white transition-colors cursor-pointer">
                          <MoreVertical className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="border border-[rgba(0,246,255,0.2)]" style={{ background: '#0B0F14' }}>
                          <DropdownMenuItem onClick={() => action.mutate({ actionType: 'takedown', cveId: v.cveId, title: v.title })} className="text-xs font-mono text-white hover:bg-[rgba(0,246,255,0.05)] cursor-pointer">
                            <Swords className="mr-2 h-3.5 w-3.5 text-[#00F6FF]" /> Request Takedown
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => action.mutate({ actionType: 'block', cveId: v.cveId, title: v.title })} className="text-xs font-mono text-white hover:bg-[rgba(0,246,255,0.05)] cursor-pointer">
                            <ShieldOff className="mr-2 h-3.5 w-3.5 text-[#FF003C]" /> Block Threat
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => action.mutate({ actionType: 'jira', cveId: v.cveId, title: v.title })} className="text-xs font-mono text-white hover:bg-[rgba(0,246,255,0.05)] cursor-pointer">
                            <GitPullRequest className="mr-2 h-3.5 w-3.5 text-[#FCEE09]" /> Create Jira Ticket
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {(!sorted || sorted.length === 0) && (
                  <TableRow><TableCell colSpan={6} className="py-12 text-center font-mono text-xs text-[#6F7C89]">
                    <Search className="mx-auto mb-2 h-6 w-6 opacity-30" />{search ? t('vulns.noResults') : t('common.noResults')}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono text-[#6F7C89]">{t('vulns.pagination', `Page ${curPage} of ${totalPages} (${total} results)`)}</span>
              <div className="flex gap-1">
                <HUDButton variant="cyan" size="sm" onClick={() => setPageS(Math.max(1, curPage - 1))} disabled={curPage <= 1}><ChevronLeft className="h-3 w-3" /></HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={() => setPageS(Math.min(totalPages, curPage + 1))} disabled={curPage >= totalPages}><ChevronRight className="h-3 w-3" /></HUDButton>
              </div>
            </div>
          )}
        </HUDCard>
      </motion.div>

      {/* Success Dialog */}
      <Dialog open={!!successDialog} onOpenChange={() => setSuccessDialog(null)}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,255,65,0.3)' }}>
          <DialogTitle className="font-mono text-[#00FF41] tracking-wider">✓ {successDialog?.title || 'Success'}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1 leading-relaxed">{successDialog?.message}</DialogDescription>
          <div className="flex justify-end pt-3">
            <HUDButton variant="cyan" size="sm" onClick={() => setSuccessDialog(null)}>Close</HUDButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={!!errorDialog} onOpenChange={() => setErrorDialog(null)}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(255,0,60,0.3)' }}>
          <DialogTitle className="font-mono text-[#FF003C] tracking-wider">✕ {errorDialog?.title || 'Error'}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1 leading-relaxed">{errorDialog?.message}</DialogDescription>
          <div className="flex justify-end pt-3">
            <HUDButton variant="cyan" size="sm" onClick={() => setErrorDialog(null)}>Close</HUDButton>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
