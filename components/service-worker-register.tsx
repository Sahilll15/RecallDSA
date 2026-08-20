'use client';

import { useEffect } from 'react';

/** A registered service worker is part of Chrome's install criteria, even one this thin. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return null;
}
