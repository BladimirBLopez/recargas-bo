'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Historial() {
  const [order, setOrder] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rb_order');
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.code && Date.now() - o.ts < 2 * 60 * 60 * 1000) setOrder(o);
      }
    } catch (e) {}
    setReady(true);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="flex items-center gap-3 text-xl font-extrabold uppercase italic">
        <span className="h-7 w-1.5 rounded-full bg-yellow-300" />
        Historial
      </h2>
      {ready && !order && (
        <p className="text-white/60">No tienes un pedido en curso en este celular.</p>
      )}
      {order && (
        <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
          <div className="font-mono text-lg font-bold text-yellow-300">{order.code}</div>
          <div className="mt-2 text-sm">
            {order.game} · {order.pkg} · <b>Bs {order.price}</b>
          </div>
          <div className="mt-1 text-sm text-white/70">
            {order.idLabel}: {order.id}
          </div>
          <div className="mt-1 text-xs text-white/40">Se guarda 2 horas en este celular.</div>
          <Link
            href={'/juego/' + order.slug}
            className="mt-4 block rounded-xl bg-yellow-300 py-3 text-center font-bold text-black"
          >
            Continuar mi pedido
          </Link>
        </div>
      )}
    </div>
  );
}
