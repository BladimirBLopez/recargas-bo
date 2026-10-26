'use client';
import { useState } from 'react';
import { WHATSAPP } from '@/data/games';

export default function Checkout({ game }) {
  const [pkgId, setPkgId] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const pkg = game.packages.find((p) => p.id === pkgId);
  const ready = pkg && playerId.trim().length > 3;

  const msg = ready
    ? `Hola, quiero recargar *${game.name}*%0A` +
      `Paquete: ${pkg.label}%0A` +
      `Precio: Bs ${pkg.price}%0A` +
      `${game.idLabel}: ${playerId.trim()}%0A` +
      `Quiero pagar por QR.`
    : '';

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold mb-3">1. Elige tu paquete</h2>
        <div className="grid grid-cols-2 gap-3">
          {game.packages.map((p) => (
            <button
              key={p.id}
              onClick={() => setPkgId(p.id)}
              className={`rounded-xl border p-3 text-left ${
                pkgId === p.id ? 'border-green-400 bg-green-400/10' : 'border-white/15 bg-white/5'
              }`}
            >
              <div className="font-semibold">{p.label}</div>
              <div className="text-white/60 text-sm">Bs {p.price}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-semibold mb-3">2. {game.idLabel}</h2>
        <input
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder={game.idLabel}
          inputMode="numeric"
          className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 outline-none focus:border-green-400"
        />
      </section>

      <a
        href={ready ? `https://wa.me/${WHATSAPP}?text=${msg}` : undefined}
        target="_blank"
        rel="noreferrer"
        className={`block text-center rounded-xl py-3 font-semibold ${
          ready ? 'bg-green-500 text-black' : 'bg-white/10 text-white/40 pointer-events-none'
        }`}
      >
        {ready ? `Pedir por WhatsApp · Bs ${pkg.price}` : 'Completa los pasos'}
      </a>
      <p className="text-xs text-white/40 text-center">
        Te enviaremos el QR de pago por WhatsApp y entregamos tu recarga al confirmar.
      </p>
    </div>
  );
}
