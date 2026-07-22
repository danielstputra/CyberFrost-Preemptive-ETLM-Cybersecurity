'use client';

interface GlitchTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'span' | 'p';
  neon?: 'yellow' | 'cyan' | 'red' | 'white';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const neonMap = {
  yellow: 'neon-text-yellow', cyan: 'neon-text-cyan', red: 'neon-text-red', white: 'neon-text-white',
};
const sizeMap = {
  sm: 'text-xs', md: 'text-sm', lg: 'text-lg', xl: 'text-2xl',
};

export function GlitchText({ children, className = '', as: Tag = 'span', neon, size = 'md' }: GlitchTextProps) {
  return (
    <Tag
      data-text={children}
      className={`glitch-text ${neon ? neonMap[neon] : ''} ${sizeMap[size]} tracking-wider ${className}`}
    >
      {children}
    </Tag>
  );
}
