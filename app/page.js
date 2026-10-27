import GameSearch from '@/components/GameSearch';
import { getGames } from '@/lib/games-state';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const games = await getGames();
  return <GameSearch games={games} />;
}
