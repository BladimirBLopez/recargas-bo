import Link from 'next/link';
import { notFound } from 'next/navigation';
import { QrCode, ShieldCheck, Headset } from 'lucide-react';
import Checkout from '@/components/Checkout';
import GameImg from '@/components/GameImg';
import GameCard from '@/components/GameCard';
import { games, getGame } from '@/data/games';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = getGame(slug);
  return { title: game ? `Recargar ${game.name} en Bolivia` : 'Juego no encontrado' };
}

export default async function GamePage({ params }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game || game.maintenance) notFound();
  const others = games.filter((g) => g.slug !== game.slug && !g.maintenance).slice(0, 4);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-white/60 flex items-center gap-2">
        <Link href="/" className="hover:text-white">Inicio</Link>
        <span>/</span>
        <span className="text-white">{game.name}</span>
      </nav>

      <section className={`rounded-3xl bg-gradient-to-br ${game.color} p-5 sm:p-8 shadow-lg`}>
        <div className="flex items-center gap-4">
          <GameImg game={game} className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl text-6xl" />
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black italic leading-tight">
              Recargar {game.name}
            </h1>
            <p className="text-white/85 text-sm mt-1">Servicio para Bolivia</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 text-xs sm:text-sm font-semibold">
          <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
            <QrCode size={14} /> Pago con QR
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
            <ShieldCheck size={14} /> Sin contraseña
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5">
            <Headset size={14} /> Soporte WhatsApp
          </span>
        </div>
      </section>

      <Checkout game={game} />

      {others.length > 0 && (
        <section className="-mt-24 pb-32">
          <h2 className="flex items-center gap-3 text-xl font-semibold mb-4">
            <span className="h-7 w-1.5 rounded-full bg-yellow-300" />
            También te puede interesar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {others.map((g) => (
              <GameCard key={g.slug} game={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
