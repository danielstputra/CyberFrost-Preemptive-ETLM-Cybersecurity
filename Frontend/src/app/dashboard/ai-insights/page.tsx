'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Terminal, Brain, Lightbulb, AlertTriangle, FileText, ChevronRight, Sparkles, Eye } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

const INSIGHT_TYPES = [
  { value: 'THREAT_SUMMARY', label: 'Threat Summary', icon: AlertTriangle, color: '#FF003C' },
  { value: 'ATTACK_SCENARIO', label: 'Attack Scenario', icon: Brain, color: '#FCEE09' },
  { value: 'EARLY_WARNING', label: 'Early Warning', icon: AlertTriangle, color: '#FF003C' },
  { value: 'RISK_ANALYSIS', label: 'Risk Analysis', icon: FileText, color: '#00F6FF' },
  { value: 'RECOMMENDATION', label: 'Recommendation', icon: Lightbulb, color: '#00FF41' },
  { value: 'RULE_GENERATION', label: 'Rule Generation', icon: Sparkles, color: '#FCEE09' },
];

export default function AIInsightsPage() {
  const { t } = useTranslation();
  const [showGenerate, setShowGenerate] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [form, setForm] = useState({ title: '', insightType: 'THREAT_SUMMARY', sourceData: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/ai/insights?page=1&limit=20');
      return res.data;
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/api/v1/ai/generate', {
        title: form.title, insightType: form.insightType,
        sourceData: form.sourceData ? { text: form.sourceData } : {},
      });
      return res.data;
    },
    onSuccess: () => { setShowGenerate(false); setForm({ title: '', insightType: 'THREAT_SUMMARY', sourceData: '' }); },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#FCEE09] pl-4">
          <Terminal className="h-5 w-5 text-[#FCEE09]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#FCEE09] font-mono uppercase">AI Insights</h1>
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; AI-powered threat analysis and recommendations</p>
          </div>
        </div>
        <RoleGuard allowedRoles={['SUPER_ADMIN','SOC_MANAGER','SOC_ANALYST','TENANT_ADMIN']}><HUDButton variant="yellow" size="sm" onClick={() => setShowGenerate(true)}>
          <Brain className="h-3.5 w-3.5" /> Generate Insight
        </HUDButton></RoleGuard>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={itemAnim} className="grid gap-4 sm:grid-cols-3">
        {['Total Insights', 'Critical', 'Recommendations'].map((label, i) => (
          <HUDCard key={label} accent={i === 1 ? 'red' : 'cyan'} delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div><p className="text-[9px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{label}</p><p className="mt-0.5 text-2xl font-bold font-mono text-white neon-text-white">{i === 0 ? data?.data?.length ?? '—' : i === 1 ? data?.data?.filter((d: any) => d.severity === 'CRITICAL').length ?? '—' : data?.data?.filter((d: any) => d.insightType === 'RECOMMENDATION').length ?? '—'}</p></div>
              {i === 0 ? <Brain className="h-5 w-5 text-[#00F6FF]" /> : i === 1 ? <AlertTriangle className="h-5 w-5 text-[#FF003C]" /> : <Lightbulb className="h-5 w-5 text-[#00FF41]" />}
            </div>
          </HUDCard>
        ))}
      </motion.div>

      {/* Insights list */}
      <motion.div variants={itemAnim}>
        <HUDCard title="AI Insights" accent="yellow" icon={<Brain className="h-3.5 w-3.5" />}>
          {data?.data?.length ? (
            <div className="space-y-2">
              {data.data.map((insight: any) => {
                const typeInfo = INSIGHT_TYPES.find(t => t.value === insight.insightType) || INSIGHT_TYPES[0];
                const Icon = typeInfo.icon;
                return (
                  <div key={insight._id} onClick={() => setShowDetail(insight)}
                    className="flex items-start gap-3 p-3 border border-white/5 hover:border-[#FCEE09]/30 transition-all cursor-pointer" style={{ background: 'rgba(5,5,5,0.4)' }}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: typeInfo.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-mono text-white">{insight.title}</p>
                      <p className="text-[10px] font-mono text-[#6F7C89] mt-0.5 line-clamp-2">{insight.summary}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] font-mono text-[#6F7C89] uppercase">{insight.insightType}</span>
                        <span className="text-[8px] font-mono text-[#6F7C89]">{new Date(insight.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#6F7C89] mt-1 shrink-0" />
                  </div>
                );
              })}
            </div>
          ) : <div className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">No AI insights generated yet. Click "Generate Insight" to start.</div>}
        </HUDCard>
      </motion.div>

      {/* Generate Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(252,238,9,0.2)' }}>
          <DialogTitle className="font-mono text-[#FCEE09] tracking-wider">Generate AI Insight</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1">Choose insight type and provide context.</DialogDescription>
          <div className="space-y-3 mt-4">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none focus:border-[#FCEE09]/30" />
            <select value={form.insightType} onChange={e => setForm({ ...form, insightType: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none">
              {INSIGHT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <textarea placeholder="Source data / context (optional)" value={form.sourceData} onChange={e => setForm({ ...form, sourceData: e.target.value })}
              className="w-full px-3 py-2 text-sm font-mono text-white bg-[rgba(5,5,5,0.6)] border border-white/5 outline-none min-h-[80px]" />
            <div className="flex justify-end gap-2 pt-2">
              <HUDButton variant="cyan" size="sm" onClick={() => setShowGenerate(false)}>Cancel</HUDButton>
              <HUDButton variant="yellow" size="sm" onClick={() => generate.mutate()} loading={generate.isPending} disabled={!form.title} glitchText="GENERATE">
                <Brain className="h-4 w-4" />
              </HUDButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent className="max-w-lg p-6" style={{ background: '#0B0F14', border: '1px solid rgba(252,238,9,0.2)' }}>
          <DialogTitle className="font-mono text-[#FCEE09] tracking-wider">{showDetail?.title || 'Insight Detail'}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1">
            {showDetail?.insightType} · {showDetail?.createdAt ? new Date(showDetail.createdAt).toLocaleDateString() : ''}
          </DialogDescription>
          <div className="mt-4 space-y-3">
            <p className="text-xs font-mono text-white leading-relaxed">{showDetail?.summary}</p>
            {showDetail?.fullAnalysis && (
              <div className="border-t border-white/5 pt-3">
                <p className="text-[9px] font-mono text-[#6F7C89] uppercase mb-2">Full Analysis</p>
                <p className="text-[10px] font-mono text-[#B6C2CF] leading-relaxed whitespace-pre-wrap">{showDetail.fullAnalysis}</p>
              </div>
            )}
            {showDetail?.recommendations?.length > 0 && (
              <div className="border-t border-white/5 pt-3">
                <p className="text-[9px] font-mono text-[#6F7C89] uppercase mb-2">Recommendations</p>
                <ul className="space-y-1">
                  {showDetail.recommendations.map((r: string, i: number) => (
                    <li key={i} className="text-[10px] font-mono text-[#00FF41] flex items-start gap-2">
                      <span>→</span> {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
