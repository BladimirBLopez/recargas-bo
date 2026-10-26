import { notFound } from 'next/navigation';
import Checkout from '@/components/Checkout';
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
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {game.emoji} Recargar {game.name}
      </h1>
      <Checkout game={game} />
    </div>
  );
}
