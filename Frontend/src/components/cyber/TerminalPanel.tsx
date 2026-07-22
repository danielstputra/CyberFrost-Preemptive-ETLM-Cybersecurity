'use client';

import { useState, useEffect } from 'react';

interface TerminalPanelProps {
  lines: string[];
  className?: string;
  title?: string;
}

export function TerminalPanel({ lines, className = '', title = 'TERMINAL' }: TerminalPanelProps) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    if (visible < lines.length) {
      const t = setTimeout(() => setVisible(v => v + 1), 300);
      return () => clearTimeout(t);
    }
  }, [visible, lines.length]);

  return (
    <div className={`border border-white/5 bg-[rgba(5,5,5,0.8)] ${className}`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5">
        <span className="w-2 h-2 rounded-full bg-[#FF003C]" />
        <span className="w-2 h-2 rounded-full bg-[#FCEE09]" />
        <span className="w-2 h-2 rounded-full bg-[#00FF41]" />
        <span className="ml-auto text-[8px] font-mono tracking-wider text-[#6F7C89] uppercase">{title}</span>
      </div>
      {/* Content */}
      <div className="p-3 font-mono text-[11px] leading-relaxed">
        {lines.slice(0, visible).map((line, i) => (
          <div key={i} className="text-[#B6C2CF]">
            <span className="text-[#6F7C89]">{'>'}</span> {line}
          </div>
        ))}
        {visible < lines.length && (
          <span className="inline-block w-2 h-3.5 bg-[#00F6FF] animate-pulse ml-1" />
        )}
      </div>
    </div>
  );
}
