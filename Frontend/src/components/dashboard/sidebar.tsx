'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';
import { useTranslation } from '@/providers/translation-provider';
import {
  LayoutDashboard,
  Shield,
  Bug,
  Radio,
  Search,
  ShieldOff,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

export function Sidebar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { sidebar, toggleSidebar } = useUiStore();
  const isCollapsed = sidebar === 'collapsed';

  const NAV_ITEMS = [
    { label: t('sidebar.executiveView'), href: '/dashboard', icon: LayoutDashboard },
    { label: t('sidebar.attackSurface'), href: '/dashboard/attack-surface', icon: Shield },
    { label: t('sidebar.vulnerabilities'), href: '/dashboard/vulnerabilities', icon: Bug },
    { label: t('sidebar.threatIntel'), href: '/dashboard/threat-intel', icon: Radio },
    { label: t('sidebar.brandProtection'), href: '/dashboard/brand-protection', icon: Search },
    { label: t('sidebar.actionMitigation'), href: '/dashboard/action-mitigation', icon: ShieldOff },
    { label: t('sidebar.settings'), href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* ── Logo ── */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <Shield className="h-6 w-6 text-primary" />
          {!isCollapsed && <span className="truncate">{APP_NAME}</span>}
        </Link>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                isCollapsed && 'justify-center px-2',
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── Collapse toggle ── */}
      <div className="border-t p-2">
        <button
          onClick={toggleSidebar}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
