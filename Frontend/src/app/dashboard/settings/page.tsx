'use client';

import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { HUDCard } from '@/components/cyber/HUDCard';
import { Terminal, User, Building2, Shield } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const itemAnim = { hidden: { opacity: 0, y: 25 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function SettingsPage() {
  const { t } = useTranslation();
  const user = useAuthStore(s => s.user);
  const tenant = useAuthStore(s => s.tenant);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemAnim} className="flex items-center gap-3 border-l-2 border-[#00F6FF] pl-4">
        <Terminal className="h-5 w-5 text-[#00F6FF]" />
        <div>
          <h1 className="text-base font-bold tracking-[0.15em] text-[#00F6FF] font-mono uppercase">{t('settings.title')}</h1>
          <p className="text-[10px] font-mono text-[#6F7C89] tracking-wider">&gt; {t('settings.subtitle')}</p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={itemAnim}>
          <HUDCard title={t('settings.profile')} accent="cyan" icon={<User className="h-3.5 w-3.5" />}>
            <div className="space-y-3">
              {[
                { label: t('settings.name'), value: user?.name },
                { label: t('settings.email'), value: user?.email },
                { label: t('settings.role'), value: user?.role },
              ].map(f => (
                <div key={f.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-mono tracking-wider text-[#6F7C89] uppercase">{f.label}</span>
                  <span className="text-xs font-mono text-white">{f.value || '—'}</span>
                </div>
              ))}
            </div>
          </HUDCard>
        </motion.div>

        <motion.div variants={itemAnim}>
          <HUDCard title={t('settings.organization')} accent="yellow" icon={<Building2 className="h-3.5 w-3.5" />}>
            <div className="space-y-3">
              {[
                { label: t('settings.company'), value: tenant?.name || user?.tenant?.name },
                { label: t('settings.tenantId'), value: user?.tenantId },
                { label: t('settings.slug'), value: tenant?.slug },
              ].map(f => (
                <div key={f.label} className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-mono tracking-wider text-[#6F7C89] uppercase">{f.label}</span>
                  <span className="text-xs font-mono text-white">{f.value || '—'}</span>
                </div>
              ))}
            </div>
          </HUDCard>
        </motion.div>

        <motion.div variants={itemAnim} className="lg:col-span-2">
          <HUDCard title={t('settings.system')} accent="cyan" icon={<Shield className="h-3.5 w-3.5" />}>
            <div className="flex items-center gap-3 text-[10px] font-mono text-[#6F7C89]">
              <span className="text-[#00FF41]">●</span> {t('settings.systemOnline')}
              <span className="text-[#6F7C89]">•</span>
              <span className="text-[#00F6FF]">●</span> {t('settings.apiConnected')}
              <span className="text-[#6F7C89]">•</span>
              <span className="text-[#FCEE09]">●</span> {t('app.version')}
            </div>
          </HUDCard>
        </motion.div>
      </div>
    </motion.div>
  );
}
