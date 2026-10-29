'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import { setNames } from '@/components/admin/ui';
import { usePathname } from 'next/navigation';
import { MdDashboard, MdReceiptLong, MdSportsEsports, MdLogout, MdRefresh, MdLock, MdBarChart, MdNotificationsActive, MdNotificationsOff, MdSettings, MdOpenInNew, MdCircle } from 'react-icons/md';

const Ctx = createContext({ data: null, reload: () => {}, loading: false });
export function useAdmin() {
  return useContext(Ctx);
}

const NAV = [
  ['/admin', 'Dashboard', MdDashboard],
  ['/admin/pedidos', 'Pedidos', MdReceiptLong],
  ['/admin/reportes', 'Reportes', MdBarChart],
  ['/admin/ajustes', 'Ajustes', MdSettings],
];

export default function AdminShell({ children }) {
  const path = usePathname() || '/admin';
  const [authed, setAuthed] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [sound, setSound] = useState(false);
  const [alertN, setAlertN] = useState(0);
  const prevPend = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    try {
      setSound(localStorage.getItem('rb_admin_sound') === '1');
    } catch (e) {}
  }, []);

  function beep() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioRef.current) audioRef.current = new AC();
      const ac = audioRef.current;
      if (ac.state === 'suspended') ac.resume();
      [0, 0.2].forEach((t, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = i ? 1175 : 880;
        g.gain.setValueAtTime(0.0001, ac.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.35, ac.currentTime + t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + t + 0.18);
        o.connect(g);
        g.connect(ac.destination);
        o.start(ac.currentTime + t);
        o.stop(ac.currentTime + t + 0.2);
      });
    } catch (e) {}
  }

  function toggleSound() {
    const next = !sound;
    setSound(next);
    try {
      localStorage.setItem('rb_admin_sound', next ? '1' : '0');
    } catch (e) {}
    if (next) {
      beep();
      try {
        navigator.vibrate && navigator.vibrate(150);
      } catch (e) {}
    }
  }

  useEffect(() => {
    if (!data) return;
    const n = data.counts?.PENDIENTE || 0;
    if (prevPend.current !== null && n > prevPend.current) {
      setAlertN((a) => a + (n - prevPend.current));
      if (sound) {
        beep();
        try {
          navigator.vibrate && navigator.vibrate([200, 100, 200]);
        } catch (e) {}
      }
    }
    prevPend.current = n;
  }, [data, sound]);

  useEffect(() => {
    if (!alertN) return;
    const t = setTimeout(() => setAlertN(0), 8000);
    return () => clearTimeout(t);
  }, [alertN]);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/resumen', { cache: 'no-store' });
      if (r.status === 401) {
        setAuthed(false);
      } else if (r.ok) {
        const d = await r.json();
        setNames(d.names);
        setData(d);
        setAuthed(true);
      } else {
        setAuthed((a) => (a === null ? false : a));
        setErr('Error al cargar el resumen (' + r.status + ')');
      }
    } catch (e) {
      setErr('Sin conexión');
      setAuthed((a) => (a === null ? false : a));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') reload();
    }, 15000);
    return () => clearInterval(t);
  }, [reload]);

  useEffect(() => {
    const n = data?.counts?.PENDIENTE || 0;
    document.title = (n ? '(' + n + ') ' : '') + 'Admin · Recargas BO';
  }, [data]);

  async function login() {
    setErr('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (r.ok) {
        setPw('');
        await reload();
      } else if (r.status === 429) setErr('Demasiados intentos. Espera un minuto.');
      else if (r.status === 500) setErr('Falta configurar ADMIN_PASSWORD en Vercel.');
      else setErr('Clave incorrecta');
    } catch (e) {
      setErr('Sin conexión');
    }
  }

  async function logout() {
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
    } catch (e) {}
    setData(null);
    setAuthed(false);
  }

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="skeleton h-10 w-40 rounded-2xl" />
      </div>
    );
  }

  if (authed === false) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-white">
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
          <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 text-black">
            <MdLock className="text-2xl" />
          </div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Panel de control</h1>
          <p className="mb-5 mt-1 text-sm text-white/50">Ingresa tu clave de administrador.</p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') login();
            }}
            placeholder="Clave"
            className="mb-3 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-yellow-300/60"
          />
          <button
            onClick={login}
            className="w-full rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 px-4 py-3 font-bold text-black shadow-lg shadow-orange-500/30"
          >
            Entrar
          </button>
          {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
        </div>
      </div>
    );
  }

  const CAT = ['/admin/ajustes', '/admin/juegos', '/admin/servicios', '/admin/banners'];
  const active = (href) =>
    href === '/admin' ? path === '/admin' : href === '/admin/ajustes' ? CAT.some((p) => path.startsWith(p)) : path.startsWith(href);
  const current = NAV.find(([h]) => active(h)) || NAV[0];
  const pending = data?.counts?.PENDIENTE || 0;

  return (
    <Ctx.Provider value={{ data, reload, loading }}>
      <div className="min-h-screen text-white md:pl-64">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/10 bg-[#090e1c]/95 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl md:flex">
          <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#00D9FF] to-[#007BFF] text-slate-950 shadow-lg shadow-cyan-500/20">
              <MdSportsEsports className="text-2xl" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold uppercase tracking-wide">Recargas BO</div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D9FF]">Admin Console</div>
            </div>
          </div>
          <div className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Menú principal</div>
          <nav className="space-y-1.5">
            {NAV.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={
                  'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ' +
                  (active(href)
                    ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-400/20 to-blue-500/10 text-[#7DEEFF] shadow-sm shadow-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-white')
                }
              >
                <Icon className="text-xl" />
                {label}
                {href === '/admin/pedidos' && pending > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 text-xs text-white">{pending}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-3">
              <MdCircle className="text-[9px] text-emerald-400" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-emerald-300">Sistema operativo</div>
                <div className="text-[10px] text-white/40">Panel de administración</div>
              </div>
            </div>
            <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-white">
              <MdOpenInNew className="text-xl" /> Ver tienda
            </Link>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 transition hover:bg-red-500/10 hover:text-red-300"
          >
            <MdLogout className="text-xl" /> Cerrar sesión
          </button>
          </div>
        </aside>

        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#090e1c]/90 shadow-lg shadow-black/10 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-7">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#00D9FF]">Recargas BO / Administración</div>
              <h1 className="truncate text-lg font-bold tracking-tight text-white md:text-xl">{current[1]}</h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleSound}
                aria-label={sound ? 'Apagar sonido de avisos' : 'Activar sonido de avisos'}
                className={'grid h-10 w-10 place-items-center rounded-xl border active:scale-95 ' + (sound ? 'border-yellow-300/40 bg-yellow-300/10 text-yellow-300' : 'border-white/10 bg-white/5 text-white/60')}
              >
                {sound ? <MdNotificationsActive className="text-xl" /> : <MdNotificationsOff className="text-xl" />}
              </button>
              <ThemeToggle className="h-10 w-10 rounded-xl border border-white/10 bg-white/5" />
              <button
                onClick={reload}
                aria-label="Actualizar"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 active:scale-95"
              >
                <MdRefresh className={'text-xl ' + (loading ? 'animate-spin' : '')} />
              </button>
              <button
                onClick={logout}
                aria-label="Salir"
                className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 active:scale-95 md:hidden"
              >
                <MdLogout className="text-xl" />
              </button>
            </div>
          </div>
        </header>

        {alertN > 0 && (
          <Link
            href="/admin/pedidos"
            onClick={() => setAlertN(0)}
            className="fixed inset-x-3 top-3 z-50 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#00E5FF] to-[#009DFF] px-4 py-3 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/30 md:left-[17rem]"
          >
            <MdNotificationsActive className="text-2xl" />
            {alertN === 1 ? 'Nuevo pedido pendiente' : alertN + ' pedidos nuevos pendientes'}
            <span className="ml-auto text-xs">Ver</span>
          </Link>
        )}
        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 md:px-7 md:pb-10 md:pt-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-white/10 bg-[#090e1c]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.3)] backdrop-blur-xl md:hidden">
          {NAV.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={'relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold ' + (active(href) ? 'text-yellow-300' : 'text-white/50')}
            >
              <Icon className="text-2xl" />
              {label}
              {href === '/admin/pedidos' && pending > 0 && (
                <span className="absolute right-[28%] top-1.5 rounded-full bg-red-500 px-1.5 text-[10px] text-white">{pending}</span>
              )}
            </Link>
          ))}
        </nav>
      </div>
    </Ctx.Provider>
  );
}
