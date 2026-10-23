'use client';
import { useState, useEffect } from 'react';
import { Gem, QrCode, ChevronRight, ChevronDown, FileText, ListOrdered } from 'lucide-react';
import { WHATSAPP } from '@/data/games';
import OrderPay from '@/components/OrderPay';

const inputCls =
  'w-full rounded-xl bg-black/30 border border-white/15 px-4 py-3 outline-none focus:border-yellow-300';
const PAGE = 8;

function Step({ n, title, children }) {
  return (
    <section>
      <h2 className="font-extrabold uppercase mb-4 flex items-center gap-3">
        <span className="h-8 w-8 rounded-full bg-yellow-300 text-black text-sm font-bold flex items-center justify-center">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Acc({ icon: Icon, title, children }) {
  return (
    <details className="group border-b border-white/10 last:border-0">
      <summary className="flex items-center gap-3 px-4 py-4 cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden">
        {Icon && (
          <span className="h-9 w-9 rounded-lg bg-yellow-300/15 text-yellow-300 flex items-center justify-center">
            <Icon size={18} />
          </span>
        )}
        <span className="flex-1">{title}</span>
        <ChevronDown size={18} className="text-white/60 transition group-open:rotate-180" />
      </summary>
      <div className="px-4 pb-4 text-sm text-white/70 space-y-1">{children}</div>
    </details>
  );
}

function parse(label) {
  const m = label.match(/^(\d[\d.,]*)\s*(.*)$/);
  if (!m) return { big: label, unit: '', num: false };
  const hasGem = m[2].includes('💎');
  const unit = m[2].replace('💎', '').trim() || (hasGem ? 'DIAMANTES' : '');
  return { big: m[1], unit: unit.toUpperCase(), num: true };
}

const isPass = (p) => /pase/i.test(p.label);

export default function Checkout({ game }) {
  const [pkgId, setPkgId] = useState(null);
  const [playerId, setPlayerId] = useState('');
  const [tab, setTab] = useState('rec');
  const [all, setAll] = useState(false);
  const [order, setOrder] = useState(null);
  const [verif, setVerif] = useState(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rb_order');
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o.slug === game.slug && Date.now() - o.ts < 2 * 60 * 60 * 1000) setOrder(o);
    } catch (e) {}
  }, [game.slug]);

  const pkg = game.packages.find((p) => p.id === pkgId);
  const rec = game.packages.filter((p) => !isPass(p));
  const pass = game.packages.filter(isPass);
  const hasTabs = rec.length > 0 && pass.length > 0;
  const active = hasTabs ? tab : rec.length ? 'rec' : 'pass';
  const list = active === 'rec' ? rec : pass;
  const shown = all ? list : list.slice(0, PAGE);

  const isFF = game.slug === 'free-fire';
  const id = playerId.trim();
  const idFormatOk = /^\d{8,12}$/.test(id);

  useEffect(() => {
    if (!isFF || !idFormatOk) {
      setVerif(null);
      return;
    }
    setVerif({ state: 'loading' });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/verificar-id?game=${game.slug}&id=${id}`, { signal: ctrl.signal });
        const d = await r.json();
        if (d.ok) setVerif({ state: 'ok', nickname: d.nickname, region: d.region });
        else if (d.code === 'INVALID_PLAYER') setVerif({ state: 'invalid' });
        else setVerif({ state: 'unknown' });
      } catch (e) {
        if (!ctrl.signal.aborted) setVerif({ state: 'unknown' });
      }
    }, 600);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [id, isFF, idFormatOk, game.slug]);
  const idReady = isFF ? idFormatOk && (verif?.state === 'ok' || verif?.state === 'unknown') : id.length > 3;
  const ready = Boolean(pkg) && idReady;

  const lines = ready
    ? [
        `Hola, quiero recargar *${game.name}*`,
        `Paquete: ${pkg.label}`,
        `Precio: Bs ${pkg.price}`,
        `${game.idLabel}: ${id}`,
        'Quiero pagar por QR.',
      ]
    : [];
  const href = ready
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`
    : undefined;

  const hint = isFF ? 'Escribe tu ID (solo números)' : 'Escribe tu ID';

  async function createOrder() {
    if (creating) return;
    setCreating(true);
    try {
      const r = await fetch('/api/pedido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: game.slug,
          packageId: pkg.id,
          playerId: id,
          nickname: verif?.state === 'ok' ? verif.nickname : undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.code) {
        alert('No pudimos crear tu pedido. Intenta otra vez en unos segundos.');
        return;
      }
      setOrder({ code: d.code, orderId: d.orderId, slug: game.slug, ts: Date.now(), game: game.name, pkg: pkg.label, price: d.price, idLabel: game.idLabel, id });
      window.scrollTo(0, 0);
    } catch (e) {
      alert('Sin conexión. Revisa tu internet e intenta otra vez.');
    } finally {
      setCreating(false);
    }
  }

  if (order) return <OrderPay order={order} onBack={() => setOrder(null)} />;

  return (
    <div className="space-y-8 pb-32">

      <Step n="1" title={game.idLabel}>
        <div className="space-y-3">
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder={game.idLabel}
            inputMode="numeric"
            className={inputCls}
          />
          {isFF && verif?.state === 'loading' && (
            <p className="text-sm text-white/60">Verificando ID...</p>
          )}
          {isFF && verif?.state === 'ok' && (
            <div className="rounded-3xl border border-white/15 bg-black p-5">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.color} text-3xl`}>
                  {game.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold text-white">{game.name}</p>
                  <div className="mt-1 flex justify-between gap-3 text-sm">
                    <span className="text-white/50">Usuario:</span>
                    <span className="truncate font-bold text-white">{verif.nickname}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-white/50">ID del juego:</span>
                    <span className="font-bold text-white">{id}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/15 pt-4 text-sm text-white/50">
                <span className="text-lg text-green-400">🔒</span>
                <span>Tu recarga será entregada directamente a esta cuenta.</span>
              </div>
            </div>
          )}
          {isFF && verif?.state === 'invalid' && (
            <p className="text-sm text-red-400">No encontramos ese ID en Free Fire. Revísalo.</p>
          )}
          {isFF && verif?.state === 'unknown' && (
            <p className="text-sm text-yellow-300">No pudimos verificar el ID ahora. Revísalo bien antes de continuar.</p>
          )}
          {id !== '' && isFF && !idFormatOk && (
            <p className="text-sm text-red-400">El ID debe tener solo números (8 a 12 dígitos).</p>
          )}
          <p className="text-xs text-white/50">
            Revisa bien tu ID: si te equivocas, la recarga va a otra cuenta.
          </p>
        </div>
      </Step>

      <Step n="2" title="Elige tu pack">
        {hasTabs && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              ['rec', 'Recargas'],
              ['pass', 'Pases'],
            ].map(([k, name]) => (
              <button
                key={k}
                onClick={() => {
                  setTab(k);
                  setAll(false);
                }}
                className={`rounded-2xl border py-4 font-bold transition ${
                  active === k
                    ? 'border-yellow-300 bg-yellow-300/10 text-white'
                    : 'border-white/10 bg-white/5 text-white/60'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          {shown.map((p) => {
            const { big, unit, num } = parse(p.label);
            const on = pkgId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPkgId(p.id)}
                className={`relative rounded-2xl border p-4 text-left transition active:scale-95 ${
                  on
                    ? 'border-yellow-300 bg-yellow-300/10 ring-1 ring-yellow-300'
                    : p.recommended
                    ? 'border-yellow-300/40 bg-white/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                {p.recommended && (
                  <span className="absolute -top-px right-3 rounded-b-lg bg-yellow-300 text-black text-[10px] font-bold px-2 py-0.5">
                    RECOMENDADO
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <Gem size={30} className="shrink-0 text-sky-400" />
                  <div className="min-w-0">
                    <div className={`${num ? 'text-2xl' : 'text-base'} font-extrabold leading-tight`}>
                      {big}
                    </div>
                    {unit && (
                      <div className="text-xs font-semibold text-white/60 tracking-wide">{unit}</div>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-right font-bold">Bs {p.price}</div>
              </button>
            );
          })}
        </div>

        {list.length > PAGE && (
          <button
            onClick={() => setAll(!all)}
            className="mx-auto mt-5 flex items-center gap-1 font-semibold text-yellow-300"
          >
            {all ? 'Ver menos' : 'Ver más'}
            <ChevronDown size={18} className={all ? 'rotate-180' : ''} />
          </button>
        )}
      </Step>

      <section className="border-t border-white/10 pt-6">
        <h2 className="font-extrabold uppercase mb-4">Métodos de pago</h2>
        <div className="flex items-center gap-3 text-white/70">
          <QrCode size={28} />
          <span>Paga con QR</span>
        </div>
      </section>

      <section>
        <h2 className="font-extrabold uppercase mb-4">Información</h2>
        <div className="rounded-3xl border border-white/10 bg-white/5">
          <Acc icon={FileText} title={`Sobre ${game.name}`}>
            <p>Recarga {game.name} en Bolivia usando solo tu {game.idLabel}.</p>
          </Acc>
          <Acc icon={ListOrdered} title="Cómo comprar">
            <p>1. Escribe tu {game.idLabel}.</p>
            <p>2. Elige tu pack.</p>
            <p>3. Toca CONTINUAR: se abre WhatsApp con tu pedido.</p>
            <p>4. Te enviamos el QR de pago y entregamos al confirmar.</p>
          </Acc>
        </div>
      </section>

      <section>
        <h2 className="font-extrabold uppercase mb-4">Preguntas frecuentes</h2>
        <div className="rounded-3xl border border-white/10 bg-white/5">
          <Acc title="¿Dónde encuentro mi ID?">
            <p>Abre el juego y entra a tu perfil: ahí aparece tu ID. Cópialo para no equivocarte.</p>
          </Acc>
          <Acc title="¿Necesitan mi contraseña?">
            <p>No. Solo necesitamos tu ID. Nunca te pediremos tu contraseña.</p>
          </Acc>
        </div>
      </section>

      <div className="fixed bottom-0 inset-x-0 z-10 border-t border-white/10 bg-neutral-950/95 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {pkg ? (
              <>
                <div className="font-semibold truncate">{pkg.label}</div>
                <div className="text-yellow-300 font-bold">Bs {pkg.price}</div>
                {!ready && <div className="text-xs text-white/50">{hint}</div>}
              </>
            ) : (
              <span className="text-white/60">Ningún pack elegido</span>
            )}
          </div>
          <button
            disabled={!ready || creating}
            onClick={() => {
              if (!ready || creating) return;
              createOrder();
            }}
            className={`flex items-center gap-1 rounded-xl px-5 py-3 font-bold ${
              ready ? 'bg-yellow-300 text-black' : 'bg-white/10 text-white/40'
            }`}
          >
            {creating ? 'CREANDO...' : <>CONTINUAR <ChevronRight size={18} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
