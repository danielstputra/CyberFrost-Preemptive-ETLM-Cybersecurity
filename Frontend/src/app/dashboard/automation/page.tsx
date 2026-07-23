'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Terminal, Play, Zap, AlertTriangle, Users, Activity, ChevronRight, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const STEP_ICONS: Record<string, React.ElementType> = { TAKEDOWN: Zap, BLOCK: AlertTriangle, NOTIFY: Users, APPROVAL: Users, ESCALATE: ArrowRight, EMAIL: Activity };

export default function AutomationPage() {
  const [viewPb, setViewPb] = useState<any>(null);

  const { data: dash } = useQuery({
    queryKey: ['auto-dash'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/automation/dashboard'); return r.data; },
  });
  const { data: playbooks } = useQuery({
    queryKey: ['auto-playbooks'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/automation/playbooks'); return r.data; },
  });
  const { data: escalations } = useQuery({
    queryKey: ['auto-escalations'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/automation/escalations'); return r.data; },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
        <Zap className="h-5 w-5 text-[#00F6FF]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">Automation</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; Playbooks, Escalation & Approval Chains</p>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <HUDCard accent="cyan"><div className="text-center"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Playbooks</p><p className="text-2xl font-bold font-mono text-white">{dash?.playbooks || 0}</p></div></HUDCard>
        <HUDCard accent="yellow"><div className="text-center"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Active</p><p className="text-2xl font-bold font-mono text-[#00FF41]">{dash?.activePlaybooks || 0}</p></div></HUDCard>
        <HUDCard accent="cyan"><div className="text-center"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Escalations</p><p className="text-2xl font-bold font-mono text-white">{dash?.escalations || 0}</p></div></HUDCard>
        <HUDCard accent="red"><div className="text-center"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Active Escalations</p><p className="text-2xl font-bold font-mono text-[#FCEE09]">{dash?.activeEscalations || 0}</p></div></HUDCard>
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title="Playbooks" accent="cyan" icon={<Play className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {playbooks?.data?.map((pb: any) => (
              <div key={pb._id} className="p-3 border border-white/5 cursor-pointer hover:border-[#00F6FF]/30"
                style={{ background: 'rgba(255,255,255,0.02)' }} onClick={() => setViewPb(pb)}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono font-bold text-white">{pb.name}</p>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 ${pb.status === 'ACTIVE' ? 'text-[#00FF41] border border-[#00FF41]/30' : 'text-[#6F7C89] border border-white/10'}`}>{pb.status}</span>
                </div>
                <p className="text-[9px] font-mono text-[#6F7C89] mt-0.5">{pb.description}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[8px] font-mono text-[#00F6FF]">{pb.trigger}</span>
                  <span className="text-[8px] font-mono text-[#6F7C89]">· {pb.steps?.length || 0} steps · {pb.runCount || 0} runs</span>
                </div>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title="Escalation Rules" accent="yellow" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
          <div className="space-y-2">
            {escalations?.data?.map((e: any) => (
              <div key={e._id} className="flex items-center justify-between p-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <p className="text-[10px] font-mono text-white">{e.name}</p>
                  <p className="text-[8px] font-mono text-[#6F7C89]">Timeout: {e.timeoutMinutes}min → {e.escalateTo?.join(', ')}</p>
                </div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 ${e.status === 'ACTIVE' ? 'text-[#00FF41] border border-[#00FF41]/30' : 'text-[#6F7C89] border border-white/10'}`}>{e.status}</span>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>

      <Dialog open={!!viewPb} onOpenChange={() => setViewPb(null)}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] text-sm">{viewPb?.name}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">{viewPb?.trigger} · {viewPb?.severity?.join(', ')}</DialogDescription>
          <div className="space-y-2 mt-4">
            {viewPb?.steps?.sort((a: any, b: any) => a.order - b.order).map((s: any) => {
              const Icon = STEP_ICONS[s.type] || Activity;
              return (
                <div key={s.stepId} className="flex items-center gap-2 p-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <Icon className="h-3.5 w-3.5 text-[#00F6FF] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-mono text-white">{s.name}</p>
                    <p className="text-[8px] font-mono text-[#6F7C89]">{s.type} · timeout: {s.timeout}s</p>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
