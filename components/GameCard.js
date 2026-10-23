import Link from 'next/link';
import GameImg from '@/components/GameImg';

export default function GameCard({ game, big = false }) {
  const prices = (game.packages || []).map((p) => p.price);
  const min = prices.length ? Math.min(...prices) : null;
  return (
    <Link
      href={`/juego/${game.slug}`}
      className="group block rounded-3xl overflow-hidden border border-white/20 bg-black active:scale-95 transition"
    >
      <div className={`bg-gradient-to-br ${game.color} aspect-[4/3.2] overflow-hidden`}>
        <GameImg
          game={game}
          className={`h-full w-full ${big ? 'text-7xl' : 'text-5xl'} group-hover:scale-105 transition`}
        />
      </div>
      <div className="px-2 py-3 text-center">
        <div className={`font-semibold leading-tight ${big ? 'text-lg' : 'text-sm'}`}>
          {game.name}
        </div>
        {min !== null && <div className="text-xs text-white/50 mt-1">Desde Bs {min}</div>}
      </div>
    </Link>
  );
}
