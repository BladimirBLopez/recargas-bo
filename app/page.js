import GameSearch from '@/components/GameSearch';
import { games } from '@/data/games';

export default function Home() {
  return <GameSearch games={games} />;
}
