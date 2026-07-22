'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Search, Bug, Shield, Radio, Globe, LayoutDashboard, ShieldOff, Brain, Bell, Users, Radar, Settings } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';

const SEARCH_ITEMS = [
  { labelKey: 'sidebar.executiveView', href: '/dashboard', icon: LayoutDashboard },
  { labelKey: 'sidebar.attackSurface', href: '/dashboard/attack-surface', icon: Shield },
  { labelKey: 'sidebar.vulnerabilities', href: '/dashboard/vulnerabilities', icon: Bug },
  { labelKey: 'sidebar.threatIntel', href: '/dashboard/threat-intel', icon: Radio },
  { labelKey: 'sidebar.brandProtection', href: '/dashboard/brand-protection', icon: Globe },
  { labelKey: 'sidebar.actionMitigation', href: '/dashboard/action-mitigation', icon: ShieldOff },
  { labelKey: 'sidebar.tprm', href: '/dashboard/tprm', icon: Users },
  { labelKey: 'sidebar.warRoom', href: '/dashboard/war-room', icon: Radar },
  { labelKey: 'sidebar.notifications', href: '/dashboard/notifications', icon: Bell },
  { labelKey: 'sidebar.aiInsights', href: '/dashboard/ai-insights', icon: Brain },
  { labelKey: 'sidebar.settings', href: '/dashboard/settings', icon: Settings },
];

export function CommandPalette() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Ctrl+K toggle
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter(item => t(item.labelKey).toLowerCase().includes(query.toLowerCase()))
    : SEARCH_ITEMS;

  const handleSelect = useCallback((href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg p-0" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
          <Search className="h-4 w-4 text-[#6F7C89] shrink-0" />
          <input
            autoFocus
            placeholder={t('common.searchPages')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 text-xs font-mono text-white bg-transparent outline-none placeholder:text-[#6F7C89]"
          />
          <kbd className="text-[9px] font-mono text-[#6F7C89] border border-[rgba(255,255,255,0.08)] px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => handleSelect(item.href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(0,246,255,0.05)]"
              >
                <Icon className="h-4 w-4 text-[#00F6FF]" />
                <span className="text-xs font-mono text-white">{t(item.labelKey)}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-[10px] font-mono text-[#6F7C89]">{t('common.noResults')}</div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.08)] text-[9px] font-mono text-[#6F7C89] flex items-center gap-3">
          <span><kbd className="border border-[rgba(255,255,255,0.08)] px-1">↑↓</kbd> Navigate</span>
          <span><kbd className="border border-[rgba(255,255,255,0.08)] px-1">↵</kbd> Open</span>
          <span className="ml-auto"><kbd className="border border-[rgba(255,255,255,0.08)] px-1">Ctrl+K</kbd> Toggle</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
