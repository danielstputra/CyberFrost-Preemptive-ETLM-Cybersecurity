'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Shield, ShieldAlert, Plus, Terminal, UserCheck, EyeOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface Executive {
  id: string;
  name: string;
  position: string;
  email: string;
  riskStatus: 'SAFE' | 'LEAKED' | 'MONITORING';
  incidents: { date: string; description: string; severity: string }[];
  createdAt: string;
}

const RISK_CONFIG = {
  SAFE: { label: 'SAFE', color: '#00FF41', bg: 'rgba(0,255,65,0.1)', border: 'rgba(0,255,65,0.3)' },
  LEAKED: { label: 'LEAKED', color: '#FF003C', bg: 'rgba(255,0,60,0.1)', border: 'rgba(255,0,60,0.3)' },
  MONITORING: { label: 'MONITORING', color: '#FCEE09', bg: 'rgba(252,238,9,0.1)', border: 'rgba(252,238,9,0.3)' },
};

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length <= 2 ? local[0] + '**' : local[0] + '****' + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
}

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

export default function ExecutivesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', position: '', email: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['executives'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/osint/executive?page=1&limit=50');
      return res.data;
    },
  });

  // Auto-refresh every 30 detik — cleanup on unmount
  useEffect(() => {
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ['executives'] }), 30000);
    return () => clearInterval(t);
  }, [qc]);

  const scanExecutives = useMutation({
    mutationFn: async () => { const res = await apiClient.post('/api/v1/osint/executive/monitor'); return res.data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['executives'] }); },
  });

  const addExecutive = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/v1/osint/executive', form);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['executives'] });
      setDialogOpen(false);
      setForm({ name: '', position: '', email: '' });
    },
  });

  const executives: Executive[] = data?.data || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#FF003C] pl-4">
          <Shield className="h-5 w-5 text-[#FF003C]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#FF003C] font-mono uppercase">{t('executives.title')}</h1>
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('executives.subtitle')}</p>
          </div>
        </div>
        <RoleGuard allowedRoles={['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN']}>
          <div className="flex flex-wrap gap-2">
            <HUDButton variant="red" size="sm" onClick={() => scanExecutives.mutate()} loading={scanExecutives.isPending} className="flex-1 sm:flex-none">
              <RefreshCw className="h-3.5 w-3.5" /> Scan Now
            </HUDButton>
            <HUDButton variant="red" size="sm" onClick={() => setDialogOpen(true)} className="flex-1 sm:flex-none">
              <Plus className="h-3.5 w-3.5" /> {t('executives.addExecutive')}
            </HUDButton>
          </div>
        </RoleGuard>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-3">
        {[
          { label: t('executives.total'), value: executives.length, icon: UserCheck, accent: 'red' as const },
          { label: t('executives.leaked'), value: executives.filter((e: Executive) => e.riskStatus === 'LEAKED').length, icon: EyeOff, accent: 'red' as const },
          { label: t('executives.monitoring'), value: executives.filter((e: Executive) => e.riskStatus === 'MONITORING').length, icon: AlertTriangle, accent: 'yellow' as const },
        ].map((s, i) => (
          <HUDCard key={s.label} accent={s.accent} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p>
                <p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{s.value}</p>
              </div>
              <s.icon className="h-5 w-5" style={{ color: s.accent === 'red' ? '#FF003C' : '#FCEE09' }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      <motion.div variants={itemAnim}>
        {executives.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-[#6F7C89]">
            <ShieldAlert className="mx-auto mb-3 h-8 w-8 opacity-30 text-[#FF003C]" />
            <p>{t('executives.noData')}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {executives.map((exec: Executive, i: number) => {
              const riskCfg = RISK_CONFIG[exec.riskStatus] || RISK_CONFIG.MONITORING;
              return (
                <HUDCard key={exec.id} accent="red" delay={i * 0.05}>
                  <div className="space-y-3">
                    {/* Name & Position */}
                    <div className="flex items-start justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold font-mono text-white neon-text-white tracking-wide">{exec.name}</p>
                        <p className="text-[10px] font-mono text-[#6F7C89] mt-0.5">{exec.position}</p>
                      </div>
                      <span
                        className="inline-flex items-center px-2 py-0.5 text-[9px] font-mono font-bold tracking-wider uppercase angle-sm shrink-0"
                        style={{ background: riskCfg.bg, color: riskCfg.color, border: `1px solid ${riskCfg.border}` }}
                      >
                        {riskCfg.label}
                      </span>
                    </div>

                    {/* Masked email */}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#6F7C89]">
                      <EyeOff className="h-3 w-3" />
                      <span>{maskEmail(exec.email)}</span>
                    </div>

                    {/* Incidents timeline */}
                    {exec.incidents && exec.incidents.length > 0 && (
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase mb-2">{t('executives.recentIncidents')}</p>
                        <div className="space-y-1.5">
                          {exec.incidents.slice(0, 3).map((inc, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span
                                className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                                style={{ background: inc.severity === 'HIGH' || inc.severity === 'CRITICAL' ? '#FF003C' : '#FCEE09' }}
                              />
                              <div className="min-w-0">
                                <p className="text-[9px] font-mono text-white truncate">{inc.description}</p>
                                <p className="text-[8px] font-mono text-[#6F7C89]">{getTimeAgo(inc.date)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </HUDCard>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(255,0,60,0.2)' }}>
          <DialogTitle className="font-mono text-[#FF003C] tracking-wider">{t('executives.addExecutive')}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1">{t('executives.addExecutiveDesc')}</DialogDescription>
          <div className="space-y-3 mt-4">
            <input
              placeholder={t('executives.namePlaceholder')}
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#FF003C]/30"
            />
            <input
              placeholder={t('executives.positionPlaceholder')}
              value={form.position}
              onChange={e => setForm({ ...form, position: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#FF003C]/30"
            />
            <input
              placeholder={t('executives.emailPlaceholder')}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#FF003C]/30"
            />
            <div className="flex justify-end gap-2 pt-2">
              <HUDButton variant="cyan" size="sm" onClick={() => setDialogOpen(false)}>{t('common.cancel')}</HUDButton>
              <RoleGuard allowedRoles={['SUPER_ADMIN', 'SOC_MANAGER', 'TENANT_ADMIN']}>
                <HUDButton variant="red" size="sm" onClick={() => addExecutive.mutate()} loading={addExecutive.isPending} disabled={!form.name || !form.email}>
                  {t('common.submit')}
                </HUDButton>
              </RoleGuard>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
