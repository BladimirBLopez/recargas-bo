'use client';
import { useState } from 'react';
import { WHATSAPP } from '@/data/games';

function Step({ n, title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <h2 className="font-semibold mb-4 flex items-center gap-3">
        <span className="h-7 w-7 rounded-full bg-green-500 text-black text-sm font-bold flex items-center justify-center">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Checkout({ game }) {
  const [pkgId, setPkgId] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const pkg = game.packages.find((p) => p.id === pkgId);
  const ready = Boolean(pkg) && playerId.trim().length > 3;

  const text = ready
    ? [
        `Hola, quiero recargar *${game.name}*`,
        `Paquete: ${pkg.label}`,
        `Precio: Bs ${pkg.price}`,
        `${game.idLabel}: ${playerId.trim()}`,
        'Quiero pagar por QR.',
      ].join('\n')
    : '';
  const href = ready ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}` : undefined;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_340px] pb-28 lg:pb-0">
      <div className="space-y-5">
        <Step n="1" title="Elige tu paquete">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {game.packages.map((p) => (
              <button
                key={p.id}
                onClick={() => setPkgId(p.id)}
                className={`rounded-xl border p-3 text-left transition active:scale-95 ${
                  pkgId === p.id
                    ? 'border-green-400 bg-green-400/10 ring-1 ring-green-400'
                    : 'border-white/15 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="font-semibold">{p.label}</div>
                <div className="text-green-400 font-bold mt-1">Bs {p.price}</div>
              </button>
            ))}
          </div>
        </Step>

        <Step n="2" title={game.idLabel}>
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder={game.idLabel}
            inputMode="numeric"
            className="w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 outline-none focus:border-green-400"
          />
        </Step>
      </div>

      <aside className="lg:sticky lg:top-20 self-start space-y-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <h2 className="font-semibold mb-3">Resumen</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-3">
              <dt className="text-white/60">Juego</dt>
              <dd>{game.name}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/60">Paquete</dt>
              <dd>{pkg ? pkg.label : '—'}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/60">{game.idLabel}</dt>
              <dd className="truncate">{playerId.trim() || '—'}</dd>
            </div>
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-green-400">{pkg ? `Bs ${pkg.price}` : '—'}</dd>
            </div>
          </dl>
          <p className="text-xs text-white/40 mt-3">
            Te enviaremos el QR de pago por WhatsApp y entregamos tu recarga al confirmar.
          </p>
        </div>

        <div className="fixed bottom-0 inset-x-0 z-10 p-3 bg-black/80 backdrop-blur lg:static lg:p-0 lg:bg-transparent lg:backdrop-blur-none">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`block text-center rounded-xl py-3.5 font-bold ${
              ready ? 'bg-green-500 text-black' : 'bg-white/10 text-white/40 pointer-events-none'
            }`}
          >
            {ready ? `Pedir por WhatsApp · Bs ${pkg.price}` : 'Completa los pasos'}
          </a>
        </div>
      </aside>
    </div>
  );
}
