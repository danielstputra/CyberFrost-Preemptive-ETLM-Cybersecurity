'use client';

import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Terminal, FileText, Download, Calendar, Clock, FileSpreadsheet } from 'lucide-react';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function ReportsPage() {
  const { data: dash } = useQuery({
    queryKey: ['reports-dash'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/reports/dashboard'); return r.data; },
  });
  const { data: templates } = useQuery({
    queryKey: ['reports-templates'],
    queryFn: async () => { const r = await apiClient.get('/api/v1/reports/templates'); return r.data; },
  });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
        <FileText className="h-5 w-5 text-[#00F6FF]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">Enterprise Reports</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; Executive Summaries, Compliance Reports & Scheduled Delivery</p>
        </div>
      </motion.div>

      <motion.div variants={itemAnim} className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <HUDCard accent="cyan"><div className="text-center"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Templates</p><p className="text-2xl font-bold font-mono text-white">{dash?.templates || 0}</p></div></HUDCard>
        <HUDCard accent="yellow"><div className="text-center"><p className="text-[9px] font-mono text-[#6F7C89] uppercase">Scheduled</p><p className="text-2xl font-bold font-mono text-[#00FF41]">{dash?.scheduled || 0}</p></div></HUDCard>
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title="Report Templates" accent="cyan" icon={<FileText className="h-3.5 w-3.5" />}>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates?.data?.map((t: any) => (
              <div key={t._id} className="p-3 border border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-mono font-bold text-white">{t.name}</p>
                  <span className="text-[8px] font-mono text-[#00F6FF]">{t.type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-[8px] font-mono text-[#6F7C89]">
                  <Calendar className="h-3 w-3" /> {t.config.dateRange.replace(/_/g, ' ')}
                  {t.schedule?.enabled && <><Clock className="h-3 w-3 ml-2" /> {t.schedule.frequency} at {t.schedule.time}</>}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {t.config.formats?.map((f: string) => (
                    <span key={f} className="flex items-center gap-1 text-[8px] font-mono text-[#6F7C89] border border-white/10 px-1.5 py-0.5">
                      {f === 'PDF' ? <FileText className="h-2.5 w-2.5" /> : <FileSpreadsheet className="h-2.5 w-2.5" />} {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </HUDCard>
      </motion.div>
    </motion.div>
  );
}
