'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Brain, AlertTriangle, Shield, Terminal, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface ThreatAnalysis {
  summary: string;
  attack_scenario: string;
  mitigation_steps: string[];
}

function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    const interval = setInterval(() => {
      if (idxRef.current < text.length) {
        setDisplayed(text.slice(0, idxRef.current + 1));
        idxRef.current++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return <span>{displayed}{idxRef.current < text.length && <span className="animate-pulse text-[#00F6FF]">▌</span>}</span>;
}

const PRESET_INPUTS = [
  { label: 'Analyze CVE', sourceType: 'VULNERABILITY' as const, data: { cveId: 'CVE-2026-10001', score: 9.8, description: 'Remote code execution vulnerability in widely used enterprise software.' } },
  { label: 'Check Dark Web Leak', sourceType: 'DARK_WEB_LEAK' as const, data: { domain: 'example.com', records: 1500, containsCredentials: true, source: 'darkweb-forum' } },
  { label: 'Analyze Threat Intel', sourceType: 'THREAT_INTEL' as const, data: { campaign: 'APT-C-35', targetSector: 'Government', indicators: 12, mitreId: 'T1566' } },
];

export function AIThreatAnalyst() {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<ThreatAnalysis | null>(null);

  const mutation = useMutation({
    mutationFn: async (payload: { sourceType: string; data: Record<string, unknown> }) => {
      const res = await apiClient.post('/api/v1/ai/analyze-threat', payload);
      return res.data as ThreatAnalysis & { id: string };
    },
    onSuccess: (data) => setAnalysis(data),
  });

  const handleClose = () => {
    setOpen(false);
    setAnalysis(null);
    mutation.reset();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative p-1.5 text-[#6F7C89] hover:text-[#FCEE09] transition-colors cursor-pointer" title="AI Threat Analyzer">
        <Brain className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl p-0" style={{ background: '#0B0F14', border: '1px solid rgba(252,238,9,0.2)' }}>
          <div className="border-b border-[rgba(255,255,255,0.08)] px-4 py-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#FCEE09]" />
            <DialogTitle className="text-xs font-mono font-bold text-[#FCEE09] tracking-wider uppercase">AI Threat Analyzer</DialogTitle>
            <DialogDescription className="sr-only">Analyze security threats using AI</DialogDescription>
          </div>

          <div className="p-4 space-y-4">
            {/* Preset buttons */}
            {!mutation.isPending && !analysis && (
              <div className="grid gap-2 sm:grid-cols-3">
                {PRESET_INPUTS.map((p) => (
                  <button key={p.label} onClick={() => mutation.mutate(p)}
                    className="text-left px-3 py-2 border border-white/5 hover:border-[#FCEE09]/30 text-[10px] font-mono text-[#B6C2CF] hover:text-white transition-all"
                    style={{ background: 'rgba(5,5,5,0.4)' }}>
                    <Terminal className="h-3 w-3 text-[#FCEE09] inline mr-1.5" />{p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Loading */}
            {mutation.isPending && (
              <div className="flex flex-col items-center py-8 space-y-3">
                <Loader2 className="h-8 w-8 text-[#FCEE09] animate-spin" />
                <p className="text-[10px] font-mono text-[#6F7C89]">AI is analyzing threat data...</p>
                <div className="h-1 w-48 bg-white/5 overflow-hidden">
                  <motion.div className="h-full bg-[#FCEE09]" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                </div>
              </div>
            )}

            {/* Analysis result with typewriter */}
            {analysis && (
              <div className="space-y-4 font-mono">
                {/* Summary */}
                <div className="border border-[rgba(0,246,255,0.15)] p-3" style={{ background: 'rgba(0,246,255,0.03)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-[#FCEE09]" />
                    <span className="text-[10px] font-bold text-[#FCEE09] tracking-wider uppercase">Threat Summary</span>
                  </div>
                  <p className="text-[11px] text-[#B6C2CF] leading-relaxed">
                    <TypewriterText text={analysis.summary} speed={20} />
                  </p>
                </div>

                {/* Attack Scenario */}
                <div className="border border-[rgba(255,0,60,0.15)] p-3" style={{ background: 'rgba(255,0,60,0.03)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className="h-3.5 w-3.5 text-[#FF003C]" />
                    <span className="text-[10px] font-bold text-[#FF003C] tracking-wider uppercase">Attack Scenario</span>
                  </div>
                  <p className="text-[11px] text-[#B6C2CF] leading-relaxed">
                    <TypewriterText text={analysis.attack_scenario} speed={25} />
                  </p>
                </div>

                {/* Mitigation Steps */}
                <div className="border border-[rgba(0,246,255,0.15)] p-3" style={{ background: 'rgba(0,246,255,0.03)' }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Shield className="h-3.5 w-3.5 text-[#00FF41]" />
                    <span className="text-[10px] font-bold text-[#00FF41] tracking-wider uppercase">Mitigation Steps</span>
                  </div>
                  <ol className="space-y-1.5">
                    {analysis.mitigation_steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-[11px] text-[#B6C2CF]">
                        <span className="text-[#00FF41] font-bold shrink-0">{i + 1}.</span>
                        <TypewriterText text={step} speed={15} />
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-[8px] font-mono text-[#6F7C89]">Powered by Google Gemini</span>
                  <HUDButton variant="cyan" size="sm" onClick={handleClose}>Close</HUDButton>
                </div>
              </div>
            )}

            {mutation.isError && (
              <div className="border border-[#FF003C] p-3 text-[10px] font-mono text-[#FF003C]">
                !&gt; Analysis failed: {(mutation.error as any)?.message || 'Unknown error'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
