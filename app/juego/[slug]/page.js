import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MdQrCode2, MdVerifiedUser, MdHeadsetMic, MdChevronRight } from 'react-icons/md';
import Checkout from '@/components/Checkout';
import GameImg from '@/components/GameImg';
import GameCard from '@/components/GameCard';
import { getGame } from '@/data/games';
import { getGames } from '@/lib/games-state';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = (await getGames()).find((g) => g.slug === slug);
  return { title: game ? `Recargar ${game.name} en Bolivia` : 'Juego no encontrado' };
}

const CHIPS = [
  [MdQrCode2, 'Pago con QR'],
  [MdVerifiedUser, 'Sin contraseña'],
  [MdHeadsetMic, 'Soporte WhatsApp'],
];

export default async function GamePage({ params }) {
  const { slug } = await params;
  const all = await getGames();
  const game = all.find((g) => g.slug === slug);
  if (!game || game.maintenance) notFound();
  const others = all.filter((g) => g.slug !== game.slug && !g.maintenance).slice(0, 4);

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1 text-sm text-white/60">
        <Link href="/" className="hover:text-white">Inicio</Link>
        <MdChevronRight size={18} />
        <span className="truncate text-white">{game.name}</span>
      </nav>

      <section
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${game.color} p-5 ring-1 ring-white/15 shadow-[0_20px_50px_-20px_rgb(var(--accent)/0.6)] sm:p-8`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative flex items-center gap-4">
          <GameImg
            game={game}
            className="h-24 w-24 shrink-0 rounded-2xl text-6xl shadow-xl ring-2 ring-white/30 sm:h-28 sm:w-28"
          />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold uppercase italic leading-none drop-shadow sm:text-4xl">
              Recargar {game.name}
            </h1>
            <p className="mt-1.5 text-sm text-white/85">Servicio para Bolivia</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
          {CHIPS.map(([Icon, text]) => (
            <span
              key={text}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur"
            >
              <Icon size={16} className="text-yellow-300" /> {text}
            </span>
          ))}
        </div>
      </section>

      <Checkout game={game} />

      {others.length > 0 && (
        <section className="-mt-24 pb-32">
          <h2 className="mb-4 flex items-center gap-3 font-display text-xl font-extrabold uppercase italic">
            <span className="h-6 w-1.5 rounded-full bg-yellow-300" />
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {others.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
