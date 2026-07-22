'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLogin } from '@/hooks/use-auth';
import Link from 'next/link';
import apiClient from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/constants';
import { useAuthStore } from '@/store/auth-store';
import { CyberBackground } from '@/components/cyber/CyberBackground';
import { HUDInput } from '@/components/cyber/HUDInput';
import { HUDButton } from '@/components/cyber/HUDButton';
import { GlitchText } from '@/components/cyber/GlitchText';
import { Shield, Terminal, Activity, Wifi, Lock, Cpu, Smartphone } from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import { LangSwitcher } from '@/components/ui/lang-switcher';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormField } from '@/components/ui/form';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const twofaSchema = z.object({
  token: z.string().length(6, '2FA code must be 6 digits').regex(/^\d{6}$/, 'Only digits allowed'),
});

type LoginForm = z.infer<typeof loginSchema>;
type TwofaForm = z.infer<typeof twofaSchema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const [bootIdx, setBootIdx] = useState(0);
  const [twofaStep, setTwofaStep] = useState(false);
  const [twofaUserId, setTwofaUserId] = useState('');
  const [twofaError, setTwofaError] = useState('');
  const [twofaLoading, setTwofaLoading] = useState(false);
  const [twofaToken, setTwofaToken] = useState('');
  const login = useLogin();
  const setAuth = useAuthStore((s) => s.setAuth);

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const twofaForm = useForm<TwofaForm>({
    resolver: zodResolver(twofaSchema),
    defaultValues: { token: '' },
  });

  const bootLines = [
    `> ${APP_NAME} OS v4.2.1 // ${t('login.boot1')}`,
    `> ${t('login.boot2')}`,
    `> ${t('login.boot3')}`,
    `> ${t('login.boot4')}`,
  ];

  useEffect(() => {
    if (bootIdx < bootLines.length) {
      const t = setTimeout(() => setBootIdx(i => i + 1), 400);
      return () => clearTimeout(t);
    }
  }, [bootIdx]);

  const statusItems = [
    { icon: <Activity className="h-3 w-3" />, label: t('login.systemStatus'), value: t('login.online'), color: '#00FF41' },
    { icon: <Lock className="h-3 w-3" />, label: t('login.encryption'), value: t('login.active'), color: '#00F6FF' },
    { icon: <Cpu className="h-3 w-3" />, label: t('login.aiDefender'), value: t('login.ready'), color: '#FCEE09' },
    { icon: <Wifi className="h-3 w-3" />, label: t('login.threatFeed'), value: t('login.connected'), color: '#00FF41' },
  ];

  const handleLogin = (values: LoginForm) => {
    setTwofaError('');
    login.mutate(
      { email: values.email, password: values.password },
      {
        onSuccess: (data: any) => {
          if (data?.requires2fa) {
            setTwofaStep(true);
            setTwofaUserId(data.userId);
          } else {
            setAuth(data.user, data.accessToken, data.refreshToken, data.tenant);
            window.location.href = '/dashboard';
          }
        },
      },
    );
  };

  const handleTwofaSubmit = async (values: TwofaForm) => {
    setTwofaLoading(true);
    setTwofaError('');
    try {
      const res = await apiClient.post(ENDPOINTS.TWOFA_AUTHENTICATE, { userId: twofaUserId, token: values.token });
      const data = res.data;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      const meRes = await apiClient.get(ENDPOINTS.AUTH_ME);
      setAuth(meRes.data.user, data.accessToken, data.refreshToken, meRes.data.user?.tenant);
      window.location.href = '/dashboard';
    } catch (err: any) {
      setTwofaError(err?.response?.data?.message || 'Invalid 2FA code.');
    } finally {
      setTwofaLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <CyberBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[420px] angle-lg"
        style={{ background: 'rgba(11,15,20,0.95)', border: '1px solid rgba(0,246,255,0.15)', boxShadow: '0 0 40px rgba(0,246,255,0.05)' }}
      >
        {/* Title Bar */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5">
          {['#FF003C', '#FCEE09', '#00FF41'].map((c, i) => (
            <motion.span key={i} className="w-2 h-2 rounded-full" style={{ background: c }}
              animate={{ opacity: c === '#00FF41' ? [1, 0.3, 1] : 1 }} transition={{ duration: 2, repeat: Infinity }} />
          ))}
          <LangSwitcher />
          <span className="ml-auto text-[8px] font-mono tracking-[0.2em] text-[#6F7C89] uppercase">{APP_NAME} {t('login.terminal')} v4.2.1</span>
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
          className="flex flex-col items-center py-6 px-6">
          <div className="relative mb-3">
            <Shield className="h-10 w-10 text-[#00F6FF]" strokeWidth={1.5} />
            <div className="absolute inset-0 rounded-full border border-[#00F6FF] animate-ping opacity-20" />
          </div>
          <GlitchText as="h1" size="xl" neon="cyan" className="text-center tracking-[0.2em]">{APP_NAME}</GlitchText>
          <p className="mt-1 text-[9px] font-mono tracking-[0.3em] text-[#6F7C89] uppercase">{t('login.title')}</p>
        </motion.div>

        {/* Form with react-hook-form */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="space-y-3.5 px-6 pb-6">
          <AnimatePresence mode="wait">
            {twofaStep ? (
              <motion.div key="2fa" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-[#00F6FF]" />
                  <span className="text-[9px] font-mono text-[#00F6FF] uppercase tracking-wider">2FA Authentication</span>
                </div>
                <Form form={twofaForm} onSubmit={handleTwofaSubmit} className="space-y-3">
                  <FormField name="token" label="Authentication Code">
                    {(field) => (
                      <input {...field} placeholder="000000" maxLength={6} autoFocus
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full text-center text-2xl tracking-[0.3em] px-3 py-3 font-mono border outline-none transition-colors bg-[rgba(0,0,0,0.8)] border-[rgba(0,246,255,0.2)] text-[#00F6FF] focus:border-[#00F6FF] placeholder:text-[#6F7C89]" />
                    )}
                  </FormField>
                  {twofaError && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="border border-[#FF003C] p-3" style={{ background: 'rgba(255,0,60,0.05)' }}>
                      <p className="text-[10px] font-mono text-[#FF003C]">!&gt; {twofaError}</p>
                    </motion.div>
                  )}
                  <HUDButton type="submit" variant="cyan" size="lg" loading={twofaLoading} className="w-full" glitchText="VERIFY">
                    <Smartphone className="h-4 w-4 shrink-0" /> Verify 2FA
                  </HUDButton>
                  <button type="button" onClick={() => { setTwofaStep(false); twofaForm.reset(); setTwofaError(''); }}
                    className="w-full text-[9px] font-mono text-[#6F7C89] hover:text-white transition-colors">
                    &larr; Back to login
                  </button>
                </Form>
              </motion.div>
            ) : (
              <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <Form form={loginForm} onSubmit={handleLogin} className="space-y-3.5">
                  <FormField name="email" label={t('login.email')}>
                    {(field) => (
                      <HUDInput label="" value={field.value} onChange={field.onChange} type="email" icon={<Terminal className="h-3 w-3" />} />
                    )}
                  </FormField>
                  <FormField name="password" label={t('login.password')}>
                    {(field) => (
                      <HUDInput label="" value={field.value} onChange={field.onChange} type="password" icon={<Lock className="h-3 w-3" />} />
                    )}
                  </FormField>
                  {login.error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="border border-[#FF003C] p-3" style={{ background: 'rgba(255,0,60,0.05)' }}>
                      <p className="text-[10px] font-mono text-[#FF003C]">!&gt; {t('login.error')} — {login.error?.message || t('login.invalidCredentials')}</p>
                    </motion.div>
                  )}
                  <HUDButton type="submit" variant="yellow" size="lg" loading={login.isPending} className="w-full" glitchText={t('login.authenticate')}>
                    <Terminal className="h-4 w-4 shrink-0" />
                  </HUDButton>
                </Form>
                <p className="mt-4 text-center text-[9px] font-mono text-[#6F7C89]">
                  {t('login.noAccount')}{' '}
                  <Link href="/register" className="text-[#00F6FF] hover:neon-text-cyan transition-all">{t('login.requestAccess')}</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Status Panel — right side */}
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
              <span className={`w-1.5 h-1.5 rounded-full`} style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
              <span className="text-[11px] font-mono font-bold tracking-wider" style={{ color: item.color }}>{item.value}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
