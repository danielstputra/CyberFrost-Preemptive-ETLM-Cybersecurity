'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HelpCircle, ChevronRight, BookOpen } from 'lucide-react';

interface Step {
  title: string;
  desc: string;
}

interface FeatureGuideProps {
  title: string;
  steps: Step[];
  video?: string;
}

export function FeatureGuide({ title, steps, video }: FeatureGuideProps) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  // Show guide automatically on first visit (stored in localStorage)
  useEffect(() => {
    const key = `guide_${title.replace(/\s+/g, '_')}`;
    const seen = localStorage.getItem(key);
    if (!seen) {
      // Don't auto-open on first visit to avoid annoyance
      localStorage.setItem(key, 'true');
    }
  }, [title]);

  const handleDismiss = () => {
    setOpen(false);
    setDismissed(true);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="relative p-1.5 text-[#6F7C89] hover:text-[#00F6FF] transition-colors cursor-pointer" title={`Guide: ${title}`}>
          <HelpCircle className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 p-0 border border-[rgba(0,246,255,0.2)]"
        style={{ background: '#0B0F14' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
          <BookOpen className="h-4 w-4 text-[#00F6FF]" />
          <span className="text-xs font-mono font-bold text-[#00F6FF] tracking-wider uppercase">
            {title}
          </span>
        </div>

        {/* Steps */}
        <div className="px-4 py-3 space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="flex items-center justify-center w-5 h-5 mt-0.5 rounded-full bg-[rgba(0,246,255,0.1)] text-[#00F6FF] text-[9px] font-mono font-bold shrink-0">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-mono font-bold text-white">{step.title}</p>
                <p className="text-[9px] font-mono text-[#6F7C89] mt-0.5 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.08)]">
          <button
            onClick={handleDismiss}
            className="w-full text-left text-[9px] font-mono text-[#6F7C89] hover:text-[#00F6FF] transition-colors"
          >
            ✓ Got it
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
