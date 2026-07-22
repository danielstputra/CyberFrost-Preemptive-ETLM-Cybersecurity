'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegister } from '@/hooks/use-auth';
import Link from 'next/link';
import { CyberBackground } from '@/components/cyber/CyberBackground';
import { HUDInput } from '@/components/cyber/HUDInput';
import { HUDButton } from '@/components/cyber/HUDButton';
import { GlitchText } from '@/components/cyber/GlitchText';
import { Shield, Terminal, Lock, User, Building2, Globe, Activity, Wifi, Cpu } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import { LangSwitcher } from '@/components/ui/lang-switcher';

const statusItems = [
  { icon: <Activity className="h-3 w-3" />, label: 'SYSTEM STATUS', value: 'ONLINE', color: '#00FF41' },
  { icon: <Lock className="h-3 w-3" />, label: 'ENCRYPTION', value: 'ACTIVE', color: '#00F6FF' },
  { icon: <Cpu className="h-3 w-3" />, label: 'AI DEFENDER', value: 'READY', color: '#FCEE09' },
  { icon: <Wifi className="h-3 w-3" />, label: 'THREAT FEED', value: 'CONNECTED', color: '#00FF41' },
];

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ email: '', password: '', name: '', tenantName: '', tenantSlug: '' });
  const [bootIdx, setBootIdx] = useState(0);
  const register = useRegister();

  const bootLines = [
    `> ${APP_NAME} OS v4.2.1 // ${t('register.boot1')}`,
    `> ${t('register.boot2')}`,
    `> ${t('register.boot3')}`,
    `> ${t('register.boot4')}`,
  ];

  useEffect(() => {
    if (bootIdx < bootLines.length) {
      const t = setTimeout(() => setBootIdx(i => i + 1), 350);
      return () => clearTimeout(t);
    }
  }, [bootIdx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate(form);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <CyberBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[460px] angle-lg"
        style={{ background: 'rgba(11,15,20,0.95)', border: '1px solid rgba(0,246,255,0.15)', boxShadow: '0 0 40px rgba(0,246,255,0.05)' }}
      >
        {/* Title Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5">
          {['#FF003C', '#FCEE09', '#00FF41'].map((c, i) => (
            <motion.span key={i} className="w-2 h-2 rounded-full" style={{ background: c }}
              animate={{ opacity: c === '#00FF41' ? [1, 0.3, 1] : 1 }} transition={{ duration: 2, repeat: Infinity }} />
          ))}
          <LangSwitcher />
          <span className="ml-auto text-[8px] font-mono tracking-[0.2em] text-[#6F7C89] uppercase">{APP_NAME} Terminal — {t('register.title')}</span>
        </div>

        {/* Boot */}
        <div className="border-b border-white/5 px-6 py-3">
          <pre className="text-[10px] leading-relaxed font-mono">
            {bootLines.slice(0, bootIdx).map((line, i) => (
              <motion.span key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                className={i < bootLines.length - 1 ? 'text-[#6F7C89]' : 'text-[#00F6FF]'}>
                {line}{'\n'}
              </motion.span>
            ))}
            {bootIdx >= bootLines.length && <span className="inline-block w-2 h-4 bg-[#00F6FF] animate-pulse ml-1" />}
          </pre>
        </div>

        {/* Logo */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="flex flex-col items-center py-5 px-6">
          <div className="relative mb-2">
            <Shield className="h-9 w-9 text-[#00F6FF]" strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-full border border-[#00F6FF] animate-ping opacity-20" />
          </div>
          <GlitchText as="h1" size="lg" neon="cyan" className="text-center tracking-[0.2em]">{APP_NAME}</GlitchText>
          <p className="mt-1 text-[9px] font-mono tracking-[0.3em] text-[#6F7C89] uppercase">{t('register.title')}</p>
        </motion.div>

        {/* Form */}
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          onSubmit={handleSubmit} className="space-y-3 px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <HUDInput label={t('register.nameLabel')} value={form.name} onChange={v => setForm({ ...form, name: v })} icon={<User className="h-3 w-3" />} />
            <HUDInput label={t('register.emailLabel')} value={form.email} onChange={v => setForm({ ...form, email: v })} type="email" icon={<Terminal className="h-3 w-3" />} />
          </div>

          <HUDInput label={t('register.passwordLabel')} value={form.password} onChange={v => setForm({ ...form, password: v })} type="password" icon={<Lock className="h-3 w-3" />} />

          <div className="grid grid-cols-2 gap-3">
            <HUDInput label={t('register.tenantNameLabel')} value={form.tenantName} onChange={v => setForm({ ...form, tenantName: v })} icon={<Building2 className="h-3 w-3" />} />
            <HUDInput label={t('register.tenantSlugLabel')} value={form.tenantSlug} onChange={v => setForm({ ...form, tenantSlug: v })} placeholder="my-org" icon={<Globe className="h-3 w-3" />} />
          </div>

          <AnimatePresence>
            {register.error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="border border-[#FF003C] p-3" style={{ background: 'rgba(255,0,60,0.05)' }}>
                <p className="text-[10px] font-mono text-[#FF003C]">!&gt; {t('register.error')} — {(register.error as any)?.message || 'Check your input'}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <HUDButton type="submit" variant="cyan" size="lg" loading={register.isPending} className="w-full" glitchText={register.isPending ? t('register.processing') : t('register.submit')}>
            <Terminal className="h-4 w-4" />
          </HUDButton>

          <p className="text-center text-[9px] font-mono text-[#6F7C89]">
            {t('register.haveAccount')}{' '}
            <Link href="/login" className="text-[#00F6FF] hover:neon-text-cyan transition-all">{t('register.signIn')}</Link>
          </p>
        </motion.form>
      </motion.div>

      {/* Status Panel */}
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }}
        className="hidden lg:block absolute right-12 top-1/2 -translate-y-1/2 w-48 space-y-3">
        {statusItems.map((item, i) => (
          <motion.div key={item.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.15 }}
            className="angle-sm px-3 py-2.5" style={{ background: 'rgba(11,15,20,0.8)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ color: item.color }}>{item.icon}</span>
              <span className="text-[8px] font-mono tracking-wider text-[#6F7C89]">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
              <span className="text-[11px] font-mono font-bold tracking-wider" style={{ color: item.color }}>{item.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
