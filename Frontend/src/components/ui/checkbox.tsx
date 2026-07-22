'use client';

import { CheckIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  id?: string;
  indeterminate?: boolean;
  disabled?: boolean;
}

export function Checkbox({ checked, onCheckedChange, className, id, indeterminate, disabled }: CheckboxProps) {
  return (
    <button
      id={id}
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked ? 'true' : 'false'}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'inline-flex items-center justify-center w-4 h-4 rounded-none border transition-colors',
        checked || indeterminate
          ? 'bg-[#00F6FF] border-[#00F6FF] text-[#050505]'
          : 'border-white/20 hover:border-[#00F6FF]/50',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {indeterminate ? (
        <span className="block w-2 h-0.5 bg-current" />
      ) : checked ? (
        <CheckIcon className="h-3 w-3" strokeWidth={3} />
      ) : null}
    </button>
  );
}
