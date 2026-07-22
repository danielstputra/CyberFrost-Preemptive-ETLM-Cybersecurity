'use client';

import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MitreBadgeProps {
  techniqueId: string;
  techniqueName: string;
  tactic?: string;
}

export function MitreBadge({ techniqueId, techniqueName, tactic }: MitreBadgeProps) {
  const badge = (
    <Badge
      className="font-mono text-[10px] tracking-wider cursor-help"
      style={{
        background: 'rgba(255,0,255,0.12)',
        color: '#FF00FF',
        border: '1px solid rgba(255,0,255,0.35)',
        boxShadow: '0 0 6px rgba(255,0,255,0.2)',
      }}
    >
      {techniqueId}
    </Badge>
  );

  if (!techniqueName && !tactic) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="cursor-help inline-block">{badge}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs px-3 py-2 text-xs font-mono"
          style={{
            background: '#0B0F14',
            border: '1px solid rgba(255,0,255,0.3)',
            color: '#fff',
          }}
        >
          <p className="text-[#FF00FF] font-bold tracking-wide">{techniqueId}</p>
          <p className="text-white text-[11px] mt-0.5">{techniqueName}</p>
          {tactic && (
            <p className="text-[#6F7C89] text-[10px] mt-1">
              Tactic: <span className="text-[#00F6FF]">{tactic}</span>
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
