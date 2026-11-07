import { getGames } from '@/lib/games-state';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://flakitogaming.store';

export default async function sitemap() {
  let games = [];
  try {
    games = (await getGames()).filter((g) => !g.maintenance);
  } catch (e) {}
  const fixed = ['', '/ayuda', '/garantias', '/terminos', '/privacidad'];
  return [
    ...fixed.map((p) => ({ url: SITE_URL + p })),
    ...games.map((g) => ({ url: SITE_URL + '/juego/' + g.slug })),
  ];
}
