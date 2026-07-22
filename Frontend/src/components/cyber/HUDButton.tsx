'use client';

import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { HackerText } from './HackerText';

interface HUDButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'yellow' | 'cyan' | 'red';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  /** When set, renders the text with the hacker glitch animation instead of children text */
  glitchText?: string;
}

/** Extract text content from React children for glitch data-text attribute */
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) {
    return children.map(c => extractText(c)).join('').trim();
  }
  if (typeof children === 'object' && children && 'props' in (children as any)) {
    const props = (children as any).props;
    // Handle components with `text` prop (like TypewriterText)
    if (typeof props.text === 'string') return props.text;
    return extractText(props.children);
  }
  return '';
}

export const HUDButton = forwardRef<HTMLButtonElement, HUDButtonProps>(({
  children, onClick, variant = 'yellow', size = 'md', disabled, loading, className = '', type = 'button', glitchText,
}, ref) => {
  const colors = {
    yellow: { bg: '#FCEE09', text: '#050505', glow: 'rgba(252,238,9,0.4)', border: '#FCEE09' },
    cyan: { bg: '#00F6FF', text: '#050505', glow: 'rgba(0,246,255,0.4)', border: '#00F6FF' },
    red: { bg: '#FF003C', text: '#fff', glow: 'rgba(255,0,60,0.4)', border: '#FF003C' },
  };
  const c = colors[variant];
  const sizes = { sm: 'px-3 py-1.5 text-[10px]', md: 'px-5 py-2.5 text-xs', lg: 'px-8 py-3.5 text-sm' };

  return (
    <motion.button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.02, boxShadow: `0 0 25px ${c.glow}` }}
      whileTap={{ scale: 0.97 }}
      className={`${sizes[size]} font-mono font-bold tracking-wider uppercase angle-sm transition-all duration-200 disabled:opacity-40 ${className}`}
      style={{
        background: c.bg, color: c.text, border: `1px solid ${c.border}`,
        boxShadow: `0 0 8px ${c.glow.replace('0.4','0.2')}`,
      }}
    >
      <span className="btn-glitch-text relative flex items-center justify-center gap-2.5" data-text={extractText(children) || glitchText || ''}>
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <HackerText text="PROCESSING" trigger="auto" scrambleSpeed={80} glitchDuration={2000} />
          </>
        ) : glitchText ? (
          <>
            {children}
            <HackerText text={glitchText} trigger="hover" scrambleSpeed={50} glitchDuration={600} />
          </>
        ) : children}
      </span>
    </motion.button>
  );
});
HUDButton.displayName = 'HUDButton';
