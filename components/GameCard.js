import Link from 'next/link';
import GameImg from '@/components/GameImg';

const BADGE = {
  promo: ['🔥 PROMO', 'bg-red-500 text-white'],
  nuevo: ['NUEVO', 'bg-yellow-300 text-black'],
};

export default function GameCard({ game, big = false }) {
  const prices = (game.packages || []).map((p) => p.price);
  const min = prices.length ? Math.min(...prices) : null;
  const badge = BADGE[game.badge];
  const off = Boolean(game.maintenance);

  const body = (
    <div
      className={`relative bg-gradient-to-br ${game.color} aspect-[3/4] overflow-hidden ${
        off ? 'grayscale opacity-60' : ''
      }`}
    >
      <GameImg
        game={game}
        className={`h-full w-full ${big ? 'text-8xl' : 'text-6xl'} group-hover:scale-105 transition`}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
      {badge && !off && (
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${badge[1]}`}
        >
          {badge[0]}
        </span>
      )}
      {off && (
        <span className="absolute left-[-10%] right-[-10%] top-1/2 -translate-y-1/2 -rotate-12 bg-white py-1 text-center text-[10px] font-extrabold uppercase text-red-600">
          Mantenimiento
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 px-2 pb-2">
        <div className={`font-display font-extrabold uppercase leading-tight ${big ? 'text-xl' : 'text-sm'}`}>
          {game.name}
        </div>
        {min !== null && <div className="text-[10px] text-white/70">Desde Bs {min}</div>}
        <div className="mt-1 h-1 w-1/3 rounded-full bg-yellow-300" />
      </div>
    </div>
  );

  const cls = 'group block rounded-3xl overflow-hidden border border-white/20 bg-black';
  if (off) return <div className={cls}>{body}</div>;
  return (
    <Link href={`/juego/${game.slug}`} className={`${cls} active:scale-95 transition`}>
      {body}
    </Link>
  );
}
