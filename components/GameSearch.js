'use client';
import { useEffect, useState } from 'react';
import GameCard from '@/components/GameCard';
import Banner from '@/components/Banner';

const TABS = [
  { id: 'populares', label: 'Populares', emoji: '🔥', title: 'Los más populares', test: (g) => g.popular },
  { id: 'nuevos', label: 'Nuevos', emoji: '🌟', title: 'Recién llegados', test: (g) => g.badge === 'nuevo' },
  { id: 'directa', label: 'Recarga directa', emoji: '', title: 'Recarga directa al ID', test: (g) => g.kind === 'directa' },
  { id: 'tarjetas', label: 'Tarjetas y códigos', emoji: '', title: 'Tarjetas y códigos', test: (g) => g.kind === 'tarjeta' },
];

const PERKS = [
  ['⚡', 'Entrega rápida', 'Procesamos tu pedido en pocos minutos.'],
  ['🔒', 'Pago seguro', 'QR bancario de Bolivia.'],
  ['💬', 'Soporte real', 'Te atendemos por WhatsApp si algo falla.'],
];

function Title({ emoji, children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold uppercase italic">
      <span className="h-5 w-1.5 -skew-x-12 rounded-sm bg-yellow-300 shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
      {emoji && <span>{emoji}</span>}
      {children}
    </h2>
  );
}

const GRID = 'grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5';

export default function GameSearch({ games }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState('populares');
  const term = q.trim().toLowerCase();
  const found = term ? games.filter((g) => g.name.toLowerCase().includes(term)) : [];

  // El buscador del header avisa lo que se escribe.
  useEffect(() => {
    const on = (e) => setQ(e.detail || '');
    window.addEventListener('rb-q', on);
    return () => window.removeEventListener('rb-q', on);
  }, []);

  // Marca la pestaña según la sección visible.
  useEffect(() => {
    if (term) return;
    const els = TABS.map((t) => document.getElementById(t.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-30% 0px -65% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [term]);

  const go = (id) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-6">
      {term ? (
        <section>
          <Title>Resultados</Title>
          {found.length ? (
            <div className={GRID}>
              {found.map((g) => (
                <GameCard key={g.slug} game={g} />
              ))}
            </div>
          ) : (
            <p className="text-white/50">No encontramos ese juego.</p>
          )}
        </section>
      ) : (
        <>
          <Banner />

          <div className="no-scrollbar sticky top-[var(--hh,62px)] z-20 -mx-4 flex gap-3 overflow-x-auto bg-[#08080c]/90 px-4 py-2 backdrop-blur">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                className={
                  'shrink-0 rounded-xl border px-4 py-2 font-display text-sm font-bold uppercase transition ' +
                  (active === t.id
                    ? 'border-yellow-300 bg-yellow-300 text-black shadow-[0_0_16px_-2px_rgb(var(--accent)/0.7)]'
                    : 'border-white/10 bg-zinc-950 text-white')
                }
              >
                {t.emoji && <span className="mr-1.5">{t.emoji}</span>}
                {t.label}
              </button>
            ))}
          </div>

          {TABS.map((t) => {
            const list = games.filter(t.test);
            if (!list.length) return null;
            return (
              <section key={t.id} id={t.id} className="scroll-mt-44">
                <Title emoji={t.emoji && t.id !== 'directa' ? t.emoji : ''}>{t.title}</Title>
                <div className={GRID}>
                  {list.map((g) => (
                    <GameCard key={g.slug} game={g} />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="space-y-4 pt-2">
            {PERKS.map(([icon, title, text]) => (
              <div key={title} className="relative rounded-3xl border border-white/10 bg-zinc-950/80 px-5 py-3">
                <span className="absolute bottom-4 left-0 top-4 w-1 rounded-r bg-yellow-300" />
                <div className="font-display text-lg font-bold uppercase">
                  <span className="mr-2 inline-grid h-8 w-8 place-items-center rounded-lg bg-yellow-300/15 align-middle text-base shadow-[0_0_14px_-4px_rgb(var(--accent)/0.8)]">{icon}</span>
                  {title}
                </div>
                <p className="text-white/70">{text}</p>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
