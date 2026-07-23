'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { ThreatScoreBadge } from '@/components/cyber/ThreatScore';
import { Search, Globe, Terminal, Shield, Download, Upload, Filter } from 'lucide-react';
import type { ReactNode } from 'react';
import apiClient from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '@/lib/date';
import { ENDPOINTS } from '@/lib/constants';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const IOC_TYPES = ['ALL', 'IP', 'DOMAIN', 'URL', 'MD5', 'SHA1', 'SHA256', 'EMAIL'] as const;
const IOC_ICONS: Record<string, ReactNode> = {
  IP: <Globe className="h-3.5 w-3.5" />,
  DOMAIN: <Globe className="h-3.5 w-3.5" />,
  URL: <Globe className="h-3.5 w-3.5" />,
  MD5: <Terminal className="h-3.5 w-3.5" />,
  SHA1: <Terminal className="h-3.5 w-3.5" />,
  SHA256: <Terminal className="h-3.5 w-3.5" />,
  EMAIL: <Shield className="h-3.5 w-3.5" />,
};

interface IOCItem {
  _id: string;
  type: string;
  value: string;
  threatType: string;
  source: string;
  confidence: number;
  score?: { value: number; level: string };
  description?: string;
  lastSeen: string;
  firstSeen: string;
}

interface StatItem {
  _id: string;
  count: number;
}

export default function IOCExplorerPage() {
  const [type, setType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [lookupValue, setLookupValue] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['iocs', type, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', limit: '50', sortBy: 'lastSeen', sortOrder: 'desc' });
      if (type !== 'ALL') params.set('type', type);
      if (search) params.set('search', search);
      const res = await apiClient.get(`${ENDPOINTS.IOC_LIST || '/api/v1/intelligence/iocs'}?${params}`);
      return res.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['iocs-stats'],
    queryFn: async () => {
      const res = await apiClient.get(`${ENDPOINTS.IOC_STATS || '/api/v1/intelligence/iocs/stats'}`);
      return res.data;
    },
  });

  const handleLookup = async () => {
    if (!lookupValue) return;
    try {
      const res = await apiClient.post(`${ENDPOINTS.IOC_LOOKUP || '/api/v1/intelligence/iocs/lookup'}`, { value: lookupValue });
      setLookupResult(res.data);
    } catch {
      setLookupResult({ notFound: true, value: lookupValue });
    }
  };

  const handleExport = () => {
    window.open(`${ENDPOINTS.IOC_EXPORT || '/api/v1/intelligence/iocs/export/stix'}`, '_blank');
  };

  const items: IOCItem[] = data?.data || [];
  const byType: StatItem[] = stats?.byType || [];
  const totalIocs = stats?.total || 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
          <Terminal className="h-5 w-5 text-[#00F6FF]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">IOC Explorer</h1>
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">
              &gt; Threat intelligence indicators &bull; {totalIocs} total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <HUDButton variant="cyan" size="sm" onClick={handleExport}><Download className="h-3.5 w-3.5" /> STIX Export</HUDButton>
          <HUDButton variant="yellow" size="sm" onClick={() => document.getElementById('file-upload')?.click()}>
            <Upload className="h-3.5 w-3.5" /> Import STIX
          </HUDButton>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div variants={itemAnim} className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {IOC_TYPES.filter(t => t !== 'ALL').map(t => {
          const found = byType.find((s: any) => s._id === t);
          return (
            <button key={t} onClick={() => setType(t)}
              className={`flex items-center gap-2 px-3 py-2 rounded text-[10px] font-mono border transition-all ${
                type === t ? 'border-[#00F6FF] bg-[rgba(0,246,255,0.08)] text-[#00F6FF]' : 'border-white/5 text-[#6F7C89] hover:text-white'
              }`}>
              {IOC_ICONS[t]}
              <span>{t} <span className="text-[8px] opacity-50">({found?.count || 0})</span></span>
            </button>
          );
        })}
      </motion.div>

      {/* Lookup + Search */}
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
          <input placeholder="Search IOCs..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30" />
        </div>
        <div className="flex gap-2">
          <input placeholder="IP / domain / hash..." value={lookupValue} onChange={e => setLookupValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            className="w-48 px-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#FCEE09]/30" />
          <HUDButton variant="yellow" size="sm" onClick={handleLookup}><Filter className="h-3.5 w-3.5" /> Lookup</HUDButton>
        </div>
      </motion.div>

      {/* Lookup result */}
      {lookupResult && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="border-l-2 px-4 py-3 text-[10px] font-mono"
          style={{ borderColor: lookupResult.notFound ? '#FF003C' : '#00FF41', background: lookupResult.notFound ? 'rgba(255,0,60,0.05)' : 'rgba(0,255,65,0.05)' }}>
          {lookupResult.notFound ? (
            <span className="text-[#FF003C]">!&gt; IOC not found: {lookupResult.value}</span>
          ) : (
            <div className="flex items-center gap-4">
              <ThreatScoreBadge score={lookupResult.score?.value || 0} level={lookupResult.score?.level || 'LOW'} />
              <span className="text-[#00FF41] font-bold">{lookupResult.type}: {lookupResult.value}</span>
              <span className="text-[#6F7C89]">Source: {lookupResult.source}</span>
              <span className="text-[#FCEE09]">Confidence: {lookupResult.confidence}%</span>
            </div>
          )}
        </motion.div>
      )}

      {/* IOC Table */}
      <motion.div variants={itemAnim}>
        <HUDCard title="Indicators of Compromise" accent="cyan" icon={<Terminal className="h-3.5 w-3.5" />}>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr className="border-b border-white/5 text-[#6F7C89] uppercase tracking-wider">
                  <th className="text-left py-2 px-2">Type</th>
                  <th className="text-left py-2 px-2">Value</th>
                  <th className="text-left py-2 px-2 hidden sm:table-cell">Threat</th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">Source</th>
                  <th className="text-center py-2 px-2">Score</th>
                  <th className="text-right py-2 px-2 hidden md:table-cell">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-[#6F7C89]">Loading indicators...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-[#6F7C89]">No IOCs found</td></tr>
                ) : items.map((ioc, i) => (
                  <motion.tr key={ioc._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-2">
                      <span className="flex items-center gap-1.5 text-white">
                        {IOC_ICONS[ioc.type] || <Terminal className="h-3.5 w-3.5" />}
                        {ioc.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 max-w-[200px] truncate text-[#00F6FF]">{ioc.value}</td>
                    <td className="py-2.5 px-2 hidden sm:table-cell text-[#6F7C89]">{ioc.threatType}</td>
                    <td className="py-2.5 px-2 hidden md:table-cell text-[#6F7C89]">{ioc.source}</td>
                    <td className="py-2.5 px-2 text-center">
                      {ioc.score ? (
                        <ThreatScoreBadge score={ioc.score.value} level={ioc.score.level as any} size="xs" />
                      ) : (
                        <span className="text-[#6F7C89]">—</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#6F7C89] hidden md:table-cell">{formatDate(ioc.lastSeen)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </HUDCard>
      </motion.div>
    </motion.div>
  );
}
