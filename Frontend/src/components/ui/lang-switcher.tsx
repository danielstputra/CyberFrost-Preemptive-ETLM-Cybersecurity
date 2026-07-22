'use client';

import { useTranslation } from '@/providers/translation-provider';
import { getAvailableLanguages } from '@/lib/translations';
import { Globe } from 'lucide-react';

export function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang, t } = useTranslation();
  const languages = getAvailableLanguages();

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Globe className="h-3 w-3 text-[#6F7C89]" />
      {languages.map((l, i) => (
        <span key={l.code}>
          <button onClick={() => setLang(l.code)}
            className={`text-[10px] font-mono tracking-wider uppercase transition-colors ${
              lang === l.code ? 'text-[#00F6FF]' : 'text-[#6F7C89] hover:text-white'
            }`}>
            {l.code}
          </button>
          {i < languages.length - 1 && <span className="text-[#6F7C89] mx-0.5">|</span>}
        </span>
      ))}
    </div>
  );
}
