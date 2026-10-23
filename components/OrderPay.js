'use client';
import { useEffect, useState } from 'react';
import { ArrowLeft, Download, MessageCircle } from 'lucide-react';
import { WHATSAPP } from '@/data/games';

export default function OrderPay({ order, onBack }) {
  const [stage, setStage] = useState(order.stage === 'proof' ? 'proof' : 'pay');

  useEffect(() => {
    try {
      localStorage.setItem('rb_order', JSON.stringify({ ...order, stage }));
    } catch (e) {}
  }, [order, stage]);

  useEffect(() => {
    let left = false;
    const onVis = () => {
      if (document.visibilityState === 'hidden') left = true;
      else if (left && stage === 'pay') setStage('proof');
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [stage]);

  const back = () => {
    try {
      localStorage.removeItem('rb_order');
    } catch (e) {}
    onBack();
  };

  const msg = [
    `Hola, te envío mi comprobante del pedido ${order.code}`,
    `Juego: ${order.game}`,
    `Paquete: ${order.pkg}`,
    `Monto: Bs ${order.price}`,
    `${order.idLabel}: ${order.id}`,
  ].join('\n');
  const href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  const avisar = () => {
    try {
      fetch('/api/pedido/avisar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: order.code }),
        keepalive: true,
      }).catch(() => {});
    } catch (e) {}
  };

  return (
    <div className="space-y-6 pb-10">
      <button onClick={back} className="flex items-center gap-2 text-sm text-white/70">
        <ArrowLeft size={18} /> Cancelar pedido
      </button>

      <div>
        <h2 className="text-2xl font-black italic">
          {stage === 'pay' ? 'Paga tu pedido' : 'Envía tu comprobante'}
        </h2>
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

      {stage === 'pay' ? (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
            <ol className="text-sm text-white/80 space-y-1 list-decimal pl-5">
              <li>Descarga el QR (o escanéalo desde otro celular).</li>
              <li>
                Abre tu banca móvil y paga por <b>Bs {order.price}</b> exactos.
              </li>
              <li>Vuelve a esta página para enviar tu comprobante.</li>
            </ol>
            <div className="mx-auto w-64 max-w-full rounded-2xl bg-white p-3">
              <img src="/qr-pago.png" alt="QR de pago" className="w-full h-auto" />
            </div>
            <a
              href="/qr-pago.png"
              download="qr-pago.png"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-yellow-300 text-black py-3.5 font-bold"
            >
              <Download size={18} /> Descargar QR
            </a>
            <p className="text-xs text-white/40 text-center">
              Si no se descarga, mantén presionada la imagen y guárdala.
            </p>
          </div>
          <button
            onClick={() => setStage('proof')}
            className="w-full rounded-xl border border-white/20 py-3 font-semibold"
          >
            Ya pagué
          </button>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <ol className="text-sm text-white/80 space-y-1 list-decimal pl-5">
              <li>Toca el botón: se abre WhatsApp con tu pedido.</li>
              <li>Adjunta la captura de tu pago con el clip y envíala.</li>
            </ol>
          </div>
          <a
            href={href}
            onClick={avisar}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-yellow-300 text-black py-3.5 font-bold"
          >
            <MessageCircle size={20} /> Enviar comprobante por WhatsApp
          </a>
          <button onClick={() => setStage('pay')} className="w-full text-sm text-white/60 py-2">
            Volver al QR
          </button>
        </>
      )}
      <p className="text-xs text-white/40 text-center">
        Entregamos tu recarga cuando confirmemos tu pago.
      </p>
    </div>
  );
}
