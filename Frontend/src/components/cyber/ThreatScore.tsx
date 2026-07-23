/**
 * ThreatScore — Circular Gauge + Radar Breakdown
 * ===============================================
 * Enterprise-grade threat score visualization.
 *
 * Usage:
 *   <ThreatScore score={87} level="CRITICAL" action="IMMEDIATE"
 *     breakdown={{ exploitability: 72, impact: 90, threatIntel: 45, recency: 80, context: 60 }} />
 */

'use client';

import { motion } from 'framer-motion';

// ──────────────────────────────────────
// Types
// ──────────────────────────────────────

export type ScoreLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendedAction = 'MONITOR' | 'REVIEW' | 'PATCH' | 'ESCALATE' | 'IMMEDIATE';

interface ScoreBreakdown {
  exploitability: number;
  impact: number;
  threatIntel: number;
  recency: number;
  context: number;
}

interface ThreatScoreProps {
  score: number;
  level: ScoreLevel;
  action?: RecommendedAction;
  breakdown?: ScoreBreakdown;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// ──────────────────────────────────────
// Constants
// ──────────────────────────────────────

const LEVEL_CONFIG: Record<ScoreLevel, { text: string; color: string; ring: string; bg: string }> = {
  LOW:      { text: 'LOW', color: '#6F7C89', ring: '#6F7C89', bg: 'rgba(111,124,137,0.15)' },
  MEDIUM:   { text: 'MEDIUM', color: '#FCEE09', ring: '#FCEE09', bg: 'rgba(252,238,9,0.15)' },
  HIGH:     { text: 'HIGH', color: '#FF8C00', ring: '#FF8C00', bg: 'rgba(255,140,0,0.15)' },
  CRITICAL: { text: 'CRITICAL', color: '#FF003C', ring: '#FF003C', bg: 'rgba(255,0,60,0.15)' },
};

const ACTION_LABELS: Record<RecommendedAction, string> = {
  MONITOR: 'Monitor',
  REVIEW: 'Review',
  PATCH: 'Patch',
  ESCALATE: 'Escalate',
  IMMEDIATE: 'Immediate',
};

const SCORE_DESC: Record<ScoreLevel, string> = {
  LOW: 'No immediate threat detected. Continue monitoring.',
  MEDIUM: 'Potential risk. Schedule a review.',
  HIGH: 'Significant threat. Prompt action recommended.',
  CRITICAL: 'Critical threat. Immediate action required.',
};

const BREAKDOWN_LABELS: Record<keyof ScoreBreakdown, string> = {
  exploitability: 'Exploitability',
  impact: 'Impact',
  threatIntel: 'Intel Feed',
  recency: 'Recency',
  context: 'Asset Context',
};

// ──────────────────────────────────────
// Gauge (Circular Progress)
// ──────────────────────────────────────

function Gauge({ score, level, size = 'md' }: { score: number; level: ScoreLevel; size?: string }) {
  const cfg = LEVEL_CONFIG[level];
  const radius = size === 'sm' ? 36 : size === 'lg' ? 60 : 48;
  const stroke = size === 'sm' ? 5 : size === 'lg' ? 8 : 6;
  const normalized = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;
  const fontSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-3xl' : 'text-xl';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={(radius + stroke) * 2} height={(radius + stroke) * 2} className="-rotate-90">
        {/* Background ring */}
        <circle cx={radius + stroke} cy={radius + stroke} r={radius}
          fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {/* Score ring */}
        <motion.circle cx={radius + stroke} cy={radius + stroke} r={radius}
          fill="none" stroke={cfg.ring} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 6px ${cfg.ring})` }} />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className={`font-bold font-mono ${fontSize} tracking-tight`}
          style={{ color: cfg.color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        >{normalized}</motion.span>
        <span className="text-[8px] font-mono text-[#6F7C89] mt-[-2px]">/ 100</span>
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Radar Bar (Single breakdown bar)
// ──────────────────────────────────────

function RadarBar({ label, value, index }: { label: string; value: number; index: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[9px] font-mono">
        <span className="text-[#6F7C89]">{label}</span>
        <span className="text-white">{pct}</span>
      </div>
      <div className="h-1.5 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: index < 2 ? '#FF003C' : index < 4 ? '#FCEE09' : '#00F6FF' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.3 + index * 0.1, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────
// Main Component
// ──────────────────────────────────────

export function ThreatScore({ score, level, action, breakdown, size = 'md', className = '' }: ThreatScoreProps) {
  const cfg = LEVEL_CONFIG[level];
  const isLarge = size === 'lg';

  return (
    <motion.div
      className={`rounded-lg border p-4 ${className}`}
      style={{ background: cfg.bg, borderColor: `${cfg.ring}33` }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className={`flex ${isLarge ? 'flex-col items-center gap-4' : 'items-start gap-4'}`}>
        {/* Gauge */}
        <div className="shrink-0">
          <Gauge score={score} level={level} size={size} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color: cfg.color }}>
              {cfg.text}
            </span>
            {action && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: cfg.bg, color: cfg.color }}>
                ↓ {ACTION_LABELS[action]}
              </span>
            )}
          </div>
          <p className="text-[10px] font-mono text-[#6F7C89] leading-relaxed">
            {SCORE_DESC[level]}
          </p>

          {/* Breakdown bars */}
          {breakdown && (
            <div className="mt-2 space-y-1.5">
              {(Object.keys(BREAKDOWN_LABELS) as (keyof ScoreBreakdown)[]).map((key, i) => (
                <RadarBar key={key} label={BREAKDOWN_LABELS[key]} value={breakdown[key]} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────
// Compact Badge (for tables / lists)
// ──────────────────────────────────────

export function ThreatScoreBadge({ score, level, size = 'sm' }: { score: number; level: ScoreLevel; size?: 'sm' | 'xs' }) {
  const cfg = LEVEL_CONFIG[level];
  const dim = size === 'xs' ? 'w-6 h-6 text-[7px]' : 'w-8 h-8 text-[9px]';

  return (
    <div
      className={`${dim} rounded-full flex items-center justify-center font-mono font-bold border`}
      style={{
        background: cfg.bg,
        borderColor: `${cfg.ring}44`,
        color: cfg.color,
        boxShadow: `0 0 8px ${cfg.ring}22`,
      }}
      title={`${score}/100 - ${level}`}
    >
      {score}
    </div>
  );
}
