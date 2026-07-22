'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface CyberSelectOption {
  value: string;
  label: string;
}

interface CyberSelectProps {
  options: CyberSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CyberSelect({ options, value, onChange, placeholder = 'Select...', className = '' }: CyberSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="cyber-input w-full flex items-center justify-between px-3 py-2.5 text-sm font-mono text-white cursor-pointer"
      >
        <span className={value ? 'text-white' : 'text-[#6F7C89]'}>{selectedLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-[#6F7C89] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full border border-white/5" style={{ background: '#0B0F14', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
          {/* Search */}
          <div className="relative border-b border-white/5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6F7C89]" />
            <input
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-transparent text-white outline-none placeholder:text-[#6F7C89]"
            />
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors ${
                  opt.value === value
                    ? 'text-[#00F6FF] bg-[rgba(0,246,255,0.05)]'
                    : 'text-white hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-4 text-center text-[10px] font-mono text-[#6F7C89]">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
