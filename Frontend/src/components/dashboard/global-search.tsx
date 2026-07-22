'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bug, Radio, User, Shield } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface SearchResult {
  cveId?: string; title?: string; severity?: string; name?: string; threatType?: string;
}

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<{ vulnerabilities?: SearchResult[]; threats?: SearchResult[]; actors?: SearchResult[] }>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults({}); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/v1/search', { params: { q: query, type: 'all' } });
        setResults(res.data?.results || {});
        setOpen(true);
      } catch { setResults({}); }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const count = (results.vulnerabilities?.length || 0) + (results.threats?.length || 0) + (results.actors?.length || 0);

  return (
    <div ref={ref} className="relative w-full max-w-sm">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
      <input value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search CVEs, threats, actors..." className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-[rgba(5,5,5,0.6)] border border-white/5 text-white outline-none focus:border-[#00F6FF]/30 transition-colors" />

      {open && query.trim() && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 border border-[rgba(0,246,255,0.2)]" style={{ background: '#0B0F14', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          {loading ? (
            <div className="p-3 text-center text-[10px] font-mono text-[#6F7C89]">Searching...</div>
          ) : count === 0 ? (
            <div className="p-3 text-center text-[10px] font-mono text-[#6F7C89]">No results</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-[rgba(255,255,255,0.05)]">
              {results.vulnerabilities?.map((v, i) => (
                <button key={`vuln-${i}`} onClick={() => { router.push('/dashboard/vulnerabilities'); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-[rgba(0,246,255,0.05)]">
                  <div className="flex items-center gap-2">
                    <Bug className="h-3 w-3 text-[#00F6FF] shrink-0" />
                    <p className="text-[10px] font-mono text-white truncate">{v.cveId} — {v.title}</p>
                  </div>
                </button>
              ))}
              {results.threats?.map((t, i) => (
                <button key={`threat-${i}`} onClick={() => { router.push('/dashboard/threat-intel'); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-[rgba(0,246,255,0.05)]">
                  <div className="flex items-center gap-2">
                    <Radio className="h-3 w-3 text-[#FCEE09] shrink-0" />
                    <p className="text-[10px] font-mono text-white truncate">{t.title}</p>
                  </div>
                </button>
              ))}
              {results.actors?.map((a, i) => (
                <button key={`actor-${i}`} onClick={() => { router.push('/dashboard/threat-actors'); setOpen(false); }}
                  className="w-full text-left px-3 py-2 hover:bg-[rgba(0,246,255,0.05)]">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-[#FF003C] shrink-0" />
                    <p className="text-[10px] font-mono text-white truncate">{a.name}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
