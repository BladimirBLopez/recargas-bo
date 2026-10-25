'use client';
import { useState } from 'react';
import GameCard from '@/components/GameCard';
import Banner from '@/components/Banner';
import { Search, MessageCircle } from 'lucide-react';
import { WHATSAPP } from '@/data/games';

function Title({ emoji, children }) {
  return (
    <h2 className="font-display flex items-center gap-3 text-2xl font-extrabold uppercase italic mb-4">
      <span className="h-7 w-1.5 rounded-full bg-yellow-300" />
      {emoji && <span>{emoji}</span>}
      {children}
    </h2>
  );
}

const PERKS = [
  ['💳', 'Paga con QR de tu banco'],
  ['🧾', 'Pedido con código'],
  ['💬', 'Soporte por WhatsApp'],
];

export default function GameSearch({ games }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const found = term ? games.filter((g) => g.name.toLowerCase().includes(term)) : [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-3">
        <Search size={20} className="text-white/50" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca juegos, gift cards y más"
          className="w-full bg-transparent outline-none placeholder:text-white/40"
        />
      </div>

      {term ? (
        <section>
          <Title>Resultados</Title>
          {found.length ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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

          <section>
            <Title emoji="🔥">Los más populares</Title>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {games.map((g) => (
                <GameCard key={g.slug} game={g} />
              ))}
            </div>
          </section>

          <section className="grid grid-cols-3 gap-3 text-center">
            {PERKS.map(([icon, text]) => (
              <div key={text} className="rounded-2xl border border-white/10 bg-white/5 px-2 py-3">
                <div className="text-2xl">{icon}</div>
                <div className="mt-1 text-[11px] font-semibold leading-tight text-white/80">{text}</div>
              </div>
            ))}
          </section>
        </>
      )}

      <a
        href={`https://wa.me/${WHATSAPP}`}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg active:scale-95 transition"
      >
        <MessageCircle size={28} />
      </a>
    </div>
  );
}
