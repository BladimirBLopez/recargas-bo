'use client';
import { useState } from 'react';
import { WHATSAPP } from '@/data/games';

function Step({ n, title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <h2 className="font-semibold mb-4 flex items-center gap-3">
        <span className="h-7 w-7 rounded-full bg-yellow-300 text-black text-sm font-bold flex items-center justify-center">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const inputCls =
  'w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 outline-none focus:border-yellow-300';

export default function Checkout({ game }) {
  const [pkgId, setPkgId] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [playerId2, setPlayerId2] = useState('');
  const [nick, setNick] = useState('');
  const pkg = game.packages.find((p) => p.id === pkgId);

  const isFF = game.slug === 'free-fire';
  const id = playerId.trim();
  const id2 = playerId2.trim();
  const idFormatOk = /^\d{6,12}$/.test(id);
  const idMatch = id !== '' && id === id2;
  const nickOk = nick.trim().length >= 2;

  const idReady = isFF ? idFormatOk && idMatch && nickOk : id.length > 3;
  const ready = Boolean(pkg) && idReady;

  const lines = ready
    ? [
        `Hola, quiero recargar *${game.name}*`,
        `Paquete: ${pkg.label}`,
        `Precio: Bs ${pkg.price}`,
        `${game.idLabel}: ${id}`,
        ...(isFF ? [`Nickname: ${nick.trim()}`] : []),
        'Quiero pagar por QR.',
      ]
    : [];
  const href = ready
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`
    : undefined;

  let hint = 'Completa los pasos';
  if (pkg && isFF) {
    if (!idFormatOk) hint = 'Escribe tu ID (solo números)';
    else if (!idMatch) hint = 'Los IDs no coinciden';
    else if (!nickOk) hint = 'Escribe tu nickname';
  }

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
                    ? 'border-yellow-300 bg-yellow-300/10 ring-1 ring-yellow-300'
                    : 'border-white/15 bg-white/5 hover:border-white/30'
                }`}
              >
                <div className="font-semibold">{p.label}</div>
                <div className="text-yellow-300 font-bold mt-1">Bs {p.price}</div>
              </button>
            ))}
          </div>
        </Step>

        <Step n="2" title={game.idLabel}>
          <div className="space-y-3">
            <input
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder={game.idLabel}
              inputMode="numeric"
              className={inputCls}
            />
            {isFF && (
              <>
                <input
                  value={playerId2}
                  onChange={(e) => setPlayerId2(e.target.value)}
                  placeholder="Repite tu ID"
                  inputMode="numeric"
                  className={inputCls}
                />
                {id2 !== '' && !idMatch && (
                  <p className="text-sm text-red-400">Los IDs no coinciden.</p>
                )}
                {id !== '' && !idFormatOk && (
                  <p className="text-sm text-red-400">El ID debe tener solo números (6 a 12 dígitos).</p>
                )}
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value)}
                  placeholder="Tu nickname en el juego"
                  className={inputCls}
                />
                <p className="text-xs text-white/50">
                  Si te equivocas en un dígito, los diamantes van a otra cuenta. Revisa bien tu ID.
                </p>
              </>
            )}
          </div>
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
              <dd className="truncate">{id || '—'}</dd>
            </div>
            {isFF && (
              <div className="flex justify-between gap-3">
                <dt className="text-white/60">Nickname</dt>
                <dd className="truncate">{nick.trim() || '—'}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold">
              <dt>Total</dt>
              <dd className="text-yellow-300">{pkg ? `Bs ${pkg.price}` : '—'}</dd>
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
              ready ? 'bg-yellow-300 text-black' : 'bg-white/10 text-white/40 pointer-events-none'
            }`}
          >
            {ready ? `Pedir por WhatsApp · Bs ${pkg.price}` : hint}
          </a>
        </div>
      </aside>
    </div>
  );
}
