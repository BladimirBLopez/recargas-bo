'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { MdArrowBack, MdFileDownload, MdCheckCircle, MdError } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '@/components/SettingsProvider';

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
  'flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3.5 font-display text-lg font-extrabold uppercase text-black shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.8)] active:scale-95 transition';

function Burst() {
  return (
    <div className="relative mx-auto grid h-24 w-24 place-items-center">
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className={`absolute h-2 w-2 rounded-full ${i % 2 ? 'bg-yellow-300' : 'bg-green-400'}`}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{ x: Math.cos(a) * 80, y: Math.sin(a) * 80, opacity: 0, scale: 0.4 }}
            transition={{ duration: 0.9, delay: 0.25, ease: 'easeOut' }}
          />
        );
      })}
      <motion.span
        className="absolute inset-0 rounded-full border-2 border-green-400"
        initial={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{ duration: 0.9, delay: 0.2 }}
      />
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      >
        <MdCheckCircle size={88} className="text-green-400 drop-shadow-[0_0_18px_rgba(74,222,128,0.6)]" />
      </motion.div>
    </div>
  );
}

function Tracker({ done }) {
  const steps = ['Pago recibido', 'Entregando', 'Entregada'];
  const completed = done ? 3 : 1;
  return (
    <div className="flex items-start justify-between px-2">
      {steps.map((name, i) => {
        const isDone = i < completed;
        const isNow = i === completed;
        return (
          <div key={name} className="relative flex flex-1 flex-col items-center gap-1.5">
            {i > 0 && (
              <span
                className={`absolute right-1/2 top-3 h-0.5 w-full ${i < completed ? 'bg-green-400' : 'bg-white/15'}`}
              />
            )}
            <span
              className={
                'relative z-10 grid h-6 w-6 place-items-center rounded-full border-2 text-[10px] font-bold ' +
                (isDone
                  ? 'border-green-400 bg-green-400 text-black'
                  : isNow
                  ? 'animate-pulse border-yellow-300 bg-black text-yellow-300'
                  : 'border-white/20 bg-black text-white/40')
              }
            >
              {isDone ? '✓' : i + 1}
            </span>
            <span className={'text-[11px] font-semibold ' + (isDone || isNow ? 'text-white' : 'text-white/40')}>
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: d },
});

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

  const { whatsapp } = useSettings();
  const wa = (text) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
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
          <Burst />
          <motion.h2 {...fade(0.2)} className="mt-3 font-display text-4xl font-extrabold uppercase italic">
            {done ? '¡Recarga entregada!' : '¡Pago recibido!'}
          </motion.h2>
          <motion.p {...fade(0.3)} className="mt-2 text-white/70">
            {done
              ? 'Tu recarga ya está en tu cuenta. ¡Gracias por tu compra!'
              : 'Estamos entregando tu recarga. Te llegará en unos minutos.'}
          </motion.p>
          <motion.p {...fade(0.35)} className="mt-1 text-sm text-white/50">
            Código: <span className="font-bold text-yellow-300">{order.code}</span>
          </motion.p>
        </div>
        <motion.div {...fade(0.4)}>
          <Tracker done={done} />
        </motion.div>
        <motion.div {...fade(0.5)} className="text-left">
          <Summary order={order} />
        </motion.div>
        <motion.div {...fade(0.6)}>
          <Link href="/" onClick={clear} className={btnMain}>
            Volver al inicio
          </Link>
        </motion.div>
      </div>
    );
  }

  // ---- Error de pago ----
  if (BAD.includes(status)) {
    return (
      <div className="space-y-6 pb-10 text-center">
        <div className="pt-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, x: [0, -10, 10, -8, 8, 0] }}
            transition={{ duration: 0.6 }}
          >
            <MdError size={88} className="mx-auto text-red-500 drop-shadow-[0_0_18px_rgba(239,68,68,0.5)]" />
          </motion.div>
          <motion.h2 {...fade(0.15)} className="mt-3 font-display text-4xl font-extrabold uppercase italic">
            Error de pago
          </motion.h2>
          <motion.p {...fade(0.25)} className="mt-2 text-white/70">
            Tu pedido fue {status === 'EXPIRADO' ? 'expirado' : 'cancelado'}. Si ya pagaste, escríbenos y lo resolvemos.
          </motion.p>
          <p className="mt-1 text-sm text-white/50">
            Código: <span className="font-bold text-yellow-300">{order.code}</span>
          </p>
        </div>
        <motion.div {...fade(0.35)} className="text-left">
          <Summary order={order} />
        </motion.div>
        <a
          href={wa(`Hola, tengo un problema con mi pedido ${order.code}`)}
          target="_blank"
          rel="noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-green-500 py-3.5 font-bold text-white active:scale-95 transition"
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

      <AnimatePresence mode="wait">
        {stage === 'pay' ? (
          <motion.div
            key="pay"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="space-y-4 rounded-3xl border border-white/10 bg-zinc-950/80 p-5">
              <ol className="list-decimal space-y-1 pl-5 text-sm text-white/80">
                <li>Descarga el QR (o escanéalo desde otro celular).</li>
                <li>
                  Abre tu banca móvil y paga por <b>Bs {order.price}</b> exactos.
                </li>
                <li>Vuelve a esta página para enviar tu comprobante.</li>
              </ol>
              <div className="mx-auto w-64 max-w-full rounded-2xl bg-white p-3 shadow-[0_0_40px_-8px_rgb(var(--accent)/0.7)]">
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
              className="w-full rounded-2xl border-2 border-white/20 py-3 font-display text-lg font-bold uppercase transition active:scale-95"
            >
              Ya pagué
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="proof"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
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
            <div className="flex items-center justify-center gap-2 text-sm text-white/60">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-300 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yellow-300" />
              </span>
              Esperando confirmación del pago…
            </div>
            <button onClick={() => setStage('pay')} className="w-full py-2 text-sm text-white/60">
              Volver al QR
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-xs text-white/40">Entregamos tu recarga cuando confirmemos tu pago.</p>
    </div>
  );
}
