import Link from 'next/link';
import GameImg from '@/components/GameImg';

export default function GameCard({ game }) {
  const prices = (game.packages || []).map((p) => p.price);
  const min = prices.length ? Math.min(...prices) : null;
  return (
    <Link
      href={`/juego/${game.slug}`}
      className="group rounded-2xl overflow-hidden border border-white/10 bg-white/5 active:scale-95 transition"
    >
      <div className={`bg-gradient-to-br ${game.color} aspect-[4/3] overflow-hidden`}>
        <GameImg
          game={game}
          className="h-full w-full text-6xl group-hover:scale-105 transition"
        />
      </div>
      <div className="p-3">
        <div className="font-semibold leading-tight">{game.name}</div>
        {min !== null && <div className="text-xs text-white/60 mt-1">Desde Bs {min}</div>}
      </div>
    </Link>
  );
}
