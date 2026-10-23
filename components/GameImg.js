'use client';
import { useState } from 'react';

export default function GameImg({ game, className = '' }) {
  const [fail, setFail] = useState(false);
  if (fail) {
    return <span className={`flex items-center justify-center ${className}`}>{game.emoji}</span>;
  }
  return (
    <img
      src={`/games/${game.slug}.jpg`}
      alt={game.name}
      onError={() => setFail(true)}
      className={`object-cover ${className}`}
    />
  );
}
