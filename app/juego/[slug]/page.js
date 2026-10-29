import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MdQrCode2, MdVerifiedUser, MdHeadsetMic, MdChevronRight, MdClose } from 'react-icons/md';
import Checkout from '@/components/Checkout';
import GameImg from '@/components/GameImg';
import GameCard from '@/components/GameCard';
import { getGame } from '@/data/games';
import { getGames } from '@/lib/games-state';
import { getDetailBanner } from '@/lib/game-detail-banners';

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
  const detail = await getDetailBanner(game.slug);

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
        {detail?.url && (
          <div
            className="pointer-events-none absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${detail.url}")` }}
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/25" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <Link
          href="/"
          aria-label="Cerrar detalle y volver al catálogo"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/25 bg-black/60 text-white backdrop-blur hover:bg-black/80 sm:right-5 sm:top-5"
        >
          <MdClose size={21} />
        </Link>

        <div className="relative mb-4 flex flex-wrap gap-2 pr-10">
          <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-lg sm:text-xs">
            {game.kind === 'tarjeta' ? 'TARJETAS DIGITALES' : 'RECARGA DIRECTA AL ID'}
          </span>
        </div>

        <div className="relative flex items-center gap-4">
          <GameImg
            game={game}
            className="h-24 w-24 shrink-0 rounded-2xl text-6xl shadow-xl ring-2 ring-white/30 sm:h-28 sm:w-28"
          />
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold uppercase italic leading-none drop-shadow sm:text-4xl">
              {detail?.title || game.name}
            </h1>
            <p className="mt-1.5 text-sm text-white/85">{detail?.subtitle || 'Servicio para Bolivia'}</p>
          </div>
        </div>
        <div className="relative mt-4 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
          {CHIPS.map(([Icon, text], index) => (
            <span
              key={text}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 backdrop-blur"
            >
              <Icon size={16} className="text-cyan-300" /> {[detail?.chip1, detail?.chip2, detail?.chip3][index] || text}
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
