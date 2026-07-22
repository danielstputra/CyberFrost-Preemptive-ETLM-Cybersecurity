'use client';

import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface HUDInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  error?: string;
  icon?: React.ReactNode;
}

export const HUDInput = forwardRef<HTMLInputElement, HUDInputProps>(({
  label, value, onChange, type = 'text', placeholder = '', required, minLength, error, icon
}, ref) => {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPw ? 'text' : type;

  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-mono tracking-[0.15em] uppercase text-[#6F7C89]">
        {icon && <span className="text-[#00F6FF]">{icon}</span>}
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-3 py-2.5 text-sm font-mono text-white outline-none transition-all duration-300 ${isPassword ? 'pr-10' : ''}`}
          style={{
            background: 'rgba(5,5,5,0.6)',
            border: `1px solid ${error ? '#FF003C' : focused ? '#FCEE09' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: error ? '0 0 8px rgba(255,0,60,0.3)' : focused ? '0 0 8px rgba(252,238,9,0.15)' : 'none',
          }}
        />
        {/* Show/Hide Password Toggle */}
        {isPassword && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6F7C89] hover:text-[#00F6FF] transition-colors"
            tabIndex={-1}>
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {/* Bottom line glow on focus */}
        {focused && (
          <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{
            background: 'linear-gradient(90deg, #FCEE09, transparent)',
          }} />
        )}
      </div>
      {error && <p className="text-[10px] font-mono text-[#FF003C]">{error}</p>}
    </div>
  );
});
HUDInput.displayName = 'HUDInput';
