'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

const BOOT_LINES = [
  { text: '> INITIALIZING SECURE KERNEL...', delay: 300, color: '#6F7C89' },
  { text: '> LOADING ENCRYPTION MODULES...', delay: 700, color: '#6F7C89' },
  { text: '> ESTABLISHING SECURE CONNECTION...', delay: 1100, color: '#6F7C89' },
  { text: '> THREAT INTELLIGENCE ENGINE: ONLINE', delay: 1500, color: '#00FF41' },
  { text: '> AI DEFENDER: ACTIVE', delay: 1800, color: '#00F6FF' },
  { text: '> BIOMETRIC SCAN: COMPLETE', delay: 2100, color: '#FCEE09' },
  { text: '> SYSTEM READY. ACCESS GRANTED.', delay: 2500, color: '#00FF41' },
];

export function BootSplash({ onFinish }: { onFinish: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  // Sequential boot animation
  useEffect(() => {
    if (visibleLines < BOOT_LINES.length) {
      const timer = setTimeout(() => setVisibleLines(v => v + 1), BOOT_LINES[visibleLines]?.delay || 500);
      return () => clearTimeout(timer);
    } else {
      // All lines shown → wait → glitch effect → finish
      const finishTimer = setTimeout(() => {
        setGlitch(true);
        setTimeout(() => {
          setShowOverlay(false);
          setTimeout(() => onFinish(), 300);
        }, 600);
      }, 800);
      return () => clearTimeout(finishTimer);
    }
  }, [visibleLines, onFinish]);

  // Random glitch effect during boot
  useEffect(() => {
    const interval = setInterval(() => {
      if (visibleLines > 0 && visibleLines < BOOT_LINES.length) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 150);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [visibleLines]);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#0B0F14' }}
        >
          {/* Scanline overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,246,255,0.03) 2px, rgba(0,246,255,0.03) 3px)',
              animation: 'scanline 8s linear infinite',
            }} />

          {/* Glitch overlay */}
          {glitch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.3, 0.6, 0] }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(255,0,60,0.05), rgba(0,246,255,0.05), rgba(252,238,9,0.05))',
                transform: glitch ? `translate(${Math.random() * 4 - 2}px, ${Math.random() * 2 - 1}px)` : 'none',
              }}
            />
          )}

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative mb-6"
          >
            <div className="relative">
              <Shield className="h-16 w-16 text-[#00F6FF]" strokeWidth={1.5} />
              <div className="absolute inset-0 rounded-full border border-[#00F6FF] animate-ping opacity-20" />
            </div>
          </motion.div>

          {/* App name — glitch text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative mb-8"
          >
            <h1 className="text-2xl font-bold font-mono tracking-[0.25em] text-[#00F6FF] uppercase"
                data-text={APP_NAME}
                style={{
                  textShadow: '0 0 10px rgba(0,246,255,0.5), 0 0 20px rgba(0,246,255,0.2)',
                }}>
              {APP_NAME}
            </h1>
            {glitch && (
              <h1 className="absolute top-0 left-0 text-2xl font-bold font-mono tracking-[0.25em] uppercase opacity-50"
                  style={{ color: '#FF003C', clipPath: 'inset(20% 0 60% 0)', transform: 'translateX(2px)' }}>
                {APP_NAME}
              </h1>
            )}
          </motion.div>

          {/* Boot terminal lines */}
          <div className="w-full max-w-sm px-6">
            <div className="border border-[#00F6FF]/20 p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
              {BOOT_LINES.slice(0, visibleLines).map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-mono leading-relaxed"
                  style={{ color: line.color }}
                >
                  {line.text}
                  {i === visibleLines - 1 && i < BOOT_LINES.length - 1 && (
                    <span className="inline-block w-2 h-3 ml-1 animate-pulse" style={{ background: line.color }} />
                  )}
                </motion.p>
              ))}
              {visibleLines >= BOOT_LINES.length && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-[10px] font-mono text-[#00FF41]"
                >
                  ✓ SYSTEM READY. WELCOME.{' '}
                  <span className="inline-block w-2 h-3 bg-[#00FF41] animate-pulse ml-1" />
                </motion.p>
              )}
            </div>
          </div>

          {/* Bottom status bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-8 text-[7px] font-mono text-[#6F7C89] tracking-[0.3em] uppercase"
          >
            CyberFrost OS v4.2.1 // Secure Boot Sequence
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
