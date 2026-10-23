'use client';
import { useState } from 'react';
import GameCard from '@/components/GameCard';
import Banner from '@/components/Banner';
import { Search } from 'lucide-react';

function Title({ children }) {
  return (
    <h2 className="flex items-center gap-3 text-xl font-semibold mb-4">
      <span className="h-7 w-1.5 rounded-full bg-yellow-300" />
      {children}
    </h2>
  );
}

export default function GameSearch({ games }) {
  const [q, setQ] = useState('');
  const term = q.trim().toLowerCase();
  const found = term ? games.filter((g) => g.name.toLowerCase().includes(term)) : [];
  const rec = games.slice(0, 2);
  const pop = games.slice(2);

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
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

          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase">Tienda de juegos</h2>

          <section>
            <Title>Recomendados para ti</Title>
            <div className="grid grid-cols-2 gap-3">
              {rec.map((g) => (
                <GameCard key={g.slug} game={g} big />
              ))}
            </div>
          </section>

          {pop.length > 0 && (
            <section>
              <Title>Populares en la tienda</Title>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {pop.map((g) => (
                  <GameCard key={g.slug} game={g} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
