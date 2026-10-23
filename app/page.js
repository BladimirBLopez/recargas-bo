import GameCard from '@/components/GameCard';
import { games } from '@/data/games';

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-green-500/30 via-emerald-800/20 to-transparent p-6 sm:p-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">
          Recarga tus juegos en Bolivia
        </h1>
        <p className="text-white/70 mb-5">
          Elige tu juego, paga por QR y recibe tu recarga.
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">💳 Pago con QR</span>
          <span className="rounded-full bg-white/10 px-3 py-1">⚡ Entrega rápida</span>
          <span className="rounded-full bg-white/10 px-3 py-1">💬 Soporte por WhatsApp</span>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">Elige tu juego</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((g) => (
            <GameCard key={g.slug} game={g} />
          ))}
        </div>
      </section>
    </div>
  );
}
