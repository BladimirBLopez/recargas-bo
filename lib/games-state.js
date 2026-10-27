import { games } from '../data/games.js';
import { sql } from './db.js';

// Estado de mantenimiento guardado en Neon (tabla game_settings).
export async function maintenanceMap(strict = false) {
  try {
    const rows = await sql()`SELECT slug, maintenance FROM game_settings`;
    return new Map(rows.map((r) => [r.slug, r.maintenance]));
  } catch (e) {
    console.error('games-state error', e?.code || '', e?.message || '');
    if (strict) throw e;
    return new Map();
  }
}

export const noPackages = (g) => (g.packages || []).length === 0;

export async function getGames() {
  const m = await maintenanceMap();
  return games.map((g) => {
    if (noPackages(g)) return { ...g, maintenance: true };
    return m.has(g.slug) ? { ...g, maintenance: m.get(g.slug) } : g;
  });
}
