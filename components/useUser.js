'use client';
import { useEffect, useState } from 'react';

// undefined = cargando, null = invitado, objeto = sesión iniciada.
let current;
let inflight = null;
const subs = new Set();

function set(u) {
  current = u;
  subs.forEach((f) => f());
}

export function setUser(u) {
  set(u);
}

export async function refreshUser() {
  try {
    const r = await fetch('/api/auth/yo', { cache: 'no-store' });
    const d = await r.json();
    set(d.user || null);
  } catch (e) {
    if (current === undefined) set(null);
  }
}

export function useUser() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    subs.add(f);
    if (current === undefined && !inflight) {
      inflight = refreshUser().finally(() => {
        inflight = null;
      });
    }
    return () => subs.delete(f);
  }, []);
  return { user: current ?? null, loading: current === undefined };
}
