'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { CyberSelect } from '@/components/cyber/CyberSelect';
import { Terminal, Shield, Bug, Radio, Search, Eye, Activity, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const MITRE_TACTICS = [
  'Reconnaissance', 'Resource Development', 'Initial Access', 'Execution',
  'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access',
  'Discovery', 'Lateral Movement', 'Collection', 'Command and Control',
  'Exfiltration', 'Impact',
];

const TACTIC_COLORS: Record<string, string> = {
  'Initial Access': '#FF003C', Execution: '#FCEE09', Persistence: '#FF003C',
  'Privilege Escalation': '#FCEE09', 'Defense Evasion': '#FF003C',
  'Credential Access': '#FF003C', Discovery: '#00F6FF', 'Lateral Movement': '#FCEE09',
  Collection: '#00F6FF', 'Command and Control': '#FF003C', Exfiltration: '#FF003C',
  Impact: '#FF003C',
};

export default function ThreatHuntingPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState({ category: '', status: '' });
  const [viewRule, setViewRule] = useState<any>(null);

  const { data: heatmap } = useQuery({
    queryKey: ['mitre-heatmap'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/intelligence/hunting/mitre-heatmap'); return r.data; },
  });

  const { data: rules } = useQuery({
    queryKey: ['hunting-rules', filter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter.category) params.set('category', filter.category);
      if (filter.status) params.set('status', filter.status);
      const r = await apiClient.get(`/api/v1/intelligence/hunting/rules?${params}`);
      return r.data;
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/api/v1/intelligence/hunting/rules/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hunting-rules'] }),
  });

  const covered = MITRE_TACTICS.map(t => ({
    tactic: t,
    coverage: heatmap?.coverage?.[t]?.covered || 0,
    total: heatmap?.coverage?.[t]?.total || 0,
    color: TACTIC_COLORS[t] || '#00F6FF',
  }));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
        <Target className="h-5 w-5 text-[#00F6FF]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">Threat Hunting</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; MITRE ATT&CK Coverage & Sigma Rule Management</p>
        </div>
      </motion.div>

      {/* MITRE Heatmap */}
      <motion.div variants={itemAnim}>
        <HUDCard title="MITRE ATT&CK Coverage" accent="cyan" icon={<Activity className="h-3.5 w-3.5" />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {covered.map((t, i) => (
              <div key={t.tactic} className="p-2.5 border text-center transition-all hover:brightness-125"
                style={{
                  background: t.coverage > 0 ? `${t.color}15` : 'rgba(255,255,255,0.02)',
                  borderColor: t.coverage > 0 ? `${t.color}40` : 'rgba(255,255,255,0.05)',
                }}>
                <p className="text-[7px] font-mono font-bold tracking-wider uppercase" style={{ color: t.coverage > 0 ? t.color : '#6F7C89' }}>{t.tactic}</p>
                <p className="text-lg font-mono font-bold mt-1" style={{ color: t.coverage > 0 ? t.color : '#6F7C89' }}>
                  {t.coverage > 0 ? `${Math.round((t.coverage / Math.max(t.total, 1)) * 100)}%` : '—'}
                </p>
                <p className="text-[8px] font-mono text-[#6F7C89] mt-0.5">{t.coverage}/{t.total} rules</p>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>

      {/* Sigma Rules */}
      <motion.div variants={itemAnim}>
        <HUDCard title="Sigma Hunting Rules" accent="cyan" icon={<Search className="h-3.5 w-3.5" />}>
          <div className="flex flex-wrap gap-2 mb-4">
            <CyberSelect options={[
              { value: '', label: 'All Categories' },
              { value: 'EXECUTION', label: 'Execution' },
              { value: 'PERSISTENCE', label: 'Persistence' },
              { value: 'CREDENTIAL_ACCESS', label: 'Credential Access' },
              { value: 'C2', label: 'C2' },
              { value: 'EXFILTRATION', label: 'Exfiltration' },
              { value: 'LATERAL_MOVEMENT', label: 'Lateral Movement' },
              { value: 'DISCOVERY', label: 'Discovery' },
              { value: 'DEFENSE_EVASION', label: 'Defense Evasion' },
            ]} value={filter.category} onChange={v => setFilter({ ...filter, category: v })} placeholder="Category" />
            <CyberSelect options={[
              { value: '', label: 'All Status' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'DRAFT', label: 'Draft' },
            ]} value={filter.status} onChange={v => setFilter({ ...filter, status: v })} placeholder="Status" />
          </div>
          <div className="space-y-2">
            {rules?.data?.length === 0 && (
              <div className="py-6 text-center text-[10px] font-mono text-[#6F7C89]">No hunting rules found. They will be auto-seeded.</div>
            )}
            {rules?.data?.map((rule: any) => (
              <div key={rule._id} className="flex items-center justify-between p-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] font-mono text-white font-bold">{rule.title}</p>
                    <span className={`text-[8px] font-mono px-1 py-0.5 ${rule.severity === 'CRITICAL' ? 'text-[#FF003C] border border-[#FF003C]/30' : rule.severity === 'HIGH' ? 'text-[#FCEE09] border border-[#FCEE09]/30' : 'text-[#00F6FF] border border-[#00F6FF]/30'}`}>
                      {rule.severity}
                    </span>
                    <span className={`text-[8px] font-mono ${rule.status === 'ACTIVE' ? 'text-[#00FF41]' : rule.status === 'INACTIVE' ? 'text-[#6F7C89]' : 'text-[#FCEE09]'}`}>
                      {rule.status}
                    </span>
                  </div>
                  <p className="text-[8px] font-mono text-[#6F7C89] mt-0.5">{rule.ruleId} · {rule.category} · {rule.mitreAttackId}</p>
                </div>
                <div className="flex gap-1">
                  <HUDButton variant="cyan" size="sm" onClick={() => setViewRule(rule)}>
                    <Eye className="h-3 w-3" />
                  </HUDButton>
                  <HUDButton variant={rule.status === 'ACTIVE' ? 'red' : 'cyan'} size="sm"
                    onClick={() => toggleRule.mutate({ id: rule._id, status: rule.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}>
                    {rule.status === 'ACTIVE' ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                  </HUDButton>
                </div>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>

      {/* View Rule Dialog */}
      <Dialog open={!!viewRule} onOpenChange={() => setViewRule(null)}>
        <DialogContent className="max-w-2xl p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider text-sm">{viewRule?.title || 'Rule Detail'}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">{viewRule?.ruleId} · MITRE {viewRule?.mitreAttackId}</DialogDescription>
          <div className="space-y-3 mt-4">
            <p className="text-[10px] font-mono text-[#6F7C89]">{viewRule?.description}</p>
            <div className="flex gap-2 text-[9px] font-mono">
              <span className="px-1.5 py-0.5 border border-white/10 text-white">Log: {viewRule?.logSource}</span>
              <span className="px-1.5 py-0.5 border border-white/10 text-white">Severity: {viewRule?.severity}</span>
              <span className="px-1.5 py-0.5 border border-white/10 text-white">Status: {viewRule?.status}</span>
            </div>
            <div>
              <p className="text-[9px] font-mono text-[#6F7C89] uppercase tracking-wider mb-1">Sigma Rule</p>
              <pre className="p-3 text-[9px] font-mono text-[#00FF41] overflow-x-auto border border-white/5" style={{ background: 'rgba(0,0,0,0.6)', whiteSpace: 'pre-wrap' }}>
                {viewRule?.sigmaRule || 'No Sigma rule content'}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
