'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Search, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ScanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scanType: 'discovery' | 'osint';
  onStartScan: (target: string, scanType?: string) => Promise<void>;
  scanStatus: { status: string; progress: number; jobId?: string };
}

export function ScanDialog({ open, onOpenChange, scanType, onStartScan, scanStatus }: ScanDialogProps) {
  const [target, setTarget] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const isDiscovery = scanType === 'discovery';
  const title = isDiscovery ? 'New Discovery Scan' : 'New OSINT Scan';
  const desc = isDiscovery
    ? 'Enter a domain to scan for subdomains, open ports, and technologies.'
    : 'Enter a domain or company name to search for dark web leaks and brand impersonation.';
  const placeholder = isDiscovery ? 'example.com' : 'example.com or company name';

  useEffect(() => {
    if (scanStatus.status === 'COMPLETED') { setIsScanning(false); setLastResult('completed'); }
    else if (scanStatus.status === 'FAILED') { setIsScanning(false); setLastResult('failed'); }
  }, [scanStatus.status]);

  const handleSubmit = async () => {
    if (!target.trim() || isScanning) return;
    setIsScanning(true); setLastResult(null);
    await onStartScan(target.trim(), isDiscovery ? undefined : 'DOMAIN');
  };

  const handleClose = () => {
    if (isScanning) return;
    setTarget(''); setLastResult(null); onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
        <DialogTitle className="font-mono text-[#00F6FF] tracking-wider">{title}</DialogTitle>
        <DialogDescription className="font-mono text-[10px] text-[#6F7C89] mt-1">{desc}</DialogDescription>

        <div className="mt-4 space-y-4">
          {!isScanning && !lastResult && (
            <div className="flex gap-2">
              <Input placeholder={placeholder} value={target}
                onChange={e => setTarget(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="cyber-input flex-1" />
              <HUDButton variant="yellow" size="md" onClick={handleSubmit} disabled={!target.trim()}>
                <Search className="h-3.5 w-3.5" /> Scan
              </HUDButton>
            </div>
          )}

          {isScanning && (
            <div className="space-y-3 py-4 text-center">
              <Loader2 className="mx-auto h-8 w-8 text-[#00F6FF] animate-spin" />
              <p className="text-sm font-mono text-white">Scanning {target}...</p>
              <div className="h-2 w-full bg-white/5">
                <div className="h-full bg-[#00F6FF] transition-all" style={{ width: `${scanStatus.progress || 10}%` }} />
              </div>
              <p className="text-[10px] font-mono text-[#6F7C89]">{scanStatus.progress || 10}% complete</p>
            </div>
          )}

          {lastResult === 'completed' && !isScanning && (
            <div className="space-y-3 py-4 text-center">
              <CheckCircle className="mx-auto h-10 w-10 text-[#00FF41]" />
              <p className="font-mono font-bold text-[#00FF41]">Scan Completed</p>
              <p className="text-[10px] font-mono text-[#6F7C89]">Results will appear in the table below.</p>
            </div>
          )}

          {lastResult === 'failed' && !isScanning && (
            <div className="space-y-3 py-4 text-center">
              <XCircle className="mx-auto h-10 w-10 text-[#FF003C]" />
              <p className="font-mono font-bold text-[#FF003C]">Scan Failed</p>
              <p className="text-[10px] font-mono text-[#6F7C89]">An error occurred. Please try again.</p>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          {!isScanning && (
            <HUDButton variant="cyan" size="sm" onClick={handleClose}>
              {lastResult ? 'Close' : 'Cancel'}
            </HUDButton>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
