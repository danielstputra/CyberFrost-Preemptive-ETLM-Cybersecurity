'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { HUDCard } from '@/components/cyber/HUDCard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useNotifications } from '@/hooks/use-notifications';
import { useTranslation } from '@/providers/translation-provider';
import { Activity, AlertTriangle, ExternalLink, Shield, Siren } from 'lucide-react';
import type { IntelDashboard } from '@/types';

const SOURCE_TYPES = { THREAT: 'threat' as const, NOTIFICATION: 'notification' as const };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function WarRoomPage() {
  const { t } = useTranslation();

  const { data: intel, isLoading } = useQuery<IntelDashboard>({
    queryKey: ['intel-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get<IntelDashboard>(ENDPOINTS.INTEL_DASHBOARD);
      return res.data;
    },
  });

  const { data: notifData } = useNotifications(1, 50);

  const activeThreats = intel?.activeThreats || [];
  const criticalNotifs = notifData?.data?.filter(n => n.type === 'CRITICAL') || [];
  const activeCount = activeThreats.length;
  const criticalCount = (intel?.severityBreakdown?.CRITICAL || 0) + criticalNotifs.length;
  const containedCount = notifData?.data?.filter(n => n.read).length || 0;

  const threatIncidents = activeThreats.slice(0, 5).map((t, i) => ({
    id: t._id || `threat-${i}`,
    _sourceType: SOURCE_TYPES.THREAT,
    title: t.title,
    severity: t.severity,
    type: t.threatType || 'THREAT',
    status: 'ACTIVE' as const,
    detected: new Date().toISOString(),
  }));
  const notifIncidents = criticalNotifs.slice(0, 3).map((n, i) => ({
    id: n._id || `notif-${i}`,
    _sourceType: SOURCE_TYPES.NOTIFICATION,
    title: n.title,
    severity: 'CRITICAL' as const,
    type: n.eventType || 'ALERT',
    status: (n.read ? 'RESOLVED' : 'ACTIVE') as 'ACTIVE' | 'RESOLVED',
    detected: n.createdAt,
  }));
  const allIncidents = [...threatIncidents, ...notifIncidents]
    .sort((a, b) => new Date(b.detected).getTime() - new Date(a.detected).getTime());

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#FF003C] pl-4">
        <Siren className="h-5 w-5 text-[#FF003C]" />
        <FeatureGuide title={t('warRoom.guideTitle')} steps={[
          { title: t('warRoom.guideMonitor'), desc: t('warRoom.guideMonitorDesc') },
          { title: t('warRoom.guideRespond'), desc: t('warRoom.guideRespondDesc') },
        ]} />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#FF003C] font-mono uppercase">{t('warRoom.title')}</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('warRoom.subtitle')}</p>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('warRoom.totalIncidents'), value: allIncidents.length.toString(), icon: Activity, accent: 'red' as const },
          { label: t('warRoom.activeIncidents'), value: activeCount.toString(), icon: AlertTriangle, accent: 'yellow' as const },
          { label: t('warRoom.criticalIncidents'), value: criticalCount.toString(), icon: Shield, accent: 'red' as const },
          { label: t('warRoom.contained'), value: containedCount.toString(), icon: Siren, accent: 'cyan' as const },
        ].map((m, i) => (
          <HUDCard key={m.label} accent={m.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{m.label}</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-12 bg-white/5 animate-pulse" />
                ) : (
                  <p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{m.value}</p>
                )}
              </div>
              <m.icon className="h-5 w-5" style={{ color: m.accent === 'cyan' ? '#00F6FF' : m.accent === 'red' ? '#FF003C' : '#FCEE09' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title={t('warRoom.incidentList')} accent="red" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          {allIncidents.length > 0 ? (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t('warRoom.incidentId')}</TableHead>
                  <TableHead className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t('warRoom.title2')}</TableHead>
                  <TableHead className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t('warRoom.severity')}</TableHead>
                  <TableHead className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t('warRoom.type')}</TableHead>
                  <TableHead className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t('warRoom.status')}</TableHead>
                  <TableHead className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{t('warRoom.action')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allIncidents.map((inc) => (
                  <TableRow key={inc.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-[11px] text-[#FF003C]">{inc.id.slice(0, 8)}</TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono text-white">{inc.title}</TableCell>
                    <TableCell><ThreatBadge level={inc.severity as any}>{inc.severity}</ThreatBadge></TableCell>
                    <TableCell className="text-xs font-mono text-[#6F7C89]">{inc.type.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <span className={`text-[10px] font-mono ${inc.status === 'ACTIVE' ? 'text-[#FF003C]' : inc.status === 'RESOLVED' ? 'text-[#00FF41]' : 'text-[#FCEE09]'}`}>
                        {inc.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Link href={`/dashboard/war-room/${inc.id}?source=${inc._sourceType}`} className="inline-flex items-center gap-1 text-[10px] font-mono text-[#00F6FF] hover:text-white transition-colors">
                        {t('common.viewAll')} <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('warRoom.noIncidents')}</p>
          )}
        </HUDCard>
      </motion.div>
    </motion.div>
  );
}
