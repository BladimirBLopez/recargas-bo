import { notFound } from 'next/navigation';
import Checkout from '@/components/Checkout';
import GameImg from '@/components/GameImg';
import { getGame } from '@/data/games';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const game = getGame(slug);
  return { title: game ? `Recargar ${game.name} en Bolivia` : 'Juego no encontrado' };
}

export default async function GamePage({ params }) {
  const { slug } = await params;
  const game = getGame(slug);
  if (!game) notFound();
  return (
    <div className="space-y-6">
      <section
        className={`rounded-3xl bg-gradient-to-br ${game.color} p-6 sm:p-8 flex items-center gap-4 shadow-lg`}
      >
        <GameImg game={game} className="h-20 w-20 rounded-2xl text-6xl" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Recargar {game.name}</h1>
          <p className="text-white/85 text-sm mt-1">Paga por QR y recibe tu recarga.</p>
        </div>
      </section>
      <Checkout game={game} />
    </div>
  );
}
