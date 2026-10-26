'use client';
import { useState } from 'react';

// Busca /games/<slug>.jpg (arte real) y si no existe usa /games/<slug>.svg (portada generada).
const EXT = ['jpg', 'svg'];

export default function GameImg({ game, className = '' }) {
  const [i, setI] = useState(0);
  if (i >= EXT.length) {
    return <span className={`flex items-center justify-center ${className}`}>{game.emoji}</span>;
  }
  return (
    <img
      src={`/games/${game.slug}.${EXT[i]}`}
      alt={game.name}
      onError={() => setI(i + 1)}
      className={`object-cover ${className}`}
    />
  );
}
