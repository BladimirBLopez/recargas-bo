import Link from 'next/link';

export default function GameCard({ game }) {
  return (
    <Link
      href={`/juego/${game.slug}`}
      className={`rounded-2xl p-4 bg-gradient-to-br ${game.color} flex flex-col items-center justify-center gap-2 aspect-square shadow-lg active:scale-95 transition`}
    >
      <span className="text-5xl">{game.emoji}</span>
      <span className="font-semibold text-center">{game.name}</span>
    </Link>
  );
}
