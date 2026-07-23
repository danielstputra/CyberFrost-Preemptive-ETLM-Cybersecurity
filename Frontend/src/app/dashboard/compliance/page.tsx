'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Terminal, Shield, FileText, CheckCircle, AlertTriangle, BookOpen, Eye } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function CompliancePage() {
  const [viewPolicy, setViewPolicy] = useState<any>(null);

  const { data: dash } = useQuery({
    queryKey: ['compliance-dash'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/compliance/dashboard'); return r.data; },
  });

  const { data: policies } = useQuery({
    queryKey: ['compliance-policies'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/compliance/policies'); return r.data; },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
        <Shield className="h-5 w-5 text-[#00F6FF]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">Compliance & Governance</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; Framework Mapping, Policy Management & Evidence</p>
        </div>
      </motion.div>

      {/* Framework Cards */}
      <motion.div variants={itemAnim} className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {dash?.frameworks?.map((fw: any) => (
          <HUDCard key={fw.framework} accent="cyan">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono font-bold text-white">{fw.framework}</p>
                <span className="text-[8px] font-mono text-[#6F7C89]">v{fw.version}</span>
              </div>
              <p className="text-[9px] font-mono text-[#6F7C89]">{fw.totalControls} controls</p>
              <div className="flex gap-2">
                {fw.critical > 0 && <span className="text-[8px] font-mono text-[#FF003C]">{fw.critical} critical</span>}
                {fw.high > 0 && <span className="text-[8px] font-mono text-[#FCEE09]">{fw.high} high</span>}
              </div>
            </div>
          </HUDCard>
        ))}
      </motion.div>

      {/* Policies */}
      <motion.div variants={itemAnim}>
        <HUDCard title="Security Policies" accent="cyan" icon={<FileText className="h-3.5 w-3.5" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {policies?.data?.map((p: any) => (
              <div key={p._id} className="p-3 border border-white/5 cursor-pointer hover:border-[#00F6FF]/30 transition-colors"
                style={{ background: 'rgba(255,255,255,0.02)' }}
                onClick={() => setViewPolicy(p)}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono font-bold text-white">{p.title}</p>
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 ${p.status === 'ACTIVE' ? 'text-[#00FF41] border border-[#00FF41]/30' : p.status === 'DRAFT' ? 'text-[#FCEE09] border border-[#FCEE09]/30' : 'text-[#6F7C89] border border-white/10'}`}>
                    {p.status}
                  </span>
                </div>
                <p className="text-[8px] font-mono text-[#6F7C89] mt-1">v{p.version} · {p.category} · Approved: {p.approvedBy || '—'}</p>
                <div className="flex gap-1 mt-1.5">
                  {p.tags?.map((t: string) => (
                    <span key={t} className="text-[7px] font-mono px-1 py-0.5 border border-white/10 text-[#6F7C89]">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>

      {/* Policy Detail Dialog */}
      <Dialog open={!!viewPolicy} onOpenChange={() => setViewPolicy(null)}>
        <DialogContent className="max-w-2xl p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider text-sm">{viewPolicy?.title}</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">v{viewPolicy?.version} · {viewPolicy?.category} · {viewPolicy?.status}</DialogDescription>
          <div className="space-y-3 mt-4">
            <div className="flex gap-2 text-[9px] font-mono">
              <span className="px-2 py-1 border border-white/10 text-[#6F7C89]">Approved by: {viewPolicy?.approvedBy || '—'}</span>
              <span className="px-2 py-1 border border-white/10 text-[#6F7C89]">Effective: {viewPolicy?.effectiveDate ? new Date(viewPolicy.effectiveDate).toLocaleDateString() : '—'}</span>
            </div>
            <div className="p-3 border border-white/5 text-[10px] font-mono text-[#6F7C89] leading-relaxed" style={{ background: 'rgba(0,0,0,0.4)', minHeight: 100 }}>
              {viewPolicy?.content || 'No content'}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
