'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface HackerTextProps {
  text: string;
  className?: string;
  trigger?: 'hover' | 'auto' | 'click';
  scrambleSpeed?: number;
  glitchDuration?: number;
}

const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#________';
const CYBER_CHARS = '0123456789ABCDEF'.split('');

export function HackerText({
  text,
  className = '',
  trigger = 'hover',
  scrambleSpeed = 60,
  glitchDuration = 800,
}: HackerTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [glitching, setGlitching] = useState(false);
  const [offset, setOffset] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glitchingRef = useRef(false);

  const startGlitch = useCallback(() => {
    if (glitchingRef.current) return;
    glitchingRef.current = true;
    setGlitching(true);

    // Phase 1: RGB offset split (brief)
    setOffset(2);
    setTimeout(() => setOffset(-1), 60);
    setTimeout(() => setOffset(0), 120);

    // Phase 2: Character scrambling
    let scrambles = 0;
    const maxScrambles = 4 + Math.floor(Math.random() * 4);

    intervalRef.current = setInterval(() => {
      setDisplayText(prev => {
        const idx = Math.floor(Math.random() * prev.length);
        const char = prev[idx];
        // Only scramble letters/numbers, not spaces
        if (char === ' ') return prev;
        const r = Math.random();
        if (r < 0.3) {
          // Replace with random symbol
          return prev.slice(0, idx) + GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] + prev.slice(idx + 1);
        } else if (r < 0.5) {
          // Replace with random hex digit
          return prev.slice(0, idx) + CYBER_CHARS[Math.floor(Math.random() * CYBER_CHARS.length)] + prev.slice(idx + 1);
        } else {
          // Toggle case
          return prev.slice(0, idx) + (char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()) + prev.slice(idx + 1);
        }
      });
      scrambles++;
      if (scrambles >= maxScrambles) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // Restore original text
        setDisplayText(text);
        timeoutRef.current = setTimeout(() => setGlitching(false), 150);
      }
    }, scrambleSpeed);

    // Phase 3: Quick flicker at the end
    timeoutRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText(text);
      setOffset(0);
      setTimeout(() => setGlitching(false), 100);
    }, glitchDuration);
  }, [text, scrambleSpeed, glitchDuration]);

  const stopGlitch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    glitchingRef.current = false;
    setDisplayText(text);
    setOffset(0);
    setGlitching(false);
  }, [text]);

  useEffect(() => {
    if (trigger === 'auto') startGlitch();
    return () => { stopGlitch(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  return (
    <span
      className={`relative inline-block ${className} ${glitching ? 'cursor-default' : ''}`}
      onMouseEnter={trigger === 'hover' ? startGlitch : undefined}
      onMouseLeave={trigger === 'hover' ? stopGlitch : undefined}
      onClick={trigger === 'click' ? startGlitch : undefined}
      style={{ textShadow: glitching ? 'none' : undefined }}
      data-text={text}
    >
      {/* Main text layer */}
      <span
        className="relative z-10"
        style={{
          transform: `translateX(${offset}px)`,
          transition: 'transform 0.03s linear',
        }}
      >
        {displayText}
      </span>

      {/* RGB split layers — only during glitch */}
      {glitching && (
        <>
          <span
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              color: '#00F6FF',
              opacity: 0.35,
              transform: `translateX(${-offset - 2}px)`,
              clipPath: 'inset(10% 0 50% 0)',
              transition: 'transform 0.03s linear',
            }}
          >
            {displayText}
          </span>
          <span
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              color: '#FF003C',
              opacity: 0.25,
              transform: `translateX(${offset + 2}px)`,
              clipPath: 'inset(60% 0 10% 0)',
              transition: 'transform 0.03s linear',
            }}
          >
            {displayText}
          </span>
        </>
      )}
    </span>
  );
}
