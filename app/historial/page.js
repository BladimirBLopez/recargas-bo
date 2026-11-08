'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/useUser';
import { MdHistory, MdChevronRight } from 'react-icons/md';

const STATES = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
  EXPIRADO: 'Expirado',
};

function fechaBolivia(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(d);
}

export default function Historial() {
  const [order, setOrder] = useState(null);
  const [ready, setReady] = useState(false);
  const { user, loading } = useUser();
  const [mine, setMine] = useState({
    owner: '', rows: [], busy: false, error: '',
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('rb_order');
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.code && Date.now() - o.ts < 2 * 60 * 60 * 1000) setOrder(o);
      }
    } catch (e) {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setMine({
        owner: '', rows: [], busy: false, error: '',
      });
      return;
    }

    const owner = user.email;
    let active = true;

    setMine({
      owner, rows: [], busy: true, error: '',
    });

    fetch('/api/mis-pedidos', { cache: 'no-store' })
      .then(async (r) => {
        if (!r.ok) throw new Error('consulta');
        return r.json();
      })
      .then((data) => {
        if (!active) return;
        setMine({
          owner,
          rows: Array.isArray(data.orders)
            ? data.orders : [],
          busy: false,
          error: '',
        });
      })
      .catch(() => {
        if (!active) return;
        setMine({
          owner,
          rows: [],
          busy: false,
          error: 'No pudimos cargar tus compras.',
        });
      });

    return () => { active = false; };
  }, [user?.email, loading]);

  const own = user && mine.owner === user.email
    ? mine
    : { rows: [], busy: true, error: '' };

  const localVisible = ready && !loading && !!order &&
    (!user || (
      !own.busy &&
      !own.error &&
      own.rows.some((o) => o.code === order.code)
    ));

  return (
    <div className="space-y-6 pb-28">
      <h2 className="flex items-center gap-3 font-display text-3xl font-extrabold uppercase italic">
        <span className="h-7 w-1.5 -skew-x-12 rounded-sm bg-yellow-300 shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
        Historial
      </h2>

      {ready && !loading && !user && !order && (
        <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-8 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white/5 text-white/40">
            <MdHistory size={36} />
          </span>
          <p className="mt-4 font-display text-xl font-bold uppercase">Sin pedidos en curso</p>
          <p className="mt-1 text-sm text-white/60">No tienes un pedido en curso en este celular.</p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 px-6 py-3 font-display text-lg font-extrabold uppercase text-black shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.8)] transition active:scale-95"
          >
            Ver juegos
          </Link>
        </div>
      )}

      {localVisible && (
        <div className="relative overflow-hidden rounded-3xl border border-yellow-300/30 bg-zinc-950/80 p-5 shadow-[0_0_30px_-10px_rgb(var(--accent)/0.6)]">
          <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-yellow-300 to-orange-500" />
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-lg font-bold text-yellow-300">{order.code}</div>
            <span className="rounded-full bg-yellow-300/15 px-3 py-0.5 font-display text-xs font-bold uppercase text-yellow-300">
              En curso
            </span>
          </div>
          <div className="mt-3 text-sm">
            {order.game} · {order.pkg} · <b className="text-yellow-300">Bs {order.price}</b>
          </div>
          <div className="mt-1 text-sm text-white/70">
            {order.idLabel}: {order.id}
          </div>
          <div className="mt-1 text-xs text-white/40">Se guarda 2 horas en este celular.</div>
          <Link
            href={'/juego/' + order.slug}
            className="mt-4 flex items-center justify-center gap-1 rounded-2xl bg-gradient-to-r from-yellow-300 to-orange-400 py-3 font-display text-lg font-extrabold uppercase text-black shadow-[0_6px_20px_-6px_rgb(var(--accent)/0.8)] transition active:scale-95"
          >
            Continuar mi pedido <MdChevronRight size={22} />
          </Link>
        </div>
      )}

      <section className="space-y-3">
        <h3 className="font-display text-2xl font-extrabold uppercase">
          Mis compras
        </h3>

        {loading && (
          <p className="text-sm text-white/60">
            Comprobando tu cuenta...
          </p>
        )}

        {!loading && !user && (
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-5">
            <p className="text-sm text-white/70">
              Inicia sesión para consultar tus compras.
            </p>
            <Link href="/perfil"
              className="mt-3 inline-block font-bold text-yellow-300">
              Ir a mi perfil
            </Link>
          </div>
        )}

        {!loading && user && own.busy && (
          <p className="text-sm text-white/60">
            Cargando compras...
          </p>
        )}

        {!loading && user && own.error && (
          <p role="alert" className="text-sm text-white/70">
            {own.error}
          </p>
        )}

        {!loading && user && !own.busy &&
          !own.error && own.rows.length === 0 && (
          <p className="text-sm text-white/60">
            Todavía no tienes compras vinculadas a esta cuenta.
          </p>
        )}

        {!loading && user && !own.busy &&
          !own.error && own.rows.map((o) => (
          <article key={o.code}
            className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-bold text-yellow-300">
                {o.code}
              </span>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold uppercase">
                {STATES[o.status] || 'Desconocido'}
              </span>
            </div>

            <p className="mt-3 text-sm font-semibold capitalize">
              {String(o.game_slug).replace(/-/g, ' ')}
            </p>

            <p className="text-sm text-white/70">
              {o.package_label}
            </p>

            <p className="mt-2 font-bold text-yellow-300">
              Bs {Number(o.price).toLocaleString('es-BO', {
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-1 text-xs text-white/50">
              {fechaBolivia(o.created_at)}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
