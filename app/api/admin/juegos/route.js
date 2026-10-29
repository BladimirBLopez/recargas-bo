import { games } from '../../../../data/games.js';
import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';
import { allGames, maintenanceMap, packageMap, applyPackages, noPackages } from '../../../../lib/games-state.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  try {
    const m = await maintenanceMap(true);
    const pm = await packageMap();
    const list = await allGames();
    return json({
      games: list.map((g) => ({
        slug: g.slug,
        name: g.name,
        emoji: g.emoji,
        canToggle: !noPackages(g),
        maintenance: noPackages(g) ? true : m.has(g.slug) ? m.get(g.slug) : Boolean(g.maintenance),
        packages: applyPackages(g, pm, true).packages.map((p) => ({
          id: p.id,
          label: p.label,
          price: p.price,
          basePrice: p.basePrice,
          cost: p.cost,
          active: p.active,
        })),
      })),
    });
  } catch (e) {
    return json({ error: 'db' }, 500);
  }
}

export async function PATCH(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const game = (await allGames()).find((g) => g.slug === body?.slug);
  if (!game || typeof body?.maintenance !== 'boolean') return json({ error: 'datos_invalidos' }, 400);
  if (noPackages(game)) return json({ error: 'sin_paquetes' }, 400);
  try {
    await sql()`INSERT INTO game_settings (slug, maintenance, updated_at)
      VALUES (${game.slug}, ${body.maintenance}, now())
      ON CONFLICT (slug) DO UPDATE SET maintenance = EXCLUDED.maintenance, updated_at = now()`;
    return json({ ok: true });
  } catch (e) {
    console.error('juegos patch error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
