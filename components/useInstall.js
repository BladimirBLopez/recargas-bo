'use client';
import { useEffect, useState } from 'react';

// El evento de instalación se guarda a nivel de módulo para no perderlo al cambiar de página.
let deferred = null;
let installedFlag = false;
const subs = new Set();
const notify = () => subs.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedFlag = true;
    notify();
  });
}

export function useInstall() {
  const [, force] = useState(0);
  const [env, setEnv] = useState({ standalone: false, ios: false });

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setEnv({
      standalone:
        window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
      ios: /iphone|ipad|ipod/i.test(ua),
    });
    const f = () => force((n) => n + 1);
    subs.add(f);
    return () => subs.delete(f);
  }, []);

  async function install() {
    if (!deferred) return 'none';
    deferred.prompt();
    let outcome = 'dismissed';
    try {
      outcome = (await deferred.userChoice).outcome;
    } catch (e) {}
    deferred = null;
    notify();
    return outcome;
  }

  return {
    canInstall: Boolean(deferred),
    installed: installedFlag || env.standalone,
    ios: env.ios,
    install,
  };
}
