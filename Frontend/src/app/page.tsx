'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useTransform, useScroll, useInView, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { CyberBackground } from '@/components/cyber/CyberBackground';
import { GlitchText } from '@/components/cyber/GlitchText';
import { HUDButton } from '@/components/cyber/HUDButton';
import { HUDCard } from '@/components/cyber/HUDCard';
import { TerminalPanel } from '@/components/cyber/TerminalPanel';
import {
  Shield, Bug, Radio, Search, ShieldOff, Activity, Brain, Users, Radar,
  ChevronRight, ArrowRight, ChevronLeft, Server, Zap, Globe, Lock, Webhook
} from 'lucide-react';
import { useTranslation } from '@/providers/translation-provider';
import { LangSwitcher } from '@/components/ui/lang-switcher';

// ── Constants ──
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

const FEATURES = [
  { icon: Shield, titleKey: 'landing.features.attackSurface', descKey: 'landing.features.attackSurfaceDesc', accent: 'cyan' as const },
  { icon: Bug, titleKey: 'landing.features.vulnIntel', descKey: 'landing.features.vulnIntelDesc', accent: 'red' as const },
  { icon: Radio, titleKey: 'landing.features.threatIntel', descKey: 'landing.features.threatIntelDesc', accent: 'yellow' as const },
  { icon: Search, titleKey: 'landing.features.osint', descKey: 'landing.features.osintDesc', accent: 'cyan' as const },
  { icon: ShieldOff, titleKey: 'landing.features.mitigation', descKey: 'landing.features.mitigationDesc', accent: 'red' as const },
  { icon: Brain, titleKey: 'landing.features.aiInsights', descKey: 'landing.features.aiInsightsDesc', accent: 'yellow' as const },
  { icon: Shield, titleKey: 'landing.features.executiveProtection', descKey: 'landing.features.executiveProtectionDesc', accent: 'red' as const },
  { icon: Users, titleKey: 'landing.features.tprm', descKey: 'landing.features.tprmDesc', accent: 'cyan' as const },
  { icon: Radar, titleKey: 'landing.features.warRoom', descKey: 'landing.features.warRoomDesc', accent: 'red' as const },
  { icon: Activity, titleKey: 'landing.features.realtime', descKey: 'landing.features.realtimeDesc', accent: 'yellow' as const },
];

const SLIDES = [
  { titleKey: 'landing.slider.slide1', subtitleKey: 'landing.slider.slide1Sub', color: '#00F6FF' },
  { titleKey: 'landing.slider.slide2', subtitleKey: 'landing.slider.slide2Sub', color: '#FCEE09' },
  { titleKey: 'landing.slider.slide3', subtitleKey: 'landing.slider.slide3Sub', color: '#FF003C' },
  { titleKey: 'landing.slider.slide4', subtitleKey: 'landing.slider.slide4Sub', color: '#00FF41' },
  { titleKey: 'landing.slider.slide5', subtitleKey: 'landing.slider.slide5Sub', color: '#FF00FF' },
  { titleKey: 'landing.slider.slide6', subtitleKey: 'landing.slider.slide6Sub', color: '#FF8C00' },
];

const STATS = [
  { value: '10K+', labelKey: 'landing.stats.assets', icon: Server },
  { value: '50K+', labelKey: 'landing.stats.cves', icon: Bug },
  { value: '99.9%', labelKey: 'landing.stats.detection', icon: Activity },
  { value: '<2min', labelKey: 'landing.stats.response', icon: Zap },
];

const STEPS = [
  { num: '01', titleKey: 'landing.how.step1', descKey: 'landing.how.step1Desc', color: '#00F6FF' },
  { num: '02', titleKey: 'landing.how.step2', descKey: 'landing.how.step2Desc', color: '#FCEE09' },
  { num: '03', titleKey: 'landing.how.step3', descKey: 'landing.how.step3Desc', color: '#FF003C' },
  { num: '04', titleKey: 'landing.how.step4', descKey: 'landing.how.step4Desc', color: '#00FF41' },
];

