'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdDashboard, MdReceiptLong, MdSportsEsports, MdLogout, MdRefresh, MdLock } from 'react-icons/md';

const Ctx = createContext({ data: null, reload: () => {}, loading: false });
export function useAdmin() {
  return useContext(Ctx);
}

const NAV = [
  ['/admin', 'Resumen', MdDashboard],
  ['/admin/pedidos', 'Pedidos', MdReceiptLong],
  ['/admin/juegos', 'Juegos', MdSportsEsports],
];

export default function AdminShell({ children }) {
  const path = usePathname() || '/admin';
  const [authed, setAuthed] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/resumen', { cache: 'no-store' });
      if (r.status === 401) {
        setAuthed(false);
      } else if (r.ok) {
        setData(await r.json());
        setAuthed(true);
      } else {
        setAuthed((a) => (a === null ? false : a));
        setErr('Error al cargar el resumen (' + r.status + ')');
      }
    } catch (e) {
      setErr('Sin conexion');
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
      setErr('Sin conexion');
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
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950/80 p-6">
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

  const active = (href) => (href === '/admin' ? path === '/admin' : path.startsWith(href));
  const current = NAV.find(([h]) => active(h)) || NAV[0];
  const pending = data?.counts?.PENDIENTE || 0;

  return (
    <Ctx.Provider value={{ data, reload, loading }}>
      <div className="min-h-screen text-white md:pl-60">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-white/10 bg-black/70 p-4 backdrop-blur md:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 text-black">
              <MdSportsEsports className="text-2xl" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold uppercase tracking-wide">Recargas BO</div>
              <div className="text-[11px] text-white/40">Panel de control</div>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={
                  'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ' +
                  (active(href)
                    ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-black'
                    : 'text-white/70 hover:bg-white/5')
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
          <button
            onClick={logout}
            className="mt-auto flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-white/60 hover:bg-white/5"
          >
            <MdLogout className="text-xl" /> Salir
          </button>
        </aside>

        <header className="sticky top-0 z-20 border-b border-white/10 bg-black/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <h1 className="font-display text-xl font-bold uppercase tracking-wide">{current[1]}</h1>
            <div className="flex gap-2">
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

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 md:pb-8">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-white/10 bg-black/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
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
