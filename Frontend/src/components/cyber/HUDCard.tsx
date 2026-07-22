'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface HUDCardProps {
  children: ReactNode;
  className?: string;
  accent?: 'cyan' | 'yellow' | 'red';
  title?: string;
  icon?: ReactNode;
  delay?: number;
}

export function HUDCard({ children, className = '', accent = 'cyan', title, icon, delay = 0 }: HUDCardProps) {
  const accentColors = {
    cyan: { stripe: '#00F6FF', glow: 'rgba(0,246,255,0.15)', text: '#00F6FF' },
    yellow: { stripe: '#FCEE09', glow: 'rgba(252,238,9,0.15)', text: '#FCEE09' },
    red: { stripe: '#FF003C', glow: 'rgba(255,0,60,0.15)', text: '#FF003C' },
  };
  const c = accentColors[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4, boxShadow: `0 8px 30px ${c.glow}` }}
      className={`relative overflow-hidden angle-md ${className}`}
      style={{
        background: 'rgba(18,20,25,0.92)',
        border: `1px solid rgba(0,246,255,0.15)`,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Left stripe */}
      <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: c.stripe, opacity: 0.7 }} />
      {/* Top line */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{
        background: `linear-gradient(90deg, transparent, ${c.stripe}40, transparent)`,
      }} />
      {/* Shine effect on hover */}
      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `linear-gradient(105deg, transparent 40%, ${c.stripe}08 50%, transparent 60%)`,
        }} />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: c.stripe }} />
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: c.stripe }} />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: c.stripe }} />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: c.stripe }} />

      {/* Title */}
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
          {icon && <span style={{ color: c.text }}>{icon}</span>}
          <span className="text-[10px] font-mono font-bold tracking-[0.15em] uppercase" style={{ color: c.text }}>{title}</span>
        </div>
      )}

      <div className="p-4">{children}</div>
    </motion.div>
  );
}
