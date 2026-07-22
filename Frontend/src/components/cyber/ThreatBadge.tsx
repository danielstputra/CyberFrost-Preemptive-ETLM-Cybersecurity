'use client';

interface ThreatBadgeProps {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  children?: string;
}

const config = {
  LOW: { bg: 'rgba(0,246,255,0.1)', text: '#00F6FF', border: 'rgba(0,246,255,0.3)', pulse: false },
  MEDIUM: { bg: 'rgba(252,238,9,0.1)', text: '#FCEE09', border: 'rgba(252,238,9,0.3)', pulse: false },
  HIGH: { bg: 'rgba(255,0,60,0.1)', text: '#FF003C', border: 'rgba(255,0,60,0.3)', pulse: true },
  CRITICAL: { bg: 'rgba(255,0,60,0.15)', text: '#FF003C', border: 'rgba(255,0,60,0.5)', pulse: true },
};

export function ThreatBadge({ level, children }: ThreatBadgeProps) {
  const c = config[level] || config.LOW;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase angle-sm ${c.pulse ? 'warning-flash' : ''}`}
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {children || level}
    </span>
  );
}
