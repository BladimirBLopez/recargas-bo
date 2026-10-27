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
  const [m, pm] = await Promise.all([maintenanceMap(), packageMap()]);
  return games.map((g) => {
    const x = applyPackages(g, pm, false);
    if (noPackages(x)) return { ...x, maintenance: true };
    return m.has(g.slug) ? { ...x, maintenance: m.get(g.slug) } : x;
  });
}
