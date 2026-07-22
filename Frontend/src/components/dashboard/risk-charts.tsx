'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';

const COLORS = { CRITICAL: '#FF003C', HIGH: '#FCEE09', MEDIUM: '#00F6FF', LOW: '#00FF41' };

export function SeverityBarChart() {
  const { data: intel } = useQuery<any>({
    queryKey: ['intel-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get(ENDPOINTS.INTEL_DASHBOARD);
      return res.data;
    },
  });

  const data = intel?.severityBreakdown
    ? Object.entries(intel.severityBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  if (!data.length) return null;

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap="20%">
          <XAxis dataKey="name" tick={{ fill: '#6F7C89', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6F7C89', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)', borderRadius: 0, fontSize: 11, fontFamily: 'monospace' }}
            labelStyle={{ color: '#00F6FF' }}
          />
          <Bar dataKey="value" radius={[0, 0, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || '#6F7C89'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Trend Chart (simulated) ──

const trendData = [
  { month: 'Feb', critical: 12, high: 28, medium: 45 },
  { month: 'Mar', critical: 8, high: 32, medium: 38 },
  { month: 'Apr', critical: 15, high: 25, medium: 42 },
  { month: 'May', critical: 10, high: 30, medium: 50 },
  { month: 'Jun', critical: 18, high: 22, medium: 35 },
  { month: 'Jul', critical: 7, high: 35, medium: 40 },
];

export function TrendLineChart() {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="month" tick={{ fill: '#6F7C89', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6F7C89', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)', borderRadius: 0, fontSize: 11, fontFamily: 'monospace' }}
            labelStyle={{ color: '#00F6FF' }}
          />
          <Line type="monotone" dataKey="critical" stroke="#FF003C" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="high" stroke="#FCEE09" strokeWidth={1.5} dot={false} />
          <Line type="monotone" dataKey="medium" stroke="#00F6FF" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
