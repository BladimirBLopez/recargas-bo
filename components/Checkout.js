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
  MdCheckCircle,
} from 'react-icons/md';
import { motion } from 'framer-motion';
import { MdPaid, MdSell } from 'react-icons/md';
import OrderPay from '@/components/OrderPay';

const inputCls =
  'w-full rounded-2xl border-2 border-white/15 bg-zinc-950 px-4 py-3.5 text-base outline-none placeholder:text-white/40 focus:border-yellow-300';
const PAGE = 8;
const ICONS = { diamond: IoDiamond, coin: MdPaid, tag: MdSell };

function Step({ n, title, action, children }) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-yellow-300 font-display text-lg font-extrabold text-black shadow-[0_0_14px_rgb(var(--accent)/0.6)]">
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
  const [zone, setZone] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rb_order');
      if (!raw) return;
      const o = JSON.parse(raw);
      if (o.slug === game.slug && Date.now() - o.ts < 2 * 60 * 60 * 1000) {
        setOrder(o);
        // Si ese pedido ya no esta PENDIENTE (pagado, entregado, cancelado, expirado o inexistente), se descarta.
        if (o.code) {
          fetch('/api/pedido/estado?code=' + encodeURIComponent(o.code), { cache: 'no-store' })
            .then((r) => (r.ok || r.status === 404 ? r.json() : null))
            .then((d) => {
              if (!d) return;
              if ((d.status && d.status !== 'PENDIENTE') || d.error === 'no_existe') {
                try {
                  const cur = JSON.parse(localStorage.getItem('rb_order') || 'null');
                  if (cur && cur.code === o.code) localStorage.removeItem('rb_order');
                } catch (e) {}
                setOrder((x) => (x && x.code === o.code ? null : x));
              }
            })
            .catch(() => {});
        }
      }
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
  const isRbx = game.slug === 'roblox';
  const hasVerif = isFF || isRbx || game.slug === 'mobile-legends';
  const id = playerId.trim();
  const idFormatOk = /^\d{8,12}$/.test(id);
  const isML = game.slug === 'mobile-legends';
  const PkgIcon = ICONS[game.icon] || IoDiamond;
  const zoneT = zone.trim();
  const formatOk = isRbx ? /^[A-Za-z0-9_]{3,20}$/.test(id) : isML ? /^\d{8,12}$/.test(id) && /^\d{3,5}$/.test(zoneT) : /^\d{8,12}$/.test(id);
  const mlOk = /^\d{5,12}$/.test(id) && /^\d{1,5}$/.test(zoneT);
  const fullId = isML ? `${id} (${zoneT})` : id;

  useEffect(() => {
    if (!hasVerif || !formatOk) {
      setVerif(null);
      return;
    }
    setVerif({ state: 'loading' });
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/verificar-id?game=${game.slug}&id=${id}&zone=${encodeURIComponent(zoneT)}`, { signal: ctrl.signal });
        const d = await r.json();
        if (d.ok) setVerif({ state: 'ok', nickname: d.nickname, username: d.username || '', region: d.region, avatar: d.avatar || '' });
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
  }, [id, zoneT, hasVerif, formatOk, game.slug]);

  const idReady = isML
    ? mlOk
    : hasVerif
      ? formatOk && (verif?.state === 'ok' || verif?.state === 'unknown')
      : id.length > 3;
  const ready = Boolean(pkg) && idReady;
  const showCard = hasVerif && verif?.state === 'ok';
  const hint = !idReady ? (isML ? 'Escribe tu ID y Zona' : 'Escribe tu ID') : !pkg ? 'Elige un paquete' : '';

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
          playerId: fullId,
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
        id: fullId,
        nick: verif?.state === 'ok' ? verif.nickname : undefined,
      });
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
        title={isML ? 'ID de usuario y Zona' : game.idLabel}
        action={
          showCard && (
            <button
              onClick={() => {
                setPlayerId('');
                setZone('');
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
            <div className={isML ? 'grid grid-cols-[1fr_7.5rem] gap-3' : ''}>
              <input
                value={playerId}
                onChange={(e) => setPlayerId(e.target.value)}
                placeholder={isML ? 'ID de usuario' : game.idLabel}
                inputMode={game.kind === 'tarjeta' ? 'text' : 'numeric'}
                className={inputCls}
              />
              {isML && (
                <input
                  value={zone}
                  onChange={(e) => setZone(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="Zona"
                  inputMode="numeric"
                  className={inputCls}
                />
              )}
            </div>
          )}
          {isML && id !== '' && zoneT !== '' && !mlOk && (
            <p className="text-sm text-red-400">El ID debe tener solo números (5 a 12 dígitos) y la Zona hasta 5 dígitos.</p>
          )}
          {(!hasVerif || isML) && idReady && !showCard && (
            <div className="rounded-2xl border border-white/15 bg-black p-4 text-sm">
              <p className="text-white/50">Se recargará a:</p>
              <p className="mt-1 font-bold text-white">
                {game.name} · {isML ? `ID ${id} · Zona ${zoneT}` : `${game.idLabel}: ${id}`}
              </p>
              {verif?.state === 'unknown' && (
                <p className="mt-2 text-xs text-yellow-300">No pudimos verificar el nombre ahora. Revisa bien tus datos antes de comprar.</p>
              )}
            </div>
          )}
          {hasVerif && verif?.state === 'loading' && <p className="text-sm text-white/60">{isRbx ? 'Verificando usuario...' : 'Verificando ID...'}</p>}
          {showCard && (
            <div className="rounded-3xl border border-white/15 bg-black p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${game.color} text-3xl`}
                >
                  {verif.avatar ? (
                    <img
                      src={verif.avatar}
                      alt="Avatar del jugador"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement?.querySelector('[data-avatar-fallback]')?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <span
                    data-avatar-fallback
                    className={verif.avatar ? 'hidden' : ''}
                  >
                    {game.emoji}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-bold text-white">{game.name}</p>
                  <div className="mt-1 flex justify-between gap-3 text-sm">
                    <span className="text-white/50">{isRbx ? 'Nombre:' : 'Usuario:'}</span>
                    <span className="truncate font-bold text-white">{verif.nickname}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="text-white/50">{isRbx ? 'Usuario Roblox:' : 'ID del juego:'}</span>
                    <span className="truncate font-bold text-white">{isRbx ? '@' + (verif.username || id) : isML ? id + ' (' + zoneT + ')' : id}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 border-t border-white/15 pt-4 text-sm text-white/50">
                <MdLock size={20} className="shrink-0 text-green-400" />
                <span>{isRbx ? 'Confirma que esta es tu cuenta. La entrega se coordina por WhatsApp.' : isML ? 'Tu recarga irá a esta cuenta y no se puede revertir. Revisa que sea la tuya.' : 'Tu recarga será entregada directamente a esta cuenta.'}</span>
              </div>
            </div>
          )}
          {hasVerif && verif?.state === 'invalid' && (
            <p className="text-sm text-red-400">{isRbx ? 'No encontramos ese usuario en Roblox. Revísalo.' : 'No encontramos ese ID en Free Fire. Revísalo.'}</p>
          )}
          {hasVerif && !isML && verif?.state === 'unknown' && (
            <p className="text-sm text-yellow-300">No pudimos verificar el ID ahora. Revísalo bien antes de continuar.</p>
          )}
          {id !== '' && hasVerif && !isML && !formatOk && (
            <p className="text-sm text-red-400">{isRbx ? 'El usuario debe tener 3 a 20 caracteres: letras, números o _ (sin espacios).' : 'El ID debe tener solo números (8 a 12 dígitos).'}</p>
          )}
          {!(showCard && isML) && (
            <p className="text-xs text-white/50">
              {game.kind === 'tarjeta'
                ? showCard
                  ? 'Revisa bien tu usuario antes de continuar.'
                  : 'Revisa bien tu usuario de Roblox. La entrega de la tarjeta se coordina por WhatsApp.'
                : `Revisa bien tu ID${isML ? ' y Zona' : ''}: si te equivocas, la recarga va a otra cuenta y no se puede revertir.`}
            </p>
          )}
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
                    ? 'border-yellow-300 bg-yellow-300/10 shadow-[0_0_22px_-6px_rgb(var(--accent)/0.7)]'
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
                  <PkgIcon size={30} className="shrink-0 text-sky-400" />
                  <div className="min-w-0">
                    <div className={`${num ? 'text-2xl' : 'text-base'} font-display font-extrabold leading-tight`}>
                      {big}
                    </div>
                    {unit && <div className="text-xs font-semibold tracking-wide text-white/60">{unit}</div>}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  {on ? <MdCheckCircle size={20} className="text-yellow-300" /> : <span />}
                  <span className="font-display text-lg font-bold text-yellow-300">Bs {p.price}</span>
                </div>
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
              {game.kind === 'tarjeta'
                ? game.about || `Compra tarjetas de ${game.name} en Bolivia. La entrega se coordina por WhatsApp.`
                : game.about || `Recarga ${game.name} en Bolivia usando solo tu ${game.idLabel}.`}
            </p>
          </Acc>
          <Acc icon={MdListAlt} title="Cómo comprar">
            <p>1. Escribe tu {game.idLabel}.</p>
            <p>2. Elige tu paquete.</p>
            <p>3. Toca COMPRAR AHORA y paga el QR por el monto exacto.</p>
            <p>4. Envía tu comprobante por WhatsApp.</p>
            <p>5. {game.kind === 'tarjeta' ? 'Te enviamos tu código por WhatsApp apenas confirmemos el pago.' : 'Entregamos tu recarga apenas confirmemos el pago.'}</p>
          </Acc>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase italic">Preguntas frecuentes</h2>
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80">
          <Acc title="¿Dónde encuentro mi ID?">
            <p>
              {isML
                ? (game.idHelp || 'Toca tu avatar arriba a la izquierda en el juego. Verás tu ID y, entre paréntesis, tu Zona (ej. 123456789 (1234)). Escribe cada número en su campo.')
                : game.slug === 'roblox'
                ? (game.idHelp || 'Es tu nombre de usuario de Roblox (no el nombre visible). Lo ves en tu perfil.')
                : (game.idHelp || 'Abre el juego y entra a tu perfil: ahí aparece tu ID. Cópialo para no equivocarte.')}
            </p>
          </Acc>
          <Acc title="¿Necesitan mi contraseña?">
            <p>No. Solo necesitamos tu {isML ? 'ID y Zona' : game.slug === 'roblox' ? 'usuario' : 'ID'}. Nunca te pediremos tu contraseña.</p>
          </Acc>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-yellow-300/60 bg-gradient-to-t from-black via-black/95 to-zinc-950/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0 text-sm">
            {pkg ? (
              <>
                <div className="truncate font-semibold">{pkg.label}</div>
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="font-display text-xl font-bold text-yellow-300"
                >
                  Bs {pkg.price}
                </motion.div>
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
              ready ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-black shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.8)] active:scale-95' : 'bg-white/10 text-white/40'
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
