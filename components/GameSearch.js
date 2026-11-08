'use client';
import { useEffect, useState } from 'react';
import GameCard from '@/components/GameCard';
import Banner from '@/components/Banner';
import { MdFlashOn, MdVerifiedUser, MdHeadsetMic } from 'react-icons/md';

const TABS = [
  { id: 'todos', label: 'Todos', emoji: '', title: 'Todos los juegos', test: () => true },
  { id: 'populares', label: 'Populares', emoji: '🔥', title: 'Los más populares', test: (g) => g.popular },
  { id: 'nuevos', label: 'Nuevos', emoji: '🌟', title: 'Recién llegados', test: (g) => g.badge === 'nuevo' },
  { id: 'directa', label: 'Recarga directa', emoji: '', title: 'Recarga directa al ID', test: (g) => g.kind === 'directa' },
  { id: 'tarjetas', label: 'Tarjetas y códigos', emoji: '', title: 'Tarjetas y códigos', test: (g) => g.kind === 'tarjeta' },
];

const PERKS = [
  [<MdFlashOn size={20} className="text-yellow-300" />, 'Entrega rápida', 'Procesamos tu pedido en pocos minutos.'],
  [<MdVerifiedUser size={20} className="text-yellow-300" />, 'Pago seguro', 'QR bancario de Bolivia.'],
  [<MdHeadsetMic size={20} className="text-yellow-300" />, 'Soporte real', 'Te atendemos por WhatsApp si algo falla.'],
];

function Title({ emoji, children }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-extrabold uppercase italic">
      <span className="h-5 w-1.5 -skew-x-12 rounded-sm bg-yellow-300 shadow-[0_0_10px_rgb(var(--accent)/0.8)]" />
      {emoji && <span>{emoji}</span>}
      {children}
      <span className="ml-1 h-px flex-1 bg-gradient-to-r from-yellow-300/60 via-orange-400/30 to-transparent" />
    </h2>
  );
}

const GRID = 'grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5';

function Section({ emoji, title, list }) {
  if (!list.length) return null;
  return (
    <section>
      <Title emoji={emoji}>{title}</Title>
      <div className={GRID}>
        {list.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </section>
  );
}

export default function GameSearch({ games }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState('todos');
  const term = q.trim().toLowerCase();
  const found = term ? games.filter((g) => g.name.toLowerCase().includes(term)) : [];

  // El buscador del header avisa lo que se escribe.
  useEffect(() => {
    const on = (e) => setQ(e.detail || '');
    window.addEventListener('rb-q', on);
    return () => window.removeEventListener('rb-q', on);
  }, []);

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

          <div className="no-scrollbar sticky top-[var(--hh,62px)] z-20 -mx-4 flex gap-3 overflow-x-auto tabsbar bg-[#08080c]/90 px-4 py-2 backdrop-blur">
            {TABS.filter((t) => t.id === 'todos' || games.some(t.test)).map((t) => (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={
                  'shrink-0 rounded-xl border px-4 py-2 font-display text-sm font-bold uppercase transition ' +
                  (active === t.id
                    ? 'border-transparent bg-gradient-to-r from-yellow-300 to-orange-400 text-black shadow-[0_0_16px_-2px_rgb(var(--accent)/0.7)]'
                    : 'border-white/10 bg-zinc-950 text-white')
                }
              >
                {t.emoji && <span className="mr-1.5">{t.emoji}</span>}
                {t.label}
              </button>
            ))}
          </div>

          {(() => {
            const tab = TABS.find((t) => t.id === active) || TABS[0];
            if (tab.id === 'todos') {
              const pop = games.filter(TABS[1].test);
              const fresh = games.filter((g) => TABS[2].test(g) && !pop.includes(g));
              const rest = games.filter((g) => !pop.includes(g) && !fresh.includes(g));
              const split = pop.length + fresh.length > 0;
              return (
                <div key="todos" className="space-y-8">
                  <Section emoji={TABS[1].emoji} title={TABS[1].title} list={pop} />
                  <Section emoji={TABS[2].emoji} title={TABS[2].title} list={fresh} />
                  <Section title={split ? 'Más juegos' : TABS[0].title} list={rest} />
                </div>
              );
            }
            return <Section key={tab.id} emoji={tab.emoji} title={tab.title} list={games.filter(tab.test)} />;
          })()}

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
