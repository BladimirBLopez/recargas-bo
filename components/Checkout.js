'use client';
import { useState, useEffect } from 'react';
import { IoDiamond } from 'react-icons/io5';
import {
  MdQrCode2,
  MdAccountBalanceWallet,
  MdChevronRight,
  MdKeyboardArrowDown,
  MdDescription,
  MdListAlt,
  MdLock,
} from 'react-icons/md';
import OrderPay from '@/components/OrderPay';

const inputCls =
  'w-full rounded-2xl border-2 border-white/15 bg-zinc-950 px-4 py-3.5 text-base outline-none placeholder:text-white/40 focus:border-yellow-300';
const PAGE = 8;

function Step({ n, title, action, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-yellow-300 font-display text-lg font-extrabold text-black">
          {n}
        </span>
        <h2 className="flex-1 font-display text-xl font-extrabold uppercase italic">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Acc({ icon: Icon, title, children }) {
  return (
    <details className="group border-b border-white/10 last:border-0">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
        {Icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-300/15 text-yellow-300">
            <Icon size={20} />
          </span>
        )}
        <span className="flex-1">{title}</span>
        <MdKeyboardArrowDown size={22} className="text-white/60 transition group-open:rotate-180" />
      </summary>
      <div className="space-y-1 px-4 pb-4 text-sm text-white/70">{children}</div>
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
  const [err, setErr] = useState('');

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
  const showCard = isFF && verif?.state === 'ok';
  const hint = !idReady ? 'Escribe tu ID' : !pkg ? 'Elige un paquete' : '';

  async function createOrder() {
    if (creating || !ready) return;
    setCreating(true);
    setErr('');
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
        setErr('No pudimos crear tu pedido. Intenta otra vez en unos segundos.');
        return;
      }
      setOrder({
        code: d.code,
        orderId: d.orderId,
        slug: game.slug,
        ts: Date.now(),
        game: game.name,
        pkg: pkg.label,
        price: d.price,
        idLabel: game.idLabel,
        id,
        nick: verif?.state === 'ok' ? verif.nickname : undefined,
      });
      window.scrollTo(0, 0);
    } catch (e) {
      setErr('Sin conexión. Revisa tu internet e intenta otra vez.');
    } finally {
      setCreating(false);
    }
  }

  if (order) return <OrderPay order={order} onBack={() => setOrder(null)} />;

  return (
    <div className="space-y-8 pb-32">
      <Step
        n="1"
        title={game.idLabel}
        action={
          showCard && (
            <button
              onClick={() => {
                setPlayerId('');
                setVerif(null);
              }}
              className="rounded-xl border border-yellow-300 px-3 py-1 font-display text-sm font-bold uppercase text-yellow-300"
            >
              Cambiar
            </button>
          )
        }
      >
        <div className="space-y-3">
          {!showCard && (
            <input
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              placeholder={game.idLabel}
              inputMode="numeric"
              className={inputCls}
            />
          )}
          {isFF && verif?.state === 'loading' && <p className="text-sm text-white/60">Verificando ID...</p>}
          {showCard && (
            <div className="rounded-3xl border border-white/15 bg-black p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${game.color} text-3xl`}
                >
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
                <MdLock size={20} className="shrink-0 text-green-400" />
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
          <p className="text-xs text-white/50">Revisa bien tu ID: si te equivocas, la recarga va a otra cuenta.</p>
        </div>
      </Step>

      <Step n="2" title="Elige tu paquete">
        {hasTabs && (
          <div className="mb-4 grid grid-cols-2 gap-3">
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
                className={`rounded-2xl border-2 py-3 font-display text-lg font-bold uppercase transition ${
                  active === k
                    ? 'border-yellow-300 bg-yellow-300 text-black'
                    : 'border-white/10 bg-zinc-950 text-white/70'
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
                className={`relative rounded-2xl border-2 p-4 text-left transition active:scale-95 ${
                  on
                    ? 'border-yellow-300 bg-yellow-300/10'
                    : p.recommended
                    ? 'border-yellow-300/40 bg-zinc-950'
                    : 'border-white/10 bg-zinc-950'
                }`}
              >
                {p.recommended && (
                  <span className="absolute -top-px right-3 rounded-b-lg bg-yellow-300 px-2 py-0.5 text-[10px] font-bold text-black">
                    RECOMENDADO
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <IoDiamond size={30} className="shrink-0 text-sky-400" />
                  <div className="min-w-0">
                    <div className={`${num ? 'text-2xl' : 'text-base'} font-display font-extrabold leading-tight`}>
                      {big}
                    </div>
                    {unit && <div className="text-xs font-semibold tracking-wide text-white/60">{unit}</div>}
                  </div>
                </div>
                <div className="mt-3 text-right font-display text-lg font-bold text-yellow-300">Bs {p.price}</div>
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
            <MdKeyboardArrowDown size={22} className={all ? 'rotate-180' : ''} />
          </button>
        )}
      </Step>

      <Step n="3" title="Método de pago">
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-yellow-300 bg-yellow-300/10 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-300 text-black">
              <MdQrCode2 size={26} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-lg font-bold uppercase">QR bancario</span>
              <span className="block text-sm text-white/60">Paga desde la app de cualquier banco de Bolivia</span>
            </span>
            <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-yellow-300">
              <span className="h-3 w-3 rounded-full bg-yellow-300" />
            </span>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border-2 border-white/10 bg-zinc-950 p-4 opacity-50">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10">
              <MdAccountBalanceWallet size={24} />
            </span>
            <span className="flex-1">
              <span className="block font-display text-lg font-bold uppercase">Saldo</span>
              <span className="block text-sm text-white/60">Próximamente</span>
            </span>
          </div>
        </div>
        {err && <p className="mt-3 text-sm text-red-400">{err}</p>}
      </Step>

      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase italic">Información</h2>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80">
          <Acc icon={MdDescription} title={`Sobre ${game.name}`}>
            <p>
              Recarga {game.name} en Bolivia usando solo tu {game.idLabel}.
            </p>
          </Acc>
          <Acc icon={MdListAlt} title="Cómo comprar">
            <p>1. Escribe tu {game.idLabel}.</p>
            <p>2. Elige tu paquete.</p>
            <p>3. Toca COMPRAR AHORA y paga el QR por el monto exacto.</p>
            <p>4. Envía tu comprobante por WhatsApp.</p>
            <p>5. Entregamos tu recarga apenas confirmemos el pago.</p>
          </Acc>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase italic">Preguntas frecuentes</h2>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80">
          <Acc title="¿Dónde encuentro mi ID?">
            <p>Abre el juego y entra a tu perfil: ahí aparece tu ID. Cópialo para no equivocarte.</p>
          </Acc>
          <Acc title="¿Necesitan mi contraseña?">
            <p>No. Solo necesitamos tu ID. Nunca te pediremos tu contraseña.</p>
          </Acc>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-yellow-300/60 bg-black/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {pkg ? (
              <>
                <div className="truncate font-semibold">{pkg.label}</div>
                <div className="font-display text-xl font-bold text-yellow-300">Bs {pkg.price}</div>
              </>
            ) : (
              <span className="text-white/60">Ningún paquete elegido</span>
            )}
            {pkg && hint && <div className="text-xs text-white/50">{hint}</div>}
          </div>
          <button
            disabled={!ready || creating}
            onClick={createOrder}
            className={`flex items-center gap-1 rounded-2xl px-5 py-3 font-display text-lg font-extrabold uppercase ${
              ready ? 'bg-yellow-300 text-black active:scale-95' : 'bg-white/10 text-white/40'
            }`}
          >
            Comprar ahora <MdChevronRight size={22} />
          </button>
        </div>
      </div>

      {creating && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 backdrop-blur-sm">
          <div className="space-y-4 text-center">
            <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-white/20 border-t-yellow-300" />
            <p className="font-display text-2xl font-bold uppercase italic">Procesando tu pedido...</p>
          </div>
        </div>
      )}
    </div>
  );
}
