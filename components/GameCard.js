import Link from 'next/link';
import GameImg from '@/components/GameImg';

const BADGE = {
  promo: ['🔥 PROMO', 'bg-gradient-to-r from-orange-500 to-red-500 text-white'],
  nuevo: ['NUEVO', 'bg-yellow-300 text-black'],
};

export default function GameCard({ game, big = false }) {
  const badge = BADGE[game.badge];
  const off = Boolean(game.maintenance);

  const body = (
    <div className={`relative bg-gradient-to-br ${game.color} aspect-[3/4] overflow-hidden`}>
      <div className={off ? 'h-full w-full grayscale opacity-60' : 'h-full w-full'}>
        <GameImg
          game={game}
          className={`h-full w-full ${big ? 'text-8xl' : 'text-6xl'} group-hover:scale-105 transition`}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black to-transparent" />
      {badge && (
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase ${badge[1]}`}
        >
          {badge[0]}
        </span>
      )}
      {off && (
        <span className="absolute left-[-10%] right-[-10%] top-1/2 -translate-y-1/2 -rotate-12 border-y-2 border-red-500 bg-white py-1 text-center font-display text-[10px] font-extrabold uppercase tracking-wide text-red-600">
          Mantenimiento
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5">
        <div
          className={`font-display font-bold uppercase italic leading-tight ${big ? 'text-xl' : 'text-sm'} ${
            off ? 'text-white/60' : ''
          }`}
        >
          {game.name}
        </div>
        <div className="mt-1.5 h-1 w-1/4 rounded-full bg-yellow-300" />
      </div>
    </div>
  );

  const cls = 'group block rounded-2xl overflow-hidden border border-white/15 bg-black';
  if (off) return <div className={cls}>{body}</div>;
  return (
    <Link href={`/juego/${game.slug}`} className={`${cls} active:scale-95 transition`}>
      {body}
    </Link>
  );
}
