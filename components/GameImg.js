'use client';
import { useState } from 'react';

// Orden: foto de Cloudinary (game.image), /games/<slug>.jpg, /games/<slug>.svg, emoji.
export default function GameImg({ game, className = '' }) {
  const srcs = [...(game.image ? [game.image] : []), `/games/${game.slug}.jpg`, `/games/${game.slug}.svg`];
  const [i, setI] = useState(0);
  if (i >= srcs.length) {
    return <span className={`flex items-center justify-center ${className}`}>{game.emoji}</span>;
  }
  return <img src={srcs[i]} alt={game.name} onError={() => setI(i + 1)} className={`object-cover ${className}`} />;
}
