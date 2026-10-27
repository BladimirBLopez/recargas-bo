'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MdRefresh, MdLogout, MdContentCopy, MdCheck, MdSearch, MdPendingActions,
  MdPaid, MdLocalShipping, MdListAlt, MdSportsEsports, MdLock, MdDoneAll,
  MdClose, MdPerson, MdTrendingUp, MdInbox,
} from 'react-icons/md';
import AdminGames from '@/components/AdminGames';

const TABS = [
  ['PENDIENTE', 'Pendientes', MdPendingActions],
  ['PAGADO', 'Por entregar', MdPaid],
  ['ENTREGADO', 'Entregados', MdLocalShipping],
  ['todos', 'Todos', MdListAlt],
  ['juegos', 'Juegos', MdSportsEsports],
];

const ST = {
  PENDIENTE: { label: 'Pendiente', bar: 'bg-yellow-300', badge: 'bg-yellow-300/15 text-yellow-300 border-yellow-300/30' },
  PAGADO: { label: 'Pagado', bar: 'bg-sky-400', badge: 'bg-sky-400/15 text-sky-300 border-sky-400/30' },
  ENTREGADO: { label: 'Entregado', bar: 'bg-emerald-400', badge: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30' },
  CANCELADO: { label: 'Cancelado', bar: 'bg-red-400', badge: 'bg-red-400/15 text-red-300 border-red-400/30' },
  EXPIRADO: { label: 'Expirado', bar: 'bg-zinc-500', badge: 'bg-white/5 text-white/50 border-white/10' },
};

const BO_OFFSET = 4 * 3600 * 1000;
function boDay(d) {
  return new Date(new Date(d).getTime() - BO_OFFSET).toISOString().slice(0, 10);
}
function fmt(d) {
  try {
    return new Date(d).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/La_Paz' });
  } catch (e) {
    return '';
  }
}
function ago(d) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'ahora';
  if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
  return 'hace ' + Math.floor(s / 86400) + ' d';
}
function pretty(slug) {
  return String(slug || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function bs(n) {
  return 'Bs ' + Number(n || 0).toLocaleString('es-BO');
}

function Kpi({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</span>
        <span className={'grid h-8 w-8 place-items-center rounded-xl ' + accent}>
          <Icon className="text-lg" />
        </span>
      </div>
      <div className="mt-2 font-display text-3xl font-bold leading-none text-white">{value}</div>
      {hint && <div className="mt-1 text-xs text-white/40">{hint}</div>}
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(null);
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [tab, setTab] = useState('PENDIENTE');
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(0);
  const [copied, setCopied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/admin/pedidos?status=todos', { cache: 'no-store' });
      if (r.status === 401) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      const d = await r.json();
      if (r.ok) {
        setOrders(d.orders || []);
        setAuthed(true);
        setUpdated(new Date());
        setErr('');
      } else {
        setErr('Error al cargar los pedidos');
      }
    } catch (e) {
      setErr('Sin conexion');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);
    return () => clearInterval(t);
  }, [load]);

  const stats = useMemo(() => {
    const today = boDay(Date.now());
    const month = today.slice(0, 7);
    const s = { PENDIENTE: 0, PAGADO: 0, ENTREGADO: 0, todos: orders.length, hoy: 0, hoyN: 0, mes: 0 };
    orders.forEach((o) => {
      if (s[o.status] !== undefined) s[o.status] += 1;
      if (o.status === 'PAGADO' || o.status === 'ENTREGADO') {
        const day = boDay(o.paid_at || o.created_at);
        if (day === today) {
          s.hoy += Number(o.price || 0);
          s.hoyN += 1;
        }
        if (day.slice(0, 7) === month) s.mes += Number(o.price || 0);
      }
    });
    return s;
  }, [orders]);

  useEffect(() => {
    document.title = (stats.PENDIENTE ? '(' + stats.PENDIENTE + ') ' : '') + 'Admin · Recargas BO';
  }, [stats.PENDIENTE]);

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
        await load();
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
    setAuthed(false);
    setOrders([]);
  }

  async function patch(id, status) {
    const r = await fetch('/api/admin/pedidos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    return r.ok;
  }

  async function change(o, to) {
    if (to === 'CANCELADO' && !window.confirm('Cancelar el pedido ' + o.code + '?')) return;
    setErr('');
    setBusy(o.id);
    try {
      if (!(await patch(o.id, to))) setErr('No se pudo cambiar el estado');
      await load();
    } catch (e) {
      setErr('Sin conexion');
    }
    setBusy(0);
  }

  async function both(o) {
    setErr('');
    setBusy(o.id);
    try {
      const a = await patch(o.id, 'PAGADO');
      const b = a ? await patch(o.id, 'ENTREGADO') : false;
      if (!b) setErr('No se pudo completar el pedido ' + o.code);
      await load();
    } catch (e) {
      setErr('Sin conexion');
    }
    setBusy(0);
  }

  function copy(o) {
    try {
      navigator.clipboard.writeText(o.player_id);
      setCopied(o.id);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {}
  }

  const term = search.trim().toLowerCase();
  const shown = useMemo(() => {
    let list = tab === 'juegos' ? [] : tab === 'todos' ? orders : orders.filter((o) => o.status === tab);
    if (term) {
      list = list.filter(
        (o) =>
          o.code.toLowerCase().includes(term) ||
          String(o.player_id).includes(term) ||
          (o.nickname || '').toLowerCase().includes(term) ||
          String(o.game_slug).includes(term)
      );
    }
    return list.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [orders, tab, term]);

  if (authed === null) {
    return (
      <div className="grid min-h-screen place-items-center text-white/60">
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

  return (
    <div className="min-h-screen text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 text-black">
              <MdSportsEsports className="text-xl" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold uppercase tracking-wide">Admin</div>
              <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {updated ? 'Actualizado ' + ago(updated) : 'Conectando'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              aria-label="Actualizar"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 active:scale-95"
            >
              <MdRefresh className={'text-xl ' + (loading ? 'animate-spin' : '')} />
            </button>
            <button
              onClick={logout}
              aria-label="Salir"
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 active:scale-95"
            >
              <MdLogout className="text-xl" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4">
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi icon={MdPendingActions} label="Pendientes" value={stats.PENDIENTE} hint="Esperando pago" accent="bg-yellow-300/15 text-yellow-300" />
          <Kpi icon={MdPaid} label="Por entregar" value={stats.PAGADO} hint="Pagados sin entregar" accent="bg-sky-400/15 text-sky-300" />
          <Kpi icon={MdTrendingUp} label="Ventas hoy" value={bs(stats.hoy)} hint={stats.hoyN + ' pedidos'} accent="bg-emerald-400/15 text-emerald-300" />
          <Kpi icon={MdDoneAll} label="Ventas del mes" value={bs(stats.mes)} hint="Pagados + entregados" accent="bg-orange-400/15 text-orange-300" />
        </div>

        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
          {TABS.map(([k, label, Icon]) => {
            const n = k === 'juegos' ? null : stats[k];
            const on = tab === k;
            return (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={
                  'flex shrink-0 items-center gap-1.5 rounded-2xl border px-4 py-2 text-sm font-bold transition ' +
                  (on
                    ? 'border-transparent bg-gradient-to-r from-yellow-300 to-orange-400 text-black shadow-lg shadow-orange-500/20'
                    : 'border-white/10 bg-white/5 text-white/80')
                }
              >
                <Icon className="text-lg" />
                {label}
                {n !== null && (
                  <span className={'rounded-full px-1.5 text-xs ' + (on ? 'bg-black/20' : 'bg-white/10')}>{n}</span>
                )}
              </button>
            );
          })}
        </div>

        {tab !== 'juegos' && (
          <div className="relative mb-4">
            <MdSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por codigo, ID, nickname o juego"
              className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm text-white outline-none focus:border-yellow-300/50"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                <MdClose className="text-xl" />
              </button>
            )}
          </div>
        )}

        {err && (
          <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>
        )}

        {tab === 'juegos' && <AdminGames />}

        {tab !== 'juegos' && shown.length === 0 && (
          <div className="grid place-items-center rounded-3xl border border-dashed border-white/10 py-16 text-white/40">
            <MdInbox className="mb-2 text-5xl" />
            <p className="text-sm">No hay pedidos aqui.</p>
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((o) => {
            const st = ST[o.status] || ST.EXPIRADO;
            const working = busy === o.id;
            return (
              <div key={o.id} className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/80 p-4 pl-5">
                <span className={'absolute inset-y-0 left-0 w-1.5 ' + st.bar} />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono text-base font-bold text-yellow-300">{o.code}</div>
                    <div className="text-xs text-white/40">{ago(o.created_at)} · {fmt(o.created_at)}</div>
                  </div>
                  <span className={'rounded-full border px-3 py-0.5 text-xs font-bold ' + st.badge}>{st.label}</span>
                </div>

                <div className="mt-3 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{pretty(o.game_slug)}</div>
                    <div className="truncate text-sm text-white/60">{o.package_label}</div>
                  </div>
                  <div className="font-display text-2xl font-bold">{bs(o.price)}</div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-sm">
                  <span className="text-white/50">ID</span>
                  <span className="font-mono font-semibold">{o.player_id}</span>
                  <button
                    onClick={() => copy(o)}
                    className="ml-auto flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs active:scale-95"
                  >
                    {copied === o.id ? <MdCheck className="text-emerald-300" /> : <MdContentCopy />}
                    {copied === o.id ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                {o.nickname && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
                    <MdPerson className="text-base" /> {o.nickname}
                  </div>
                )}
                {o.paid_at && <div className="mt-1 text-xs text-white/40">Pagado: {fmt(o.paid_at)}</div>}

                {o.status === 'PENDIENTE' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      disabled={working}
                      onClick={() => both(o)}
                      className="col-span-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-orange-500/30 disabled:opacity-50"
                    >
                      Pagado + entregado
                    </button>
                    <button
                      disabled={working}
                      onClick={() => change(o, 'PAGADO')}
                      className="rounded-2xl border border-sky-400/30 bg-sky-400/10 px-3 py-2.5 text-sm font-bold text-sky-300 disabled:opacity-50"
                    >
                      Solo pagado
                    </button>
                    <button
                      disabled={working}
                      onClick={() => change(o, 'CANCELADO')}
                      className="rounded-2xl border border-red-400/30 bg-red-400/10 px-3 py-2.5 text-sm font-bold text-red-300 disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {o.status === 'PAGADO' && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      disabled={working}
                      onClick={() => change(o, 'ENTREGADO')}
                      className="rounded-2xl bg-emerald-400 px-3 py-3 text-sm font-bold text-black disabled:opacity-50"
                    >
                      Marcar entregado
                    </button>
                    <button
                      disabled={working}
                      onClick={() => change(o, 'PENDIENTE')}
                      className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm font-bold text-white/80 disabled:opacity-50"
                    >
                      Volver a pendiente
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
