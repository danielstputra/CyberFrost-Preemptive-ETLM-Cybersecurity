'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '@/hooks/use-notifications';
import { FeatureGuide } from '@/components/cyber/FeatureGuide';
import { HUDCard } from '@/components/cyber/HUDCard';
import { HUDButton } from '@/components/cyber/HUDButton';
import { Dialog, DialogTitle, DialogDescription, DialogContent } from '@/components/ui/dialog';
import { Terminal, Bell, CheckCheck, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import { formatDate } from '@/lib/utils';
import type { Notification } from '@/types';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const itemAnim = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function NotificationsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Notification | null>(null);
  const { data } = useNotifications(page, 20);
  const markRead = useMarkAsRead();
  const markAllRead = useMarkAllAsRead();

  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
          <Terminal className="h-5 w-5 text-[#00F6FF]" />
          <div>
            <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">{t('notifications.title')}</h1><FeatureGuide title={t('notifications.guideTitle')} steps={[{title:t('notifications.guideRealTime'),desc:t('notifications.guideRealTimeDesc')},{title:t('notifications.guideActions'),desc:t('notifications.guideActionsDesc')}]} />
            <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('notifications.subtitle')}</p>
          </div>
        </div>
        <HUDButton variant="cyan" size="sm" onClick={() => markAllRead.mutate()} loading={markAllRead.isPending}>
          <CheckCheck className="h-3.5 w-3.5" /> {t('notifications.markAllRead')}
        </HUDButton>
      </motion.div>

      <motion.div variants={itemAnim}>
        <HUDCard title={t('notifications.allNotifications')} accent="cyan" icon={<Bell className="h-3.5 w-3.5" />}>
          {data?.data?.length ? (
            <div className="space-y-1">
              {data.data.map(n => (
                <div key={n._id} onClick={() => { setSelected(n); if (!n.read) markRead.mutate(n._id); }}
                  className={`flex items-start gap-3 p-3 border border-white/5 cursor-pointer transition-all ${
                    n.read ? 'hover:border-[#00F6FF]/20' : 'bg-[rgba(0,246,255,0.02)] hover:border-[#00F6FF]/30'
                  }`} style={{ background: n.read ? undefined : 'rgba(0,246,255,0.02)' }}>
                  <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    n.type === 'CRITICAL' ? 'bg-[#FF003C]' : n.type === 'ALERT' ? 'bg-[#FCEE09]' : 'bg-[#00F6FF]'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-white line-clamp-1">{n.title}</p>
                    <p className="text-[10px] font-mono text-[#6F7C89] mt-0.5 line-clamp-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[8px] font-mono text-[#6F7C89] uppercase">{n.source}</span>
                      <span className="text-[8px] font-mono text-[#6F7C89]">{formatDate(n.createdAt)}</span>
                      {!n.read && <span className="text-[8px] font-mono text-[#00F6FF]">{t('notifications.new')}</span>}
                    </div>
                  </div>
                  <Eye className="h-3.5 w-3.5 shrink-0 text-[#6F7C89] mt-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-[10px] font-mono text-[#6F7C89]">{t('notifications.noData')}</div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-[9px] font-mono text-[#6F7C89]">{t('notifications.pagination', `Page ${page} of ${totalPages} (${data?.pagination?.total || 0} total)`)}</span>
              <div className="flex gap-1">
                <HUDButton variant="cyan" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>
                  <ChevronLeft className="h-3 w-3" />
                </HUDButton>
                <HUDButton variant="cyan" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-3 w-3" />
                </HUDButton>
              </div>
            </div>
          )}
        </HUDCard>
      </motion.div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md p-6" style={{ background: '#0B0F14', border: '1px solid rgba(0,246,255,0.2)' }}>
          {selected && (
            <>
              <DialogTitle className="font-mono text-[#00F6FF] tracking-wider flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${selected.type === 'CRITICAL' ? 'bg-[#FF003C]' : selected.type === 'ALERT' ? 'bg-[#FCEE09]' : 'bg-[#00F6FF]'}`} />
                {selected.title}
              </DialogTitle>
              <DialogDescription className="font-mono text-[11px] text-[#B6C2CF] leading-relaxed mt-3">{selected.message}</DialogDescription>
              <div className="mt-4 flex items-center justify-between text-[9px] font-mono text-[#6F7C89] border-t border-white/5 pt-3">
                <span>{t('notifications.sourceLabel', `Source: ${selected.source}`)}</span>
                <span>{formatDate(selected.createdAt)}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
