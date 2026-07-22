'use client';

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
  cursor?: boolean;
  onComplete?: () => void;
}

export function TypewriterText({
  text,
  speed = 50,
  delay = 0,
  className = '',
  cursor = true,
  onComplete,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState(delay > 0 ? '' : text[0] || '');
  const [idx, setIdx] = useState(delay > 0 ? 0 : 1);
  const [started, setStarted] = useState(delay <= 0);

  useEffect(() => {
    if (!started) {
      const t = setTimeout(() => setStarted(true), delay);
      return () => clearTimeout(t);
    }
  }, [delay, started]);

  useEffect(() => {
    if (!started || idx >= text.length) {
      if (started && idx >= text.length && onComplete) onComplete();
      return;
    }
    const t = setTimeout(() => {
      setDisplayed(text.slice(0, idx + 1));
      setIdx(i => i + 1);
    }, speed);
    return () => clearTimeout(t);
  }, [idx, started, text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {cursor && idx < text.length && (
        <span className="inline-block w-[3px] h-[1em] bg-current ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}
