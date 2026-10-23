'use client';
import { useState, useEffect, useCallback } from 'react';

const TABS = [
  ['PENDIENTE', 'Pendientes'],
  ['PAGADO', 'Pagados'],
  ['ENTREGADO', 'Entregados'],
  ['todos', 'Todos'],
];
const ACTIONS = {
  PENDIENTE: [
    ['PAGADO', 'Marcar pagado', 'bg-yellow-300 text-black'],
    ['CANCELADO', 'Cancelar', 'bg-white/10 text-white'],
  ],
  PAGADO: [
    ['ENTREGADO', 'Marcar entregado', 'bg-green-400 text-black'],
    ['PENDIENTE', 'Volver a pendiente', 'bg-white/10 text-white'],
  ],
};
const BADGE = {
  PENDIENTE: 'bg-yellow-300/20 text-yellow-300',
  PAGADO: 'bg-blue-400/20 text-blue-300',
  ENTREGADO: 'bg-green-400/20 text-green-300',
  CANCELADO: 'bg-red-400/20 text-red-300',
  EXPIRADO: 'bg-white/10 text-white/60',
};

function fmt(d) {
  try {
    return new Date(d).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return '';
  }
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

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/pedidos?status=' + tab, { cache: 'no-store' });
      if (r.status === 401) {
        setAuthed(false);
        return;
      }
      const d = await r.json();
      if (r.ok) {
        setOrders(d.orders || []);
        setAuthed(true);
      } else {
        setErr('Error al cargar los pedidos');
      }
    } catch (e) {
      setErr('Sin conexion');
    }
  }, [tab]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => clearInterval(t);
  }, [load]);

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

  async function change(o, to) {
    if (to === 'CANCELADO' && !window.confirm('Cancelar el pedido ' + o.code + '?')) return;
    setErr('');
    setBusy(o.id);
    try {
      const r = await fetch('/api/admin/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: o.id, status: to }),
      });
      if (!r.ok) setErr('No se pudo cambiar el estado (' + r.status + ')');
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
  const shown = term
    ? orders.filter(
        (o) =>
          o.code.toLowerCase().includes(term) ||
          o.player_id.includes(term) ||
          (o.nickname || '').toLowerCase().includes(term)
      )
    : orders;

  if (authed === null) {
    return <div className="p-6 text-white/60">Cargando...</div>;
  }

  if (authed === false) {
    return (
      <div className="mx-auto max-w-sm p-6 text-white">
        <h1 className="mb-4 text-xl font-bold text-yellow-300">Panel de pedidos</h1>
        <input
          type="password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') login();
          }}
          placeholder="Clave"
          className="mb-3 w-full rounded-xl bg-white/10 px-4 py-3 text-white outline-none"
        />
        <button onClick={login} className="w-full rounded-xl bg-yellow-300 px-4 py-3 font-bold text-black">
          Entrar
        </button>
        {err && <p className="mt-3 text-sm text-red-300">{err}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-yellow-300">Pedidos</h1>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg bg-white/10 px-3 py-1 text-sm">
            Actualizar
          </button>
          <button onClick={logout} className="rounded-lg bg-white/10 px-3 py-1 text-sm">
            Salir
          </button>
        </div>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto">
        {TABS.map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={
              'whitespace-nowrap rounded-full px-4 py-1 text-sm font-bold ' +
              (tab === k ? 'bg-yellow-300 text-black' : 'bg-white/10 text-white')
            }
          >
            {label}
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por codigo, ID o nickname"
        className="mb-3 w-full rounded-xl bg-white/10 px-4 py-2 text-sm text-white outline-none"
      />

      {err && <p className="mb-3 text-sm text-red-300">{err}</p>}
      {shown.length === 0 && <p className="text-white/60">No hay pedidos aqui.</p>}

      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="rounded-2xl bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-yellow-300">{o.code}</span>
              <span className={'rounded-full px-3 py-0.5 text-xs font-bold ' + (BADGE[o.status] || '')}>
                {o.status}
              </span>
            </div>
            <div className="mt-1 text-sm">
              {o.game_slug} · {o.package_label} · <b>Bs {Number(o.price)}</b>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-white/80">
              <span>ID: {o.player_id}</span>
              <button onClick={() => copy(o)} className="rounded bg-white/10 px-2 py-0.5 text-xs">
                {copied === o.id ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            {o.nickname && <div className="text-sm text-white/60">Usuario: {o.nickname}</div>}
            <div className="mt-1 text-xs text-white/50">
              Creado: {fmt(o.created_at)}
              {o.paid_at ? ' · Pagado: ' + fmt(o.paid_at) : ''}
            </div>
            {ACTIONS[o.status] && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ACTIONS[o.status].map(([to, label, cls]) => (
                  <button
                    key={to}
                    disabled={busy === o.id}
                    onClick={() => change(o, to)}
                    className={'rounded-xl px-4 py-2 text-sm font-bold ' + cls}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
