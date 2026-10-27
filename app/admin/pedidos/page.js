'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  MdContentCopy, MdCheck, MdSearch, MdPendingActions, MdPaid, MdLocalShipping,
  MdListAlt, MdClose, MdPerson, MdInbox, MdChatBubbleOutline, MdFilterList,
} from 'react-icons/md';
import { SITE_NAME } from '@/data/games';
import { useAdmin } from '@/components/admin/AdminShell';
import { ST, fmt, ago, pretty, bs } from '@/components/admin/ui';

const TABS = [
  ['PENDIENTE', 'Pendientes', MdPendingActions],
  ['PAGADO', 'Por entregar', MdPaid],
  ['ENTREGADO', 'Entregados', MdLocalShipping],
  ['todos', 'Todos', MdListAlt],
];

function boDate(back = 0) {
  return new Date(Date.now() - 4 * 3600 * 1000 - back * 86400 * 1000).toISOString().slice(0, 10);
}

function msg(o) {
  const hi = o.nickname ? 'Hola ' + o.nickname + '! ' : 'Hola! ';
  const item = pretty(o.game_slug) + ' (' + o.package_label + ') por ' + bs(o.price);
  if (o.status === 'ENTREGADO')
    return hi + 'Tu recarga de ' + item + ' ya fue entregada. Pedido ' + o.code + '. Gracias por tu compra en ' + SITE_NAME + '!';
  if (o.status === 'PAGADO')
    return hi + 'Recibimos tu pago de ' + item + '. Estamos procesando tu recarga, en breve te avisamos. Pedido ' + o.code + '.';
  return hi + 'Tu pedido ' + o.code + ' de ' + item + ' esta pendiente de pago. Cuando pagues, enviame el comprobante para entregarte tu recarga.';
}

export default function Pedidos() {
  const { data, reload } = useAdmin();
  const [tab, setTab] = useState('PENDIENTE');
  const [game, setGame] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [qd, setQd] = useState('');
  const [limit, setLimit] = useState(30);
  const [res, setRes] = useState({ orders: [], more: false, total: 0, vendido: 0, games: [] });
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(0);
  const [copied, setCopied] = useState(null);
  const [err, setErr] = useState('');
  const [showF, setShowF] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setQd(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ status: tab, limit: String(limit) });
    if (game) p.set('game', game);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (qd) p.set('q', qd);
    try {
      const r = await fetch('/api/admin/pedidos?' + p.toString(), { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setRes(d);
        setErr('');
      } else setErr('Error al cargar los pedidos (' + r.status + ')');
    } catch (e) {
      setErr('Sin conexion');
    }
    setReady(true);
  }, [tab, game, from, to, qd, limit]);

  useEffect(() => {
    setLimit(30);
    setReady(false);
  }, [tab, game, from, to, qd]);

  useEffect(() => {
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

  async function change(o, next) {
    if (next === 'CANCELADO' && !window.confirm('Cancelar el pedido ' + o.code + '?')) return;
    setErr('');
    setBusy(o.id);
    try {
      if (!(await patch(o.id, next))) setErr('No se pudo cambiar el estado');
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

  function copy(key, text) {
    try {
      navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch (e) {}
  }

  const chips = [
    ['Hoy', boDate(0), boDate(0)],
    ['7 dias', boDate(6), boDate(0)],
    ['Este mes', boDate(0).slice(0, 8) + '01', boDate(0)],
  ];
  const nFilters = (game ? 1 : 0) + (from || to ? 1 : 0);
  const shown = res.orders;

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

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <MdSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Codigo, ID o nickname"
            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-10 text-sm text-white outline-none focus:border-yellow-300/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
              <MdClose className="text-xl" />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowF((v) => !v)}
          className={
            'relative flex items-center gap-1.5 rounded-2xl border px-4 text-sm font-bold ' +
            (showF || nFilters ? 'border-yellow-300/40 bg-yellow-300/10 text-yellow-300' : 'border-white/10 bg-white/5 text-white/80')
          }
        >
          <MdFilterList className="text-xl" /> Filtros
          {nFilters > 0 && <span className="rounded-full bg-yellow-300 px-1.5 text-xs text-black">{nFilters}</span>}
        </button>
      </div>

      {showF && (
        <div className="mb-3 space-y-3 rounded-3xl border border-white/10 bg-zinc-950/80 p-4">
          <div className="flex flex-wrap gap-2">
            {chips.map(([label, f, t]) => {
              const on = from === f && to === t;
              return (
                <button
                  key={label}
                  onClick={() => {
                    setFrom(f);
                    setTo(t);
                  }}
                  className={'rounded-full border px-3 py-1 text-xs font-bold ' + (on ? 'border-transparent bg-yellow-300 text-black' : 'border-white/10 bg-white/5 text-white/70')}
                >
                  {label}
                </button>
              );
            })}
            <button
              onClick={() => {
                setFrom('');
                setTo('');
                setGame('');
              }}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-white/70"
            >
              Limpiar
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-white/50">
              Desde
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
              />
            </label>
            <label className="text-xs text-white/50">
              Hasta
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none [color-scheme:dark]"
              />
            </label>
          </div>
          <label className="block text-xs text-white/50">
            Juego
            <select
              value={game}
              onChange={(e) => setGame(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white outline-none"
            >
              <option value="">Todos los juegos</option>
              {(res.games || []).map((s) => (
                <option key={s} value={s}>
                  {pretty(s)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {ready && (
        <div className="mb-3 flex items-center justify-between text-xs text-white/50">
          <span>{res.total} pedidos</span>
          <span>
            Vendido: <b className="text-emerald-300">{bs(res.vendido)}</b>
          </span>
        </div>
      )}

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
                <button onClick={() => copy('id' + o.id, o.player_id)} className="ml-auto flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-xs active:scale-95">
                  {copied === 'id' + o.id ? <MdCheck className="text-emerald-300" /> : <MdContentCopy />}
                  {copied === 'id' + o.id ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              {o.nickname && (
                <div className="mt-2 flex items-center gap-1.5 text-sm text-white/60">
                  <MdPerson className="text-base" /> {o.nickname}
                </div>
              )}
              {o.paid_at && <div className="mt-1 text-xs text-white/40">Pagado: {fmt(o.paid_at)}</div>}

              {(o.status === 'PENDIENTE' || o.status === 'PAGADO' || o.status === 'ENTREGADO') && (
                <button
                  onClick={() => copy('m' + o.id, msg(o))}
                  className="mt-3 flex items-center gap-1.5 rounded-xl border border-green-400/30 bg-green-400/10 px-3 py-2 text-xs font-bold text-green-300 active:scale-95"
                >
                  {copied === 'm' + o.id ? <MdCheck className="text-base" /> : <MdChatBubbleOutline className="text-base" />}
                  {copied === 'm' + o.id ? 'Mensaje copiado' : 'Copiar mensaje para el cliente'}
                </button>
              )}

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

      {ready && res.more && (
        <button
          onClick={() => setLimit((l) => l + 30)}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-white/80 active:scale-[0.99]"
        >
          Cargar mas
        </button>
      )}
    </div>
  );
}
