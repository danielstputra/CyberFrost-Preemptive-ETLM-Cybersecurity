'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { ThreatBadge } from '@/components/cyber/ThreatBadge';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Terminal, Building2, Shield, AlertTriangle, Plus } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useTranslation } from '@/providers/translation-provider';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function TPRMPage() {
  const { t } = useTranslation();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', category: 'Technology', contactEmail: '' });
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['tprm-vendors'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/tprm/vendor?page=1&limit=50');
      return res.data;
    },
  });

  const addVendor = useMutation({
    mutationFn: async () => { const r = await apiClient.post('/api/v1/tprm/vendor', form); return r.data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tprm-vendors'] }); setShowAdd(false); setForm({ name: '', domain: '', category: 'Technology', contactEmail: '' }); },
  });

  const vendors = data?.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
          <Terminal className="h-5 w-5 text-[#00F6FF]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">{t('tprm.title')}</h1>
            <FeatureGuide title={t('tprm.guideTitle')} steps={[{title:t('tprm.guideOverview'),desc:t('tprm.guideOverviewDesc')},{title:t('tprm.guideRisk'),desc:t('tprm.guideRiskDesc')},{title:t('tprm.guideAdd'),desc:t('tprm.guideAddDesc')}]} />
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('tprm.subtitle')}</p>
          </div>
        </div>
        <RoleGuard allowedRoles={['SUPER_ADMIN','SOC_MANAGER','TENANT_ADMIN']}><HUDButton variant="cyan" size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> {t('tprm.addVendor')}</HUDButton></RoleGuard>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('tprm.totalVendors'), value: vendors.length, icon: Building2, accent: 'cyan' as const },
          { label: t('tprm.highRisk'), value: vendors.filter((v: any) => v.riskLevel === 'HIGH' || v.riskLevel === 'CRITICAL').length, icon: AlertTriangle, accent: 'red' as const },
          { label: t('tprm.underReview'), value: vendors.filter((v: any) => v.status === 'UNDER_REVIEW').length, icon: Shield, accent: 'yellow' as const },
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
        <HUDCard title={t('tprm.vendors')} accent="cyan" icon={<Building2 className="h-3.5 w-3.5" />}>
          <div className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="border-b border-[rgba(0,246,255,0.08)] bg-[rgba(0,246,255,0.02)] hover:bg-transparent">
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('tprm.vendor')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('tprm.domain')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('tprm.category')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('tprm.risk')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('tprm.status')}</TableHead>
                  <TableHead className="text-[11px] font-bold font-mono text-white tracking-wider uppercase">{t('tprm.lastAssessed')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendors.map((v: any) => (
                  <TableRow key={v._id} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-mono text-xs text-white">{v.name}</TableCell>
                    <TableCell className="font-mono text-[11px] text-[#6F7C89]">{v.domain}</TableCell>
                    <TableCell className="font-mono text-[11px] text-[#6F7C89]">{v.category}</TableCell>
                    <TableCell><ThreatBadge level={v.riskLevel as any} /></TableCell>
                    <TableCell><span className={`text-[10px] font-mono ${v.status === 'ACTIVE' ? 'text-[#00FF41]' : v.status === 'UNDER_REVIEW' ? 'text-[#FCEE09]' : 'text-[#6F7C89]'}`}>{v.status}</span></TableCell>
                    <TableCell className="font-mono text-[10px] text-[#6F7C89]">{v.lastAssessedAt ? formatDate(v.lastAssessedAt) : '—'}</TableCell>
                  </TableRow>
                ))}
                {vendors.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('tprm.noVendors')}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </HUDCard>
      </motion.div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider">{t('tprm.addVendor')}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1">{t('tprm.addVendorDesc')}</DialogDescription>
          <div className="space-y-3 mt-4">
            <input placeholder={t('tprm.companyName')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#00F6FF]/30" />
            <input placeholder={t('tprm.domainPlaceholder')} value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#00F6FF]/30" />
            <div className="flex justify-end gap-2 pt-2">
              <HUDButton variant="cyan" size="sm" onClick={() => setShowAdd(false)}>{t('common.cancel')}</HUDButton>
              <HUDButton variant="yellow" size="sm" onClick={() => addVendor.mutate()} loading={addVendor.isPending}
                disabled={!form.name || !form.domain}>{t('tprm.add')}</HUDButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
