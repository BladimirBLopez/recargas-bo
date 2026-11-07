import { games } from '../../../../data/games.js';
import { sql } from '../../../../lib/db.js';
import { thumb } from '../../../../lib/cloudinary.js';
import { isAdmin } from '../../../../lib/admin.js';
import { allGames, imageMap, maintenanceMap, hiddenMap, packageMap, applyPackages, noPackages } from '../../../../lib/games-state.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  try {
    const m = await maintenanceMap(true);
    const hm = await hiddenMap();
    const pm = await packageMap();
    const list = await allGames();
    const im = await imageMap();
    return json({
      games: list.map((g) => ({
        slug: g.slug,
        name: g.name,
        kind: g.kind || null,
        emoji: g.emoji,
        image: im.has(g.slug) ? thumb(im.get(g.slug), 200) : null,
        canToggle: !noPackages(g),
        maintenance: noPackages(g) ? true : m.has(g.slug) ? m.get(g.slug) : Boolean(g.maintenance),
        hidden: hm.get(g.slug) === true,
        state: hm.get(g.slug) === true ? 'oculto' : (noPackages(g) ? true : m.has(g.slug) ? m.get(g.slug) : Boolean(g.maintenance)) ? 'mantenimiento' : 'publicado',
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
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const game = (await allGames()).find((g) => g.slug === body?.slug);
  const STATES = { publicado: [false, false], mantenimiento: [true, false], oculto: [true, true] };
  if (game && body?.state !== undefined) {
    if (typeof body.state !== 'string' || !Object.prototype.hasOwnProperty.call(STATES, body.state)) {
      return json({ error: 'datos_invalidos' }, 400);
    }
    if (body.state === 'publicado' && noPackages(game)) return json({ error: 'sin_paquetes' }, 400);
    const st = STATES[body.state];
    try {
      await sql()`INSERT INTO game_settings (slug, maintenance, hidden, updated_at)
        VALUES (${game.slug}, ${st[0]}, ${st[1]}, now())
        ON CONFLICT (slug) DO UPDATE
        SET maintenance = EXCLUDED.maintenance, hidden = EXCLUDED.hidden, updated_at = now()`;
      const p = await sql()`SELECT count(*)::int AS n FROM orders WHERE game_slug = ${game.slug} AND status = 'PENDIENTE'`;
      return json({ ok: true, state: body.state, pendientes: p[0]?.n || 0 });
    } catch (e) {
      console.error('juegos estado error', e?.code || '', e?.message || '');
      return json({ error: 'db' }, 500);
    }
  }
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
