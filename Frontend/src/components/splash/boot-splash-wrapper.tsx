'use client';

import { useState, useEffect } from 'react';
import { BootSplash } from './boot-splash';

export function BootSplashWrapper() {
  const [showSplash, setShowSplash] = useState(true);
  const [isCapacitor, setIsCapacitor] = useState(false);

  useEffect(() => {
    // Deteksi apakah running di Capacitor (APK) atau web
    const ua = navigator.userAgent || '';
    const cap = typeof (window as any).Capacitor !== 'undefined';
    setIsCapacitor(cap || ua.includes('Capacitor'));

    // Cek localStorage untuk skip splash di web
    if (!cap && !ua.includes('Capacitor')) {
      const skip = localStorage.getItem('splashShown');
      if (skip) {
        setShowSplash(false);
      } else {
        // Web: splash sekali, lalu simpan flag
        localStorage.setItem('splashShown', 'true');
      }
    }
  }, []);

  if (!showSplash) return null;

  return <BootSplash onFinish={() => setShowSplash(false)} />;
}
