'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { HUDCard } from '@/components/cyber/HUDCard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Terminal, Radio, AlertTriangle, Search, Shield } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import type { IntelDashboard } from '@/types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const MITRE_TECHNIQUES = [
  { id: 'T1566', name: 'Phishing', tactic: 'Initial Access', severity: 'CRITICAL', detected: true, campaigns: 12 },
  { id: 'T1059', name: 'Command & Scripting Interpreter', tactic: 'Execution', severity: 'HIGH', detected: true, campaigns: 8 },
  { id: 'T1078', name: 'Valid Accounts', tactic: 'Defense Evasion', severity: 'CRITICAL', detected: false, campaigns: 15 },
  { id: 'T1190', name: 'Exploit Public-Facing Application', tactic: 'Initial Access', severity: 'CRITICAL', detected: true, campaigns: 6 },
  { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', severity: 'CRITICAL', detected: true, campaigns: 4 },
  { id: 'T1003', name: 'OS Credential Dumping', tactic: 'Credential Access', severity: 'HIGH', detected: false, campaigns: 9 },
  { id: 'T1550', name: 'Use Alternate Authentication Material', tactic: 'Defense Evasion', severity: 'MEDIUM', detected: true, campaigns: 3 },
  { id: 'T1021', name: 'Remote Services', tactic: 'Lateral Movement', severity: 'HIGH', detected: true, campaigns: 7 },
  { id: 'T1046', name: 'Network Service Scanning', tactic: 'Discovery', severity: 'MEDIUM', detected: true, campaigns: 5 },
  { id: 'T1505', name: 'Server Software Component', tactic: 'Persistence', severity: 'HIGH', detected: false, campaigns: 2 },
];

export default function ThreatIntelPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<IntelDashboard>({
    queryKey: ['intel-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<IntelDashboard>(ENDPOINTS.INTEL_DASHBOARD);
      return res.data;
    },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#FCEE09] pl-4">
        <Terminal className="h-5 w-5 text-[#FCEE09]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#FCEE09] font-mono uppercase">{t('threats.title')}</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('threats.subtitle')}</p>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-4">
        {[
          { label: t('threats.activeThreats'), value: data?.activeThreats?.length ?? '—', icon: Radio, accent: 'yellow' as const },
          { label: t('threats.trackedTechniques'), value: MITRE_TECHNIQUES.length, icon: Search, accent: 'cyan' as const },
          { label: t('threats.actors'), value: data?.activeThreats?.length ?? '—', icon: Shield, accent: 'red' as const },
          { label: t('threats.criticalTechniques'), value: MITRE_TECHNIQUES.filter(t => t.severity === 'CRITICAL').length, icon: AlertTriangle, accent: 'red' as const },
        ].map((s, i) => (
          <HUDCard key={s.label} accent={s.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p><p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value}</p></div>
              <s.icon className="h-5 w-5" style={{ color: s.accent === 'red' ? '#FF003C' : s.accent === 'yellow' ? '#FCEE09' : '#00F6FF' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title={t('threats.mitreMatrix')} accent="cyan" icon={<Search className="h-3.5 w-3.5" />}>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('threats.technique')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('threats.name')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('threats.tactic')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('threats.severity')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('threats.detected')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase text-right">{t('threats.campaigns')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MITRE_TECHNIQUES.map((technique, i) => (
                  <TableRow key={technique.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-[11px] text-[#00F6FF]">{technique.id}</TableCell>
                    <TableCell className="text-xs font-mono text-white">{technique.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-[#6F7C89]">{technique.tactic}</TableCell>
                    <TableCell><ThreatBadge level={technique.severity as any} /></TableCell>
                    <TableCell>
                      {technique.detected
                        ? <span className="font-mono text-[11px] text-[#00FF41]">● {t('threats.detectedLabel')}</span>
                        : <span className="font-mono text-[11px] text-[#6F7C89]">○ {t('threats.notDetected')}</span>}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-white">{technique.campaigns}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </HUDCard>
      </motion.div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        <motion.div variants={itemAnim} className="min-w-0">
          <HUDCard title={t('threats.actors')} accent="red" icon={<Shield className="h-3.5 w-3.5" />}>
            <div className="space-y-2">
              {data?.activeThreats && data.activeThreats.length > 0 ? data.activeThreats.slice(0, 5).map((actor, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-white/5 hover:border-[#FF003C]/30 transition-all"
                  style={{ background: 'rgba(5,5,5,0.4)' }}>
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[#FF003C]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-white">{actor.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-mono text-[#6F7C89]">{actor.threatType}</span>
                      <ThreatBadge level={actor.severity as any} />
                    </div>
                  </div>
                </div>
              )) : <p className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('threats.noActors')}</p>}
            </div>
          </HUDCard>
        </motion.div>

        <motion.div variants={itemAnim} className="min-w-0">
          <HUDCard title={t('threats.activeCampaigns')} accent="yellow" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            {data?.activeThreats && data.activeThreats.length > 0 ? data.activeThreats.slice(0, 5).map((threat, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="flex items-start gap-3 p-2.5 mb-2 last:mb-0 border border-white/5 hover:border-[#FCEE09]/30 transition-all"
                style={{ background: 'rgba(5,5,5,0.4)' }}>
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FCEE09]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-mono text-white">{threat.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{threat.threatType}</span>
                    <ThreatBadge level={threat.severity as any} />
                  </div>
                </div>
              </motion.div>
            )) : <p className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('threats.noData')}</p>}
          </HUDCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
