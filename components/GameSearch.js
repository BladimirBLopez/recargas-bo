'use client';
import { useEffect, useState } from 'react';
import GameCard from '@/components/GameCard';
import Banner from '@/components/Banner';
import { MdQrCode2, MdVerifiedUser, MdHeadsetMic } from 'react-icons/md';

const TABS = [
  { id: 'todos', label: 'Todos', emoji: '', title: 'Todos los juegos', test: () => true },
  { id: 'populares', label: 'Populares', emoji: '🔥', title: 'Los más populares', test: (g) => g.popular },
  { id: 'nuevos', label: 'Nuevos', emoji: '🌟', title: 'Recién llegados', test: (g) => g.badge === 'nuevo' },
  { id: 'directa', label: 'Recarga directa', emoji: '', title: 'Recarga directa al ID', test: (g) => g.kind === 'directa' },
  { id: 'tarjetas', label: 'Tarjetas y códigos', emoji: '', title: 'Tarjetas y códigos', test: (g) => g.kind === 'tarjeta' },
];

const TRUST = [
  [<MdQrCode2 size={18} />, 'Pago con QR'],
  [<MdVerifiedUser size={18} />, 'Pago seguro'],
  [<MdHeadsetMic size={18} />, 'Soporte WhatsApp'],
];

const STEPS = [
  ['1', 'Elige tu juego', 'Busca el juego y el paquete que quieres.'],
  ['2', 'Escribe tu ID', 'Revisa que tus datos estén bien.'],
  ['3', 'Paga con QR', 'Verás la confirmación en esa misma pantalla.'],
];

function TrustBar() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TRUST.map(([icon, text]) => (
        <div
          key={text}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-yellow-300/30 bg-zinc-950/80 px-2 py-2 text-center text-[11px] font-bold uppercase leading-tight text-white shadow-[0_0_14px_-8px_rgb(var(--accent)/0.7)]"
        >
          <span className="shrink-0 text-yellow-300">{icon}</span>
          {text}
        </div>
      ))}
    </div>
  );
}

function Steps() {
  return (
    <section>
      <Title>Cómo comprar</Title>
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map(([n, title, text]) => (
          <div key={n} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
            <span className="grid h-9 w-9 shrink-0 -skew-x-12 place-items-center rounded-lg bg-gradient-to-r from-yellow-300 to-orange-400 font-display text-lg font-extrabold text-black shadow-[0_0_14px_-3px_rgb(var(--accent)/0.8)]">
              {n}
            </span>
            <div>
              <div className="font-display text-base font-bold uppercase">{title}</div>
              <p className="text-sm text-white/70">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

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

          <TrustBar />

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
                  {split && <Steps />}
                  <Section title={split ? 'Más juegos' : TABS[0].title} list={rest} />
                  {!split && <Steps />}
                </div>
              );
            }
            return <Section key={tab.id} emoji={tab.emoji} title={tab.title} list={games.filter(tab.test)} />;
          })()}

        </>
      )}
    </div>
  );
}
