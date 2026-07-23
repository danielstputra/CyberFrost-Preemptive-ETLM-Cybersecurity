'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { CyberSelect } from '@/components/cyber/CyberSelect';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Terminal, Clock, AlertTriangle, CheckCircle, Users, TrendingDown, Activity, Shield } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function SocOperationsPage() {
  const qc = useQueryClient();
  const [showShift, setShowShift] = useState(false);
  const [shiftForm, setShiftForm] = useState({ officerOutgoing: '', officerIncoming: '', shiftType: 'PAGI', notes: '', ongoingIssues: '', pendingTakedowns: 0, criticalAlerts: 0 });

  const { data: dash } = useQuery({
    queryKey: ['soc-dashboard'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/soc/dashboard'); return r.data; },
    refetchInterval: 30000,
  });

  const { data: shifts } = useQuery({
    queryKey: ['soc-shifts'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/action/soc/shift'); return r.data; },
  });

  const createShift = useMutation({
    mutationFn: async () => apiClient.post('/api/v1/action/soc/shift', shiftForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['soc-shifts'] }); setShowShift(false); },
  });

  const m = dash?.metrics || {};
  const slaPct = m.totalResolved > 0 ? ((1 - (m.slaBreaches || 0) / m.totalResolved) * 100).toFixed(1) : '100';

  const METRICS = [
    { label: 'MTTR (Mean Time to Resolve)', value: `${m.mttr || 0} min`, icon: Clock, color: m.mttr > 240 ? '#FF003C' : '#00F6FF' },
    { label: 'MTTC (Mean Time to Confirm)', value: `${m.mttc || 0} min`, icon: TrendingDown, color: '#00F6FF' },
    { label: 'Open Incidents', value: m.openIncidents || 0, icon: AlertTriangle, color: (m.openIncidents || 0) > 10 ? '#FCEE09' : '#00FF41' },
    { label: 'SLA Compliance', value: `${slaPct}%`, icon: CheckCircle, color: parseFloat(slaPct) > 95 ? '#00FF41' : '#FCEE09' },
    { label: 'Active Blocks', value: m.activeBlocks || 0, icon: Shield, color: '#00F6FF' },
    { label: 'Resolved (30d)', value: m.totalResolved || 0, icon: Activity, color: '#00FF41' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
        <Terminal className="h-5 w-5 text-[#00F6FF]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">SOC Operations</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; Security Operations Center — MTTR, SLA & Shift Management</p>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <motion.div variants={itemAnim} className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {METRICS.map((s, i) => (
          <HUDCard key={s.label} accent="cyan" delay={i * 0.05}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[8px] font-mono tracking-[0.15em] text-[#6F7C89] uppercase">{s.label}</p>
                <p className="mt-0.5 text-xl font-bold font-mono text-white" style={{ color: s.color }}>{s.value}</p>
              </div>
              <s.icon className="h-4 w-4 opacity-40" style={{ color: s.color }} />
            </div>
          </HUDCard>
        ))}
      </motion.div>

      {/* SLA Thresholds + Recent Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemAnim}>
          <HUDCard title="SLA Thresholds" accent="cyan" icon={<Clock className="h-3.5 w-3.5" />}>
            <div className="space-y-2">
              {[
                { severity: 'CRITICAL', sla: '1 hour', color: '#FF003C' },
                { severity: 'HIGH', sla: '4 hours', color: '#FCEE09' },
                { severity: 'MEDIUM', sla: '24 hours', color: '#00F6FF' },
                { severity: 'LOW', sla: '72 hours', color: '#00FF41' },
              ].map(s => (
                <div key={s.severity} className="flex items-center justify-between p-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                    <span className="text-[10px] font-mono text-white">{s.severity}</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#6F7C89]">{s.sla}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/5">
                <p className="text-[8px] font-mono text-[#6F7C89] uppercase tracking-wider">SLA Breaches (30d)</p>
                <p className="text-lg font-mono font-bold" style={{ color: (m.slaBreaches || 0) > 0 ? '#FF003C' : '#00FF41' }}>{m.slaBreaches || 0}</p>
              </div>
            </div>
          </HUDCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <HUDCard title="Recent Alerts" accent="cyan" icon={<AlertTriangle className="h-3.5 w-3.5" />}>
            {dash?.recentAlerts?.length === 0 && (
              <div className="py-6 text-center text-[10px] font-mono text-[#6F7C89]">No active alerts</div>
            )}
            <div className="space-y-1">
              {dash?.recentAlerts?.slice(0, 8).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between p-1.5 border border-white/5 text-[10px] font-mono">
                  <span className="truncate text-white flex-1">{a.title.replace(/https?:\/\//, '')}</span>
                  <span className="text-[#FCEE09] shrink-0 ml-2">{a.type}</span>
                </div>
              ))}
            </div>
          </HUDCard>
        </motion.div>
      </div>

      {/* Shift Handover */}
      <motion.div variants={itemAnim}>
        <HUDCard title="Shift Handover Log" accent="cyan" icon={<Users className="h-3.5 w-3.5" />}>
          <div className="flex justify-end mb-3">
            <HUDButton variant="cyan" size="sm" onClick={() => setShowShift(true)}>
              <Users className="h-3.5 w-3.5" /> New Handover
            </HUDButton>
          </div>
          {shifts?.data?.length === 0 && (
            <div className="py-6 text-center text-[10px] font-mono text-[#6F7C89]">No shift handover records yet</div>
          )}
          <div className="space-y-2">
            {shifts?.data?.slice(0, 10).map((s: any) => (
              <div key={s._id} className="flex items-center justify-between p-2 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-mono text-white">
                    {s.officerOutgoing} → {s.officerIncoming}
                  </p>
                  <p className="text-[8px] font-mono text-[#6F7C89]">
                    {s.shiftType} · {new Date(s.shiftDate).toLocaleDateString()} · {s.pendingTakedowns} pending
                  </p>
                </div>
                <span className={`text-[8px] font-mono px-1.5 py-0.5 ${s.status === 'ACTIVE' ? 'text-[#FCEE09] border border-[#FCEE09]/30' : 'text-[#00FF41] border border-[#00FF41]/30'}`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>

      {/* New Shift Dialog */}
      <Dialog open={showShift} onOpenChange={setShowShift}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          <DialogTitle className="font-mono text-[#00F6FF] tracking-wider text-sm">New Shift Handover</DialogTitle>
          <DialogDescription className="font-mono text-[10px] text-[#6F7C89]">Record shift change details</DialogDescription>
          <div className="space-y-3 mt-4">
            <input placeholder="Outgoing officer" value={shiftForm.officerOutgoing} onChange={e => setShiftForm({...shiftForm, officerOutgoing: e.target.value})}
              className="w-full px-3 py-2 text-[10px] font-mono border outline-none" style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
            <input placeholder="Incoming officer" value={shiftForm.officerIncoming} onChange={e => setShiftForm({...shiftForm, officerIncoming: e.target.value})}
              className="w-full px-3 py-2 text-[10px] font-mono border outline-none" style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
            <CyberSelect options={[
              { value: 'PAGI', label: 'PAGI (06:00-14:00)' },
              { value: 'SIANG', label: 'SIANG (14:00-22:00)' },
              { value: 'MALAM', label: 'MALAM (22:00-06:00)' },
              { value: 'CUSTOM', label: 'CUSTOM' },
            ]} value={shiftForm.shiftType} onChange={v => setShiftForm({...shiftForm, shiftType: v})} placeholder="Shift type" />
            <textarea placeholder="Notes / remarks" value={shiftForm.notes} onChange={e => setShiftForm({...shiftForm, notes: e.target.value})} rows={3}
              className="w-full px-3 py-2 text-[10px] font-mono border outline-none resize-none" style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
            <div className="flex gap-2">
              <input type="number" placeholder="Pending takedowns" value={shiftForm.pendingTakedowns} onChange={e => setShiftForm({...shiftForm, pendingTakedowns: parseInt(e.target.value || '0')})}
                className="w-full px-3 py-2 text-[10px] font-mono border outline-none" style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
              <input type="number" placeholder="Critical alerts" value={shiftForm.criticalAlerts} onChange={e => setShiftForm({...shiftForm, criticalAlerts: parseInt(e.target.value || '0')})}
                className="w-full px-3 py-2 text-[10px] font-mono border outline-none" style={{ background: 'rgba(5,5,5,0.6)', borderColor: 'rgba(255,255,255,0.05)', color: 'white' }} />
            </div>
            <HUDButton variant="cyan" size="sm" className="w-full" onClick={() => createShift.mutate()} loading={createShift.isPending}>
              <Users className="h-3.5 w-3.5" /> Submit Handover
            </HUDButton>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

