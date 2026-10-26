import GameCard from '@/components/GameCard';
import { games } from '@/data/games';

export default function Home() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Recarga tus juegos</h1>
      <p className="text-white/60 mb-6">Elige tu juego, paga por QR y recibe tu recarga.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {games.map((g) => (
          <GameCard key={g.slug} game={g} />
        ))}
      </div>
    </div>
  );
}
