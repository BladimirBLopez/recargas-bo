'use client';
import { useState } from 'react';
import { ArrowLeft, Copy, Check, MessageCircle } from 'lucide-react';
import { WHATSAPP } from '@/data/games';

export default function OrderPay({ order, onBack }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(order.price));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const msg = [
    `Hola, ya pagué mi pedido ${order.code}`,
    `Juego: ${order.game}`,
    `Paquete: ${order.pkg}`,
    `Monto: Bs ${order.price}`,
    `${order.idLabel}: ${order.id}`,
    'Adjunto mi comprobante.',
  ].join('\n');
  const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="space-y-6 pb-10">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-white/70">
        <ArrowLeft size={18} /> Volver
      </button>

      <div>
        <h2 className="text-2xl font-black italic">Tu pedido</h2>
        <p className="text-white/60 text-sm mt-1">
          Código: <span className="font-bold text-yellow-300">{order.code}</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm space-y-2">
        <div className="flex justify-between gap-3">
          <span className="text-white/60">Juego</span>
          <span>{order.game}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-white/60">Paquete</span>
          <span>{order.pkg}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-white/60">{order.idLabel}</span>
          <span className="truncate">{order.id}</span>
        </div>
        <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold">
          <span>Total a pagar</span>
          <span className="text-yellow-300">Bs {order.price}</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
        <ol className="text-sm text-white/80 space-y-1 list-decimal pl-5">
          <li>Escanea el QR con la app de tu banco.</li>
          <li>
            Escribe exactamente <b>Bs {order.price}</b> como monto.
          </li>
          <li>Toca "Ya pagué" y envía tu comprobante por WhatsApp.</li>
        </ol>

        <div className="mx-auto w-64 max-w-full rounded-2xl bg-white p-3">
          <img src="/qr-pago.png" alt="QR de pago" className="w-full h-auto" />
        </div>

        <button
          onClick={copy}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/20 py-3 font-semibold"
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? 'Monto copiado' : `Copiar monto (${order.price})`}
        </button>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 text-black py-3.5 font-bold"
      >
        <MessageCircle size={20} /> Ya pagué, enviar comprobante
      </a>
      <p className="text-xs text-white/40 text-center">
        Entregamos tu recarga cuando confirmemos tu pago.
      </p>
    </div>
  );
}
