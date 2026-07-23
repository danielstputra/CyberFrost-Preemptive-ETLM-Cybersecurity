'use client';

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { BootSplash } from './boot-splash';

const SplashContext = createContext<{ show: (mini?: boolean) => void }>({ show: () => {} });
export const useSplash = () => useContext(SplashContext);

export function BootSplashWrapper() {
  const [visible, setVisible] = useState(false);
  const [isMini, setIsMini] = useState(false);
  const firstLoad = useRef(true);
  const pathname = usePathname();

  const showSplash = useCallback((mini = true) => {
    setIsMini(mini);
    setVisible(true);
  }, []);

  const hideSplash = useCallback(() => {
    setVisible(false);
  }, []);

  // Initial boot — delay biar gak black box flash
  useEffect(() => {
    if (firstLoad.current) {
      const showTimer = setTimeout(() => {
        setIsMini(false);
        setVisible(true);
      }, 150);
      return () => clearTimeout(showTimer);
    }
  }, []);

  // Set firstLoad = false setelah boot selesai
  useEffect(() => {
    if (firstLoad.current && !visible) {
      firstLoad.current = false;
    }
  }, [visible]);

  // Navigasi halaman → splash mini
  useEffect(() => {
    if (!firstLoad.current && pathname) {
      showSplash(true);
    }
  }, [pathname, showSplash]);

  return (
    <SplashContext.Provider value={{ show: showSplash }}>
      {visible && <BootSplash mini={isMini} onFinish={hideSplash} />}
    </SplashContext.Provider>
  );
}
