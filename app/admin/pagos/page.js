'use client';
import { useEffect, useState, useCallback } from 'react';

const card = 'rounded-2xl border border-white/10 bg-zinc-950/80 p-4';
const btn = 'rounded-xl bg-gradient-to-r from-yellow-300 to-orange-400 px-3 py-2 text-xs font-bold text-black active:scale-95 disabled:opacity-50';
const mini = 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white/80 active:scale-95 disabled:opacity-50';
const LABEL = { varios: 'Varios pedidos', sin_pedido: 'Sin pedido', repetido: 'Repetido', procesando: 'Atascado' };
const ERR = {
  pedido_ya_pagado: 'Ese pedido ya tiene un pago',
  pedido_no_valido: 'El pedido ya esta pagado o el monto no coincide',
  ya_resuelto: 'Ese pago ya fue resuelto',
};

function ago(d) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return 'ahora';
  if (s < 3600) return 'hace ' + Math.floor(s / 60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s / 3600) + ' h';
  return 'hace ' + Math.floor(s / 86400) + ' d';
}
function pretty(s) {
  return String(s || '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function bs(n) {
  return 'Bs ' + Number(n || 0).toLocaleString('es-BO');
}

export default function Pagos() {
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin/pagos', { cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (r.ok) setList(d.pagos || []);
      else setMsg('No se pudo cargar (' + r.status + ')');
    } catch (e) {
      setMsg('Sin conexion');
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 15000);
    return () => clearInterval(t);
  }, [load]);

  async function act(msgId, action, code) {
    if (action === 'descartar' && !window.confirm('Descartar este pago? Usalo si es repetido o no es de la tienda.')) return;
    if (action === 'asignar' && !window.confirm('Confirmar el pedido ' + code + ' con este pago?')) return;
    setBusy(msgId);
    setMsg('');
    try {
      const r = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msgId, action, code }),
      });
      const d = await r.json().catch(() => ({}));
      setMsg(r.ok ? 'Listo ✔' : ERR[d.error] || 'Error al guardar');
    } catch (e) {
      setMsg('Sin conexion');
    }
    setBusy('');
    await load();
  }

  return (
    <div className="space-y-4 pb-24">
      <p className="text-sm text-white/60">
        Pagos que llegaron al correo y no se pudieron asignar solos. Elige el pedido correcto o descarta el pago si es repetido.
      </p>
      {msg && <p className="text-center text-sm text-white/70">{msg}</p>}
      {!list && <div className="skeleton h-24 rounded-2xl" />}
      {list && list.length === 0 && <div className={card + ' text-center text-sm text-white/50'}>Sin pagos por resolver ✔</div>}
      {(list || []).map((p) => (
        <div key={p.msg_id} className={card + ' space-y-3'}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-3xl font-bold">{bs(p.amount)}</p>
              <p className="text-xs text-white/50">{ago(p.created_at)}</p>
            </div>
            <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-3 py-0.5 text-xs font-bold text-yellow-300">
              {LABEL[p.status] || p.status}
            </span>
          </div>
          {p.pagados.length > 0 && (
            <p className="rounded-xl bg-white/5 px-3 py-2 text-xs text-white/60">
              Ya pagado con este monto: {p.pagados.map((o) => o.code + ' (' + ago(o.paid_at) + ')').join(', ')}. Si este pago es el mismo, descartalo.
            </p>
          )}
          {p.candidatos.length === 0 ? (
            <p className="text-sm text-white/50">No hay pedidos con este monto en los ultimos 2 dias.</p>
          ) : (
            p.candidatos.map((o) => (
              <div key={o.code} className="flex items-center gap-2 rounded-xl bg-white/5 p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-bold text-yellow-300">
                    {o.code}{' '}
                    <span className="font-sans text-[11px] font-normal text-white/50">
                      {String(o.status).toLowerCase()} · {ago(o.created_at)}
                    </span>
                  </p>
                  <p className="truncate text-xs text-white/70">{pretty(o.game_slug)} · {o.package_label}</p>
                  <p className="truncate text-xs text-white/50">{o.nickname ? o.nickname + ' · ' : ''}{o.player_id}</p>
                </div>
                <button className={btn} disabled={busy === p.msg_id} onClick={() => act(p.msg_id, 'asignar', o.code)}>
                  Asignar
                </button>
              </div>
            ))
          )}
          <button className={mini} disabled={busy === p.msg_id} onClick={() => act(p.msg_id, 'descartar')}>
            Descartar pago
          </button>
        </div>
      ))}
    </div>
  );
}
