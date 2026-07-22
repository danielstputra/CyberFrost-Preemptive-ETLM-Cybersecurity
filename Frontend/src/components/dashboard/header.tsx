'use client';

import { usePathname, useRouter } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-auth';
import { useUiStore } from '@/store/ui-store';
import { useSocket } from '@/providers/socket-provider';
import { useSocketSubscription } from '@/hooks/use-socket';
import { useNotifications, useUnreadCount, useMarkAllAsRead } from '@/hooks/use-notifications';
import { useEffect, useState, useCallback } from 'react';
import { Bell, LogOut, User, Terminal, Search, Brain, CheckCheck, Eye, ExternalLink } from 'lucide-react';
import { GlobalSearch } from '@/components/dashboard/global-search';
import { CommandPalette } from '@/components/dashboard/command-palette';
import { AIAnalystPanel } from '@/components/dashboard/ai-analyst';
import { AIThreatAnalyst } from '@/components/dashboard/ai-threat-analyst';
import { formatDate } from '@/lib/utils';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { useTranslation } from '@/providers/translation-provider';

export function DashboardHeader() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const logout = useLogout();
  const { lastNotification } = useSocket();
  const { notificationCount, setNotificationCount } = useUiStore();
  const { data: unreadData, refetch } = useUnreadCount();
  const { data: notifData } = useNotifications(1, 10);
  const markAllAsRead = useMarkAllAsRead();
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  // Play notification sound using Web Audio API
  const playNotifSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      // Two-tone chime: 880Hz then 1320Hz
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch { /* Audio not available */ }
  }, []);

  useSocketSubscription();

  useEffect(() => {
    if (lastNotification) {
      setNotificationCount(notificationCount + 1);
      refetch();
      playNotifSound();
    }
  }, [lastNotification]);
  useEffect(() => { if (unreadData?.unread !== undefined) setNotificationCount(unreadData.unread); }, [unreadData?.unread]);

  const segments = pathname.split('/').filter(Boolean);

  const getPathLabel = (href: string) => {
    const map: Record<string, string> = {
      '/dashboard': t('sidebar.executiveView'),
      '/dashboard/attack-surface': t('sidebar.attackSurface'),
      '/dashboard/vulnerabilities': t('sidebar.vulnerabilities'),
      '/dashboard/threat-intel': t('sidebar.threatIntel'),
      '/dashboard/brand-protection': t('sidebar.brandProtection'),
      '/dashboard/action-mitigation': t('sidebar.actionMitigation'),
      '/dashboard/settings': t('sidebar.settings'),
    };
    return map[href];
  };

  const breadcrumbs = segments.map((_, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = getPathLabel(href) || segments[i].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return { href, label, isLast: i === segments.length - 1 };
  });

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 sm:gap-3 border-b border-[rgba(255,255,255,0.08)] px-3 sm:px-4 lg:px-6 bg-[#0B0F14]">
      <SidebarTrigger className="-ml-1 text-[#00F6FF] shrink-0" />
      <div className="h-6 w-px bg-[rgba(255,255,255,0.08)] shrink-0" />

      {/* Breadcrumb — hidden on mobile */}
      <Breadcrumb className="hidden md:block min-w-0">
        <BreadcrumbList>
          {breadcrumbs.flatMap((item, i) => {
            const items = [];
            if (i > 0) items.push(<BreadcrumbSeparator key={`sep-${i}`} />);
            items.push(<BreadcrumbItem key={item.href}>
              {item.isLast
                ? <BreadcrumbPage className="text-xs sm:text-sm font-mono text-[#00F6FF] truncate max-w-[120px] sm:max-w-none">{item.label}</BreadcrumbPage>
                : <BreadcrumbLink href={item.href} className="text-xs sm:text-sm font-mono text-[#6F7C89] hover:text-[#00F6FF] transition-colors truncate max-w-[80px] sm:max-w-none">{item.label}</BreadcrumbLink>}
            </BreadcrumbItem>);
            return items;
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Mobile page title */}
      {breadcrumbs.length > 0 && (
        <span className="text-xs font-mono text-[#00F6FF] truncate md:hidden max-w-[120px]">
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </span>
      )}

      {/* Ctrl+K trigger — icon on mobile, expanded on tablet+ */}
      <button onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
        className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-mono text-[#6F7C89] border border-[rgba(255,255,255,0.08)] hover:border-[#00F6FF]/30 hover:text-[#00F6FF] transition-colors cursor-pointer shrink-0">
        <Search className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Quick search</span>
        <kbd className="hidden lg:inline-block text-[8px] px-1 border border-[rgba(255,255,255,0.08)]">Ctrl+K</kbd>
      </button>

      <CommandPalette />
      {/* GlobalSearch — desktop only */}
      <div className="hidden lg:block">
        <GlobalSearch />
      </div>
      <AIAnalystPanel />
      <AIThreatAnalyst />

      <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
        {/* Notification Bell with Popover */}
        <Popover>
          <PopoverTrigger className="relative p-2 text-[#6F7C89] hover:text-[#00F6FF] transition-colors cursor-pointer">
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center bg-[#FF003C] text-[9px] font-bold text-white">{notificationCount > 9 ? '9+' : notificationCount}</span>}
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 border border-[rgba(0,246,255,0.2)]" style={{ background: '#0B0F14' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.08)]">
              <span className="text-xs font-mono font-bold text-[#00F6FF] tracking-wider uppercase">{t('notifications.title')}</span>
              {unreadData && <Badge variant="outline" className="text-[9px] font-mono text-[#00F6FF] border-[#00F6FF]">{unreadData.unread} {t('common.new', 'new')}</Badge>}
            </div>
            {notifData?.data?.length ? (
              <ScrollArea className="h-80">
                <div className="divide-y divide-[rgba(255,255,255,0.05)]">
                  {notifData.data.slice(0, 5).map(n => (
                    <button key={n._id} onClick={() => setSelectedNotif(n)}
                      className={`w-full text-left px-4 py-3 transition-colors ${n.read ? '' : 'bg-[rgba(0,246,255,0.03)]'} hover:bg-[rgba(0,246,255,0.06)] cursor-pointer`}>
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${n.type === 'CRITICAL' ? 'bg-[#FF003C]' : n.type === 'ALERT' ? 'bg-[#FCEE09]' : 'bg-[#00F6FF]'}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-mono text-white line-clamp-1">{n.title}</p>
                          <p className="text-[9px] font-mono text-[#6F7C89] mt-0.5">{formatDate(n.createdAt)}</p>
                        </div>
                        <Eye className="h-3 w-3 shrink-0 text-[#6F7C89] mt-0.5" />
                      </div>
                    </button>
                  ))}
                </div>
                {/* Footer actions */}
                <div className="border-t border-[rgba(255,255,255,0.08)] p-2 space-y-1">
                  <button onClick={() => markAllAsRead.mutate()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#00F6FF] hover:bg-[rgba(0,246,255,0.05)] transition-colors">
                    <CheckCheck className="h-3.5 w-3.5" /> {t('notifications.markAllRead')}
                  </button>
                  {notifData.pagination.total > 5 && (
                    <button onClick={() => { router.push('/dashboard/notifications'); document.body.click(); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-[#FCEE09] hover:bg-[rgba(252,238,9,0.05)] transition-colors">
                      <ExternalLink className="h-3.5 w-3.5" /> {t('notifications.viewAllCount', `View all (${notifData.pagination.total}) notifications`)}
                    </button>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-8 text-center text-[10px] font-mono text-[#6F7C89]">{t('notifications.noData')}</div>
            )}
          </PopoverContent>
        </Popover>

        {/* User Profile with Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
            <Avatar className="h-7 w-7 shrink-0 rounded-none border border-[#00F6FF]">
              {user?.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" /> : null}
              <AvatarFallback className="rounded-none bg-[#00F6FF] text-[10px] font-bold text-[#050505]">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="hidden lg:block text-left min-w-0">
              <p className="text-xs font-mono font-medium text-white truncate">{user?.name || t('common.user', 'User')}</p>
              <p className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase truncate">{user?.role || '—'}</p>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 border border-[rgba(0,246,255,0.2)]" style={{ background: '#0B0F14' }}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <p className="text-[10px] font-mono text-[#6F7C89]">{user?.email || '—'}</p>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings/profile')} className="text-xs font-mono text-white hover:bg-[rgba(0,246,255,0.05)] cursor-pointer">
              <User className="mr-2 h-3.5 w-3.5 text-[#00F6FF]" /> {t('settings.profile')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.08)]" />
            <DropdownMenuItem onClick={() => logout.mutate()} className="text-xs font-mono text-[#FF003C] hover:bg-[rgba(255,0,60,0.05)] cursor-pointer">
              <LogOut className="mr-2 h-3.5 w-3.5" /> {t('nav.signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotif} onOpenChange={() => setSelectedNotif(null)}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          {selectedNotif && (
            <>
              <DialogTitle className="font-mono text-[#00F6FF] tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selectedNotif.type === 'CRITICAL' ? 'bg-[#FF003C]' : selectedNotif.type === 'ALERT' ? 'bg-[#FCEE09]' : 'bg-[#00F6FF]'}`} />
                {selectedNotif.title}
              </DialogTitle>
              <DialogDescription className="font-mono text-[11px] text-[#B6C2CF] leading-relaxed mt-2">
                {selectedNotif.message}
              </DialogDescription>
              <div className="mt-3 flex items-center justify-between text-[9px] font-mono text-[#6F7C89]">
                <span>{t('common.source', 'Source')}: {selectedNotif.source}</span>
                <span>{formatDate(selectedNotif.createdAt)}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </header>
  );
}
