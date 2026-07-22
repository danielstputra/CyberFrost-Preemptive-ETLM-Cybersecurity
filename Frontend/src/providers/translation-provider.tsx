'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, getTranslation, getStoredLanguage, storeLanguage } from '@/lib/translations';

interface TranslationContextProps {
  lang: Lang;
  t: (key: string, fallback?: string) => string;
  setLang: (lang: Lang) => void;
}

const TranslationContext = createContext<TranslationContextProps>({
  lang: 'en',
  t: (key: string, fallback?: string) => fallback || key,
  setLang: () => {},
});

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en');

  useEffect(() => {
    // After hydration, load stored/browser language
    setLangState(getStoredLanguage());
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    storeLanguage(newLang);
  };

  const t = (key: string, fallback?: string): string => {
    return getTranslation(lang, key, fallback);
  };

  return (
    <TranslationContext.Provider value={{ lang, t, setLang }}>
      <div lang={lang === 'id' ? 'id' : 'en'}>
        {children}
      </div>
    </TranslationContext.Provider>
  );
}

export const useTranslation = () => useContext(TranslationContext);
