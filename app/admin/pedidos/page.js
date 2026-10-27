'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MdContentCopy, MdCheck, MdSearch, MdPendingActions, MdPaid, MdLocalShipping,
  MdListAlt, MdClose, MdPerson, MdInbox,
} from 'react-icons/md';
import { useAdmin } from '@/components/admin/AdminShell';
import { ST, fmt, ago, pretty, bs } from '@/components/admin/ui';

const TABS = [
  ['PENDIENTE', 'Pendientes', MdPendingActions],
  ['PAGADO', 'Por entregar', MdPaid],
  ['ENTREGADO', 'Entregados', MdLocalShipping],
  ['todos', 'Todos', MdListAlt],
];

export default function Pedidos() {
  const { data, reload } = useAdmin();
  const [tab, setTab] = useState('PENDIENTE');
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(0);
  const [copied, setCopied] = useState(null);
  const [err, setErr] = useState('');
  const [ready, setReady] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/pedidos?status=' + tab, { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setOrders(d.orders || []);
        setErr('');
      } else setErr('Error al cargar los pedidos (' + r.status + ')');
    } catch (e) {
      setErr('Sin conexion');
    }
    setReady(true);
  }, [tab]);

  useEffect(() => {
    setReady(false);
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);
    return () => clearInterval(t);
  }, [load]);

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
      reload();
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
      reload();
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
    if (!term) return orders;
    return orders.filter(
      (o) =>
        o.code.toLowerCase().includes(term) ||
        String(o.player_id).includes(term) ||
        (o.nickname || '').toLowerCase().includes(term) ||
        String(o.game_slug).includes(term)
    );
  }, [orders, term]);

  return (
    <div>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {TABS.map(([k, label, Icon]) => {
          const on = tab === k;
          const n = data?.counts?.[k];
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
              {n !== undefined && <span className={'rounded-full px-1.5 text-xs ' + (on ? 'bg-black/20' : 'bg-white/10')}>{n}</span>}
            </button>
          );
        })}
      </div>

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

      {err && <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{err}</div>}

      {!ready && <div className="skeleton h-32 rounded-3xl" />}

      {ready && shown.length === 0 && (
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
                <button onClick={() => copy(o)} className="ml-auto flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs active:scale-95">
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
    </div>
  );
}
