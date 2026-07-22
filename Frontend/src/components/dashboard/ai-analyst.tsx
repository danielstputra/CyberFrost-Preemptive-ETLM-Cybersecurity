'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Terminal, Sparkles, AlertTriangle, Lightbulb } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

export function AIAnalystPanel() {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ai-insights-panel'],
    queryFn: async () => {
      const res = await apiClient.get('/api/v1/ai/insights?page=1&limit=5');
      return res.data;
    },
    enabled: open,
  });

  const insights = data?.data || [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative p-1.5 text-[#6F7C89] hover:text-[#FCEE09] transition-colors cursor-pointer" title="AI Threat Analyst">
        <Brain className="h-4 w-4" />
        {insights.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#FCEE09]">
            <span className="animate-ping absolute inset-0 rounded-full bg-[#FCEE09] opacity-40" />
          </span>
        )}
      </SheetTrigger>
      <SheetContent className="w-96 border-l border-[rgba(0,246,255,0.2)] p-0" style={{ background: '#0B0F14' }}>
        <SheetHeader className="border-b border-[rgba(255,255,255,0.08)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#FCEE09]" />
            <SheetTitle className="text-xs font-mono font-bold text-[#FCEE09] tracking-wider uppercase">AI Threat Analyst</SheetTitle>
          </div>
          <SheetDescription className="text-[9px] font-mono text-[#6F7C89] mt-0.5">
            AI-powered insights & recommendations
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 animate-pulse" />)}
            </div>
          ) : insights.length > 0 ? (
            insights.map((insight: any, i: number) => (
              <motion.div
                key={insight._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className="border border-white/5 p-3 hover:border-[#FCEE09]/30 transition-all"
                style={{ background: 'rgba(5,5,5,0.4)' }}
              >
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FCEE09]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-mono text-white line-clamp-1">{insight.title}</p>
                    <p className="text-[9px] font-mono text-[#6F7C89] mt-1 line-clamp-2">{insight.summary}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Badge variant="outline" className="text-[8px] font-mono text-[#00F6FF] border-[#00F6FF] rounded-none px-1 py-0">
                        {insight.insightType?.replace('_', ' ')}
                      </Badge>
                      <span className="text-[8px] font-mono text-[#6F7C89]">{formatDate(insight.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {insight.recommendations?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1 text-[8px] font-mono text-[#00FF41] mb-1">
                      <Lightbulb className="h-3 w-3" /> Recommendation
                    </div>
                    <p className="text-[9px] font-mono text-[#B6C2CF]">{insight.recommendations[0]}</p>
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">
              <Brain className="mx-auto h-8 w-8 mb-2 opacity-30" />
              <p>No AI insights yet</p>
              <p className="text-[8px] mt-1">Generate insights from the AI Insights page</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
