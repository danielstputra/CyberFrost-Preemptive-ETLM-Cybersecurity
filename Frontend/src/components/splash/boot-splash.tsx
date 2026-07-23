'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield } from 'lucide-react';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'CyberFrost';

const BOOT_LINES = [
  { text: '> INITIALIZING SECURE KERNEL...', delay: 250, color: '#6F7C89' },
  { text: '> LOADING ENCRYPTION MODULES...', delay: 550, color: '#6F7C89' },
  { text: '> ESTABLISHING SECURE CONNECTION...', delay: 850, color: '#6F7C89' },
  { text: '> THREAT INTELLIGENCE ENGINE: ONLINE', delay: 1150, color: '#00FF41' },
  { text: '> AI DEFENDER: ACTIVE', delay: 1400, color: '#00F6FF' },
  { text: '> BIOMETRIC SCAN: COMPLETE', delay: 1650, color: '#FCEE09' },
  { text: '> SYSTEM READY. ACCESS GRANTED.', delay: 1900, color: '#00FF41' },
];

const TRANSITION_LINES = [
  { text: '> ROUTING...', delay: 200, color: '#6F7C89' },
  { text: '> LOADING PAGE...', delay: 500, color: '#00F6FF' },
];

export function BootSplash({ onFinish, mini }: { onFinish: () => void; mini?: boolean }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [glitch, setGlitch] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const finished = useRef(false);

  const lines = mini ? TRANSITION_LINES : BOOT_LINES;

  // Sequential: tampilkan baris satu per satu
  useEffect(() => {
    if (finished.current) return;
    if (visibleLines < lines.length) {
      const t = setTimeout(() => setVisibleLines(v => v + 1), lines[visibleLines]?.delay || 300);
      return () => clearTimeout(t);
    }
  }, [visibleLines, lines]);

  // Semua baris sudah tampil → tunggu sebentar → finish
  useEffect(() => {
    if (finished.current) return;
    if (visibleLines >= lines.length) {
      finished.current = true;
      const delay = mini ? 600 : 1400;
      const t = setTimeout(() => {
        if (mini) {
          setShowOverlay(false);
          setTimeout(() => onFinish(), 200);
        } else {
          setGlitch(true);
          setTimeout(() => {
            setShowOverlay(false);
            setTimeout(() => onFinish(), 300);
          }, 500);
        }
      }, delay);
      return () => clearTimeout(t);
    }
  }, [visibleLines, lines.length, mini, onFinish]);

  // Random glitch (hanya untuk full boot)
  useEffect(() => {
    if (mini || finished.current) return;
    const interval = setInterval(() => {
      if (visibleLines > 0 && visibleLines < BOOT_LINES.length) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 120);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [visibleLines, mini]);

  return (
    <AnimatePresence>
      {showOverlay && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5 } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{ background: '#0B0F14' }}
        >
          {/* Scanline */}
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
              }}
            />
          )}

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative mb-4"
          >
            <Shield className="h-14 w-14 text-[#00F6FF]" strokeWidth={1.5} />
          </motion.div>

          {/* App name */}
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-bold font-mono tracking-[0.25em] text-[#00F6FF] uppercase mb-6"
            style={{ textShadow: '0 0 10px rgba(0,246,255,0.5)' }}
          >
            {APP_NAME}
          </motion.h1>

          {/* Boot terminal */}
          <div className="w-full max-w-xs px-6">
            <div className="border border-[#00F6FF]/20 p-3.5" style={{ background: 'rgba(0,0,0,0.6)' }}>
              {lines.slice(0, visibleLines).map((line, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[9px] font-mono leading-relaxed"
                  style={{ color: line.color }}
                >
                  {line.text}
                  {i === visibleLines - 1 && i < lines.length - 1 && (
                    <span className="inline-block w-1.5 h-2.5 ml-1 animate-pulse" style={{ background: line.color }} />
                  )}
                </motion.p>
              ))}
              {visibleLines >= lines.length && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-[9px] font-mono text-[#00FF41]"
                >
                  ✓ READY <span className="inline-block w-1.5 h-2.5 bg-[#00FF41] animate-pulse ml-1" />
                </motion.p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
