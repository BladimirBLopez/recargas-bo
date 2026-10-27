'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import GameImg from '@/components/GameImg';

const BADGE = {
  promo: ['🔥 PROMO', 'bg-gradient-to-r from-orange-500 to-red-500 text-white'],
  nuevo: ['NUEVO', 'bg-yellow-300 text-black'],
};

export default function GameCard({ game, big = false }) {
  const badge = BADGE[game.badge];
  const off = Boolean(game.maintenance);
  const from = game.packages && game.packages.length ? Math.min(...game.packages.map((p) => p.price)) : null;

  const body = (
    <div className={`relative bg-gradient-to-br ${game.color} aspect-[3/4] overflow-hidden`}>
      <div className={off ? 'h-full w-full grayscale opacity-60' : 'h-full w-full'}>
        <GameImg
          game={game}
          className={`h-full w-full ${big ? 'text-8xl' : 'text-6xl'} transition duration-500 group-hover:scale-110`}
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />
      {!off && (
        <span className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[shine_0.9s_ease]" />
      )}
      {badge && (
        <span
          className={`absolute top-2 right-2 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase shadow-lg ${badge[1]}`}
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
          className={`font-display font-bold uppercase italic leading-tight drop-shadow ${big ? 'text-xl' : 'text-sm'} ${
            off ? 'text-white/60' : ''
          }`}
        >
          {game.name}
        </div>
        {from !== null && !off ? (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="h-1 w-1/4 rounded-full bg-yellow-300 transition-all duration-300 group-hover:w-1/6" />
            <span className="font-display text-[11px] font-bold uppercase tracking-wide text-yellow-300">Desde Bs {from}</span>
          </div>
        ) : (
          <div className="mt-1.5 h-1 w-1/4 rounded-full bg-yellow-300 transition-all duration-300 group-hover:w-1/2" />
        )}
      </div>
    </div>
  );

  const cls =
    'group relative block overflow-hidden rounded-2xl border border-white/15 bg-black transition-shadow duration-300';

  if (off) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={cls}>{body}</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        href={`/juego/${game.slug}`}
        className={`${cls} hover:border-yellow-300/60 hover:shadow-[0_10px_30px_-8px_rgb(var(--accent)/0.6)]`}
      >
        {body}
      </Link>
    </motion.div>
  );
}
