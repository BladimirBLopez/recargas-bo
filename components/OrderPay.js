'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MdArrowBack, MdFileDownload, MdCheckCircle, MdError } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { WHATSAPP } from '@/data/games';

const OK = ['PAGADO', 'ENTREGADO'];
const BAD = ['CANCELADO', 'EXPIRADO'];

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-white/60">{k}</span>
      <span className="truncate font-semibold">{v}</span>
    </div>
  );
}

function Summary({ order }) {
  return (
    <div className="space-y-2 rounded-3xl border border-white/10 bg-zinc-950/80 p-5 text-sm">
      <Row k="Juego" v={order.game} />
      <Row k={order.idLabel} v={order.id} />
      {order.nick && <Row k="Usuario" v={order.nick} />}
      <Row k="Paquete" v={order.pkg} />
      <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold">
        <span>Total a pagar</span>
        <span className="text-yellow-300">Bs {order.price}</span>
      </div>
    </div>
  );
}

const btnMain =
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-300 py-3.5 font-display text-lg font-extrabold uppercase text-black active:scale-95 transition';

export default function OrderPay({ order, onBack }) {
  const [stage, setStage] = useState(order.stage === 'proof' ? 'proof' : 'pay');
  const [status, setStatus] = useState('PENDIENTE');

  useEffect(() => {
    try {
      localStorage.setItem('rb_order', JSON.stringify({ ...order, stage }));
    } catch (e) {}
  }, [order, stage]);

  // Si el cliente sale a su app del banco y vuelve, pasamos a "enviar comprobante".
  useEffect(() => {
    let left = false;
    const onVis = () => {
      if (document.visibilityState === 'hidden') left = true;
      else if (left && stage === 'pay') setStage('proof');
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [stage]);

  // Consulta el estado del pedido cada 5 s hasta que se entregue o se cancele.
  useEffect(() => {
    if (status === 'ENTREGADO' || BAD.includes(status)) return;
    let stop = false;
    const tick = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const r = await fetch('/api/pedido/estado?code=' + encodeURIComponent(order.code), { cache: 'no-store' });
        if (!r.ok) return;
        const d = await r.json();
        if (!stop && d.status) setStatus(d.status);
      } catch (e) {}
    };
    tick();
    const t = setInterval(tick, 5000);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [order.code, status]);

  const clear = () => {
    try {
      localStorage.removeItem('rb_order');
    } catch (e) {}
  };
  const back = () => {
    clear();
    onBack();
  };

  const wa = (text) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;
  const proofMsg = [
    `Hola, te envío mi comprobante del pedido ${order.code}`,
    `Juego: ${order.game}`,
    `Paquete: ${order.pkg}`,
    `Monto: Bs ${order.price}`,
    `${order.idLabel}: ${order.id}`,
  ].join('\n');
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

  // ---- Pago recibido / entregado ----
  if (OK.includes(status)) {
    const done = status === 'ENTREGADO';
    return (
      <div className="space-y-6 pb-10 text-center">
        <div className="pt-6">
          <MdCheckCircle size={88} className="mx-auto text-green-400" />
          <h2 className="mt-3 font-display text-4xl font-extrabold uppercase italic">
            {done ? '¡Recarga entregada!' : '¡Pago recibido!'}
          </h2>
          <p className="mt-2 text-white/70">
            {done
              ? 'Tu recarga ya está en tu cuenta. ¡Gracias por tu compra!'
              : 'Estamos entregando tu recarga. Te llegará en unos minutos.'}
          </p>
          <p className="mt-1 text-sm text-white/50">
            Código: <span className="font-bold text-yellow-300">{order.code}</span>
          </p>
        </div>
        <div className="text-left">
          <Summary order={order} />
        </div>
        <Link href="/" onClick={clear} className={btnMain}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  // ---- Error de pago ----
  if (BAD.includes(status)) {
    return (
      <div className="space-y-6 pb-10 text-center">
        <div className="pt-6">
          <MdError size={88} className="mx-auto text-red-500" />
          <h2 className="mt-3 font-display text-4xl font-extrabold uppercase italic">Error de pago</h2>
          <p className="mt-2 text-white/70">
            Tu pedido fue {status === 'EXPIRADO' ? 'expirado' : 'cancelado'}. Si ya pagaste, escríbenos y lo resolvemos.
          </p>
          <p className="mt-1 text-sm text-white/50">
            Código: <span className="font-bold text-yellow-300">{order.code}</span>
          </p>
        </div>
        <div className="text-left">
          <Summary order={order} />
        </div>
        <a
          href={wa(`Hola, tengo un problema con mi pedido ${order.code}`)}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-3.5 font-bold text-white"
        >
          <FaWhatsapp size={22} /> Escribir por WhatsApp
        </a>
        <button onClick={back} className={btnMain}>
          Intentar de nuevo
        </button>
      </div>
    );
  }

  // ---- Pago pendiente ----
  return (
    <div className="space-y-6 pb-10">
      <button onClick={back} className="flex items-center gap-2 text-sm text-white/70">
        <MdArrowBack size={18} /> Cancelar pedido
      </button>

      <div>
        <h2 className="font-display text-3xl font-extrabold uppercase italic">
          {stage === 'pay' ? 'Paga tu pedido' : 'Envía tu comprobante'}
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Código: <span className="font-bold text-yellow-300">{order.code}</span>
        </p>
      </div>

      <Summary order={order} />

      {stage === 'pay' ? (
        <>
          <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">
              <li>Descarga el QR (o escanéalo desde otro celular).</li>
              <li>
                Abre tu banca móvil y paga por <b>Bs {order.price}</b> exactos.
              </li>
              <li>Vuelve a esta página para enviar tu comprobante.</li>
            </ol>
            <div className="mx-auto w-64 max-w-full rounded-2xl bg-white p-3">
              <img src="/qr-pago.png" alt="QR de pago" className="h-auto w-full" />
            </div>
            <a href="/qr-pago.png" download="qr-pago.png" className={btnMain}>
              <MdFileDownload size={22} /> Descargar QR
            </a>
            <p className="text-center text-xs text-white/40">
              Si no se descarga, mantén presionada la imagen y guárdala.
            </p>
          </div>
          <button
            onClick={() => setStage('proof')}
            className="w-full rounded-2xl border-2 border-white/20 py-3 font-display text-lg font-bold uppercase"
          >
            Ya pagué
          </button>
        </>
      ) : (
        <>
          <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">
              <li>Toca el botón: se abre WhatsApp con tu pedido.</li>
              <li>Adjunta la captura de tu pago con el clip y envíala.</li>
              <li>Esta pantalla se actualiza sola cuando confirmemos tu pago.</li>
            </ol>
          </div>
          <a href={wa(proofMsg)} onClick={avisar} target="_blank" rel="noreferrer" className={btnMain}>
            <FaWhatsapp size={22} /> Enviar comprobante
          </a>
          <button onClick={() => setStage('pay')} className="w-full py-2 text-sm text-white/60">
            Volver al QR
          </button>
        </>
      )}
      <p className="text-center text-xs text-white/40">Entregamos tu recarga cuando confirmemos tu pago.</p>
    </div>
  );
}