// ── 3D Tilt Card ──
function TiltCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / -20;
    setTilt({ x, y });
  };
  const resetTilt = () => setTilt({ x: 0, y: 0 });
  return (
    <div ref={ref} onMouseMove={handleMouse} onMouseLeave={resetTilt}
      style={{ perspective: '1200px' }} className={className}>
      <motion.div animate={{ rotateX: tilt.x, rotateY: tilt.y }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
}

// ── Slide Indicator ──
function SlideIndicator({ total, active, onClick }: { total: number; active: number; onClick: (i: number) => void }) {
  return (
    <div className="flex items-center gap-3 justify-center mt-6">
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => onClick(i)}
          className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? 'w-10 bg-[#00F6FF]' : 'w-3 bg-white/10 hover:bg-white/30'}`} />
      ))}
    </div>
  );
}

// ── Animated Counter ──
function Counter({ value, label, icon: Icon }: { value: string; label: string; icon: any }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      transition={{ duration: 0.6 }} className="text-center">
      <motion.div initial={{ scale: 0 }} animate={isInView ? { scale: 1 } : {}} transition={{ type: 'spring', delay: 0.2 }}
        className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-white/5 border border-white/10 mb-3">
        <Icon className="h-5 w-5 text-[#00F6FF]" />
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : {}} className="text-3xl font-bold font-mono text-white neon-text-white">{value}</motion.p>
      <p className="text-[10px] font-mono tracking-wider text-[#6F7C89] uppercase mt-1">{label}</p>
    </motion.div>
  );
}

// ── Section Header ──
function SectionHeader({ label, title, desc }: { label: string; title: string; desc: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="text-center mb-16">
      <span className="text-[10px] font-mono tracking-[0.3em] text-[#00F6FF] uppercase">{label}</span>
      <h2 className="text-3xl md:text-4xl font-bold font-mono text-white mt-2">{title}</h2>
      <p className="text-sm text-[#6F7C89] font-mono mt-3 max-w-2xl mx-auto">{desc}</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
//  MAIN LANDING PAGE
// ═══════════════════════════════════════════

export default function LandingPage() {
  const { t } = useTranslation();
  const [slideIdx, setSlideIdx] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.9]);

  // Auto-slide
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <CyberBackground />

      {/* ─── NAVBAR ─── */}
      <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[rgba(5,5,8,0.8)] backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-[#00F6FF]" />
          <span className="font-bold font-mono tracking-wider text-[#00F6FF]">{APP_NAME}</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { href: '#features', label: t('nav.features') },
            { href: '#how-it-works', label: t('nav.howItWorks') },
            { href: '#platform', label: t('nav.platform') },
          ].map(item => (
            <a key={item.href} href={item.href}
              className="text-xs font-mono tracking-wider text-[#6F7C89] hover:text-[#00F6FF] transition-colors uppercase">{item.label}</a>
          ))}
          <LangSwitcher />
          <Link href="/login">
            <HUDButton variant="cyan" size="sm">{t('nav.signIn')}</HUDButton>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-[#6F7C89] hover:text-white">
          <div className="space-y-1">
            <span className={`block w-5 h-px bg-current transition-transform ${mobileMenu ? 'rotate-45 translate-y-1.5' : ''}`} />
            <span className={`block w-5 h-px bg-current transition-opacity ${mobileMenu ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-px bg-current transition-transform ${mobileMenu ? '-rotate-45 -translate-y-1.5' : ''}`} />
          </div>
        </button>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenu && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[rgba(5,5,8,0.95)] backdrop-blur-md border-b border-white/5 md:hidden">
            <div className="flex flex-col p-6 gap-4">
              {[
                { href: '#features', label: t('nav.features') },
                { href: '#how-it-works', label: t('nav.howItWorks') },
                { href: '#platform', label: t('nav.platform') },
              ].map(item => (
                <a key={item.href} href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="text-xs font-mono tracking-wider text-[#6F7C89] hover:text-[#00F6FF] py-2 uppercase">{item.label}</a>
              ))}
              <LangSwitcher />
              <Link href="/login" onClick={() => setMobileMenu(false)}>
                <HUDButton variant="cyan" size="sm" className="w-full">{t('nav.signIn')}</HUDButton>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO SECTION ─── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-20 overflow-hidden">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="relative z-10 text-center max-w-5xl">
          {/* 3D Floating Orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -40, 20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-20 left-[10%] w-64 h-64 rounded-full bg-[#00F6FF]/5 blur-[100px]" />
            <motion.div animate={{ x: [0, -30, 20, 0], y: [0, 40, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-20 right-[10%] w-80 h-80 rounded-full bg-[#FCEE09]/5 blur-[120px]" />
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FF003C]/5 blur-[150px]" />
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00F6FF]/20 bg-[rgba(0,246,255,0.05)] mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse" />
            <span className="text-[10px] font-mono tracking-wider text-[#00F6FF] uppercase">{t('hero.badge')}</span>
          </motion.div>

          <GlitchText as="h1" size="xl" neon="cyan" className="text-5xl md:text-7xl font-bold font-mono leading-tight">
            {APP_NAME}
          </GlitchText>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-6 text-lg md:text-xl font-mono text-[#6F7C89] max-w-3xl mx-auto leading-relaxed">
            {t('app.tagline')} —
            <span className="text-white"> {t('app.desc')}</span>
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <HUDButton variant="yellow" size="lg" glitchText={t('hero.deployNow')}>
                <Shield className="h-4 w-4" /> {t('hero.startFreeTrial')}
              </HUDButton>
            </Link>
            <Link href="/login">
              <HUDButton variant="cyan" size="lg">
                {t('nav.signIn')} <ChevronRight className="h-4 w-4" />
              </HUDButton>
            </Link>
            <a href="https://github.com/danielstputra/CyberFrost-Preemptive-ETLM-Cybersecurity/releases/latest/download/app-debug.apk"
               target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2.5 text-[10px] font-mono font-bold tracking-wider uppercase angle-sm transition-all duration-200"
               style={{ background: 'transparent', border: '1px solid #00F6FF', color: '#00F6FF' }}
               onClick={e => {
                 // Cek apakah release tersedia
                 fetch('https://api.github.com/repos/danielstputra/CyberFrost-Preemptive-ETLM-Cybersecurity/releases/latest', { method: 'HEAD' })
                   .then(r => { if (!r.ok) window.location.href = 'https://github.com/danielstputra/CyberFrost-Preemptive-ETLM-Cybersecurity/actions/workflows/android-build.yml'; })
                   .catch(() => {});
               }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Android APK
            </a>
          </motion.div>

          {/* 3D Stats Row */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}
            className="mt-16 flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {[
              { icon: Shield, label: t('hero.attackSurface'), value: t('hero.daily') },
              { icon: Bug, label: t('hero.cveDatabase'), value: t('hero.live') },
              { icon: Activity, label: t('hero.threatIntelligence'), value: t('hero.aiPowered') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-left">
                <item.icon className="h-4 w-4 text-[#00F6FF]" />
                <div>
                  <p className="text-[9px] font-mono text-[#6F7C89] tracking-wider uppercase">{item.label}</p>
                  <p className="text-xs font-mono font-bold text-white">{item.value}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
            className="mt-16 flex flex-col items-center gap-2">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center pt-1.5">
              <motion.div animate={{ opacity: [1, 0.2, 1], y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
                className="w-1 h-2 rounded-full bg-[#00F6FF]" />
            </motion.div>
            <span className="text-[8px] font-mono tracking-[0.2em] text-[#6F7C89] uppercase">{t('hero.scrollToExplore')}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── FEATURES SECTION ─── */}
      <section id="features" className="relative z-10 px-6 py-24 md:py-32">
        <SectionHeader label={t('landing.features.title')} title={t('landing.features.heading')} desc={t('landing.features.desc')} />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.titleKey} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}>
              <TiltCard>
                <HUDCard accent={f.accent} className="h-full cursor-default" title={t(f.titleKey)}>
                  <f.icon className="h-6 w-6 mb-3" style={{ color: f.accent === 'cyan' ? '#00F6FF' : f.accent === 'red' ? '#FF003C' : '#FCEE09' }} />
                  <p className="text-[11px] font-mono text-[#6F7C89] leading-relaxed">{t(f.descKey)}</p>
                </HUDCard>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── 3D SLIDER SECTION ─── */}
      <section id="platform" className="relative z-10 px-6 py-24 md:py-32">
        <SectionHeader label={t('landing.slider.title')} title={t('landing.slider.heading')} desc={t('landing.slider.desc')} />
        <div className="max-w-5xl mx-auto">
          <div className="relative" style={{ perspective: '1500px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={slideIdx} initial={{ opacity: 0, rotateY: -15, scale: 0.95, x: 100 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, rotateY: 15, scale: 0.95, x: -100 }}
                transition={{ duration: 0.5 }}
                style={{ transformStyle: 'preserve-3d' }}
                className="relative angle-lg overflow-hidden border border-white/10 bg-[rgba(11,15,20,0.9)] backdrop-blur-sm">
                {/* Slide Content */}
                <div className="p-8 md:p-12">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                  </div>

                  {/* Simulated Dashboard Preview */}
                  <div className="grid grid-cols-4 gap-3 mb-6">
                    {[1, 2, 3, 4].map(i => (
                      <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        className="h-16 rounded bg-white/5 border border-white/5 p-2 flex flex-col justify-between">
                        <div className="h-1.5 w-8 rounded bg-white/10" />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${30 + i * 15}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.8 }}
                          className="h-3 rounded-sm" style={{ background: SLIDES[slideIdx].color }} />
                      </motion.div>
                    ))}
                  </div>

                  <div className="h-32 rounded bg-white/5 border border-white/5 p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <motion.div key={`bar-${slideIdx}`} initial={{ width: 0 }} animate={{ width: '60%' }}
                        className="h-2 rounded-sm" style={{ background: SLIDES[slideIdx].color }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-4 rounded bg-white/5" />
                      ))}
                    </div>
                  </div>

                  <motion.h3 key={`t-${slideIdx}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    className="text-lg font-mono font-bold text-white neon-text-white">{t(SLIDES[slideIdx].titleKey)}</motion.h3>
                  <motion.p key={`d-${slideIdx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="text-xs font-mono text-[#6F7C89] mt-1">{t(SLIDES[slideIdx].subtitleKey)}</motion.p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Nav Arrows */}
            <button onClick={() => setSlideIdx(i => (i - 1 + SLIDES.length) % SLIDES.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-[#6F7C89] hover:text-white hover:border-[#00F6FF] transition-all">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setSlideIdx(i => (i + 1) % SLIDES.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 border border-white/10 text-[#6F7C89] hover:text-white hover:border-[#00F6FF] transition-all">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <SlideIndicator total={SLIDES.length} active={slideIdx} onClick={setSlideIdx} />
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="relative z-10 px-6 py-24 md:py-32">
        <SectionHeader label={t('landing.how.title')} title={t('landing.how.heading')} desc={t('landing.how.desc')} />
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-4 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-[#00F6FF] via-[#FCEE09] via-[#FF003C] to-[#00FF41] opacity-30" />
            {STEPS.map((step, i) => (
              <motion.div key={step.num} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.15 }} className="relative">
                <TiltCard>
                  <div className="text-center p-6 rounded-lg border border-white/5 bg-[rgba(11,15,20,0.5)] backdrop-blur-sm h-full">
                    <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.2, type: 'spring' }}
                      className="w-12 h-12 mx-auto mb-4 rounded-lg flex items-center justify-center font-mono font-bold text-sm"
                      style={{ background: `${step.color}15`, border: `1px solid ${step.color}40`, color: step.color }}>
                      {step.num}
                    </motion.div>
                    <h3 className="text-sm font-mono font-bold text-white mb-2">{t(step.titleKey)}</h3>
                    <p className="text-[10px] font-mono text-[#6F7C89] leading-relaxed">{t(step.descKey)}</p>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── INTEGRATIONS SECTION ─── */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <SectionHeader label={t('landing.integrations.title')} title={t('landing.integrations.heading')} desc={t('landing.integrations.desc')} />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Webhook, label: 'landing.integrations.jira', desc: 'landing.integrations.jiraDesc', color: '#00F6FF' },
            { icon: Server, label: 'landing.integrations.servicenow', desc: 'landing.integrations.servicenowDesc', color: '#FCEE09' },
            { icon: Activity, label: 'landing.integrations.splunk', desc: 'landing.integrations.splunkDesc', color: '#FF003C' },
            { icon: Globe, label: 'landing.integrations.webhook', desc: 'landing.integrations.webhookDesc', color: '#00FF41' },
          ].map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="text-center p-5 rounded-lg border border-white/5 bg-[rgba(11,15,20,0.5)] backdrop-blur-sm">
              <item.icon className="h-8 w-8 mx-auto mb-3" style={{ color: item.color }} />
              <p className="text-xs font-mono font-bold text-white">{t(item.label)}</p>
              <p className="text-[9px] font-mono text-[#6F7C89] mt-1">{t(item.desc)}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── SECURITY ENTERPRISE SECTION ─── */}
      <section className="relative z-10 px-6 py-24 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <SectionHeader label={t('landing.enterprise.title')} title={t('landing.enterprise.heading')} desc={t('landing.enterprise.desc')} />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Lock, label: 'landing.enterprise.rbac', desc: 'landing.enterprise.rbacDesc', color: '#00F6FF' },
              { icon: Shield, label: 'landing.enterprise.tenant', desc: 'landing.enterprise.tenantDesc', color: '#FCEE09' },
              { icon: Brain, label: 'landing.enterprise.mitre', desc: 'landing.enterprise.mitreDesc', color: '#FF003C' },
            ].map((item, i) => (
              <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-4 border border-white/5 bg-[rgba(11,15,20,0.4)]">
                <item.icon className="h-5 w-5 mt-0.5 shrink-0" style={{ color: item.color }} />
                <div>
                  <p className="text-xs font-mono font-bold text-white">{t(item.label)}</p>
                  <p className="text-[10px] font-mono text-[#6F7C89] mt-1">{t(item.desc)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS COUNTERS ─── */}
      <section className="relative z-10 px-6 py-24 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {STATS.map(stat => <Counter key={stat.labelKey} value={stat.value} label={t(stat.labelKey)} icon={stat.icon} />)}
        </div>
      </section>

      {/* ─── TERMINAL / CTA ─── */}
      <section className="relative z-10 px-6 py-24 md:py-32">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <TerminalPanel lines={[
              `${APP_NAME} OS v4.2.1 // Preemptive ETLM Platform`,
              'Modules: 10/10 online · Threat feed: connected',
              'EASM: ACTIVE · DRP: MONITORING · MITRE: MAPPED',
              'AI engine: Gemini 2.0 Flash · SOC: 24/7',
              'SIEM: Jira · Splunk · ServiceNow integrated',
              'RBAC: 7 roles · Multi-tenant: ENTERPRISE',
              'Status: OPERATIONAL · Response SLA: <2min',
              '',
              `→ ${t('landing.cta.title')}`,
            ]} title="SYSTEM STATUS" />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-10 text-center">
            <p className="text-sm font-mono text-[#6F7C89] mb-6">
              {t('landing.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <HUDButton variant="yellow" size="lg" glitchText={t('landing.cta.getStarted')}>
                  <Shield className="h-4 w-4" /> {t('landing.cta.deploy')}
                </HUDButton>
              </Link>
              <Link href="/login">
                <HUDButton variant="cyan" size="lg">
                  {t('landing.cta.signIn')} <ArrowRight className="h-4 w-4" />
                </HUDButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#00F6FF]" />
            <span className="text-xs font-mono font-bold text-[#6F7C89]">&copy; {new Date().getFullYear()} {APP_NAME}</span>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: t('footer.privacy'), key: 'footer.privacy' },
              { label: t('footer.terms'), key: 'footer.terms' },
              { label: t('footer.contact'), key: 'footer.contact' },
            ].map(item => (
              <a key={item.key} href="#" className="text-[9px] font-mono tracking-wider text-[#6F7C89] hover:text-[#00F6FF] uppercase">{item.label}</a>
            ))}
          </div>
          <p className="text-[8px] font-mono text-[#6F7C89] tracking-wider">{t('footer.copyright')}</p>
        </div>
      </footer>
    </div>
  );
}
