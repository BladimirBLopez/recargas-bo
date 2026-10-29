import { games } from '../data/games.js';
import { sql } from './db.js';

const thumbUrl = (u, w) => String(u).replace('/upload/', '/upload/f_auto,q_auto,w_' + w + '/');

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

// Precio, costo y activo por paquete (tabla package_settings). Si falla, se usa data/games.js.
export async function packageMap() {
  try {
    const rows = await sql()`SELECT package_id, price, cost, active FROM package_settings`;
    return new Map(
      rows.map((r) => [
        r.package_id,
        {
          price: r.price === null ? null : Number(r.price),
          cost: r.cost === null ? null : Number(r.cost),
          active: r.active !== false,
        },
      ])
    );
  } catch (e) {
    console.error('package-settings error', e?.code || '', e?.message || '');
    return new Map();
  }
}

// Servicios creados desde /admin/servicios (tabla custom_games).
export async function customGames() {
  try {
    const rows = await sql()`SELECT slug, name, kind, id_label, badge, popular, packages
      FROM custom_games ORDER BY created_at, slug`;
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      kind: r.kind,
      popular: r.popular,
      badge: r.badge || undefined,
      emoji: '🎮',
      color: 'from-orange-500 to-red-600',
      idLabel: r.id_label,
      custom: true,
      packages: Array.isArray(r.packages) ? r.packages : [],
    }));
  } catch (e) {
    console.error('custom-games error', e?.code || '', e?.message || '');
    return [];
  }
}

// Fotos subidas a Cloudinary (tabla game_images).
export async function imageMap() {
  try {
    const rows = await sql()`SELECT slug, url FROM game_images`;
    return new Map(rows.map((r) => [r.slug, r.url]));
  } catch (e) {
    console.error('game-images error', e?.code || '', e?.message || '');
    return new Map();
  }
}

// Catalogo completo: data/games.js + servicios de Neon.
export async function allGames() {
  const custom = await customGames();
  const slugs = new Set(games.map((g) => g.slug));
  return [...games, ...custom.filter((g) => !slugs.has(g.slug))];
}

export const noPackages = (g) => (g.packages || []).length === 0;

// admin=false: version publica (sin costo, sin paquetes pausados).
// admin=true: todo, con costo y precio base (solo para servidor y panel).
export function applyPackages(g, pm, admin = false) {
  const list = (g.packages || []).map((p) => {
    const o = pm.get(p.id);
    const price = o && o.price !== null ? o.price : p.price;
    const active = o ? o.active : true;
    if (admin) return { ...p, price, basePrice: p.price, cost: o ? o.cost : null, active };
    return { ...p, price, active };
  });
  return { ...g, packages: admin ? list : list.filter((p) => p.active).map(({ active, ...rest }) => rest) };
}

export async function getGames() {
  const [list, m, pm, im] = await Promise.all([allGames(), maintenanceMap(), packageMap(), imageMap()]);
  return list.map((g) => {
    let x = applyPackages(g, pm, false);
    if (im.has(g.slug)) x = { ...x, image: thumbUrl(im.get(g.slug), 600) };
    if (noPackages(x)) return { ...x, maintenance: true };
    return m.has(g.slug) ? { ...x, maintenance: m.get(g.slug) } : x;
  });
}
