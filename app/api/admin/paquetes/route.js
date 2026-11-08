import { allGames } from '../../../../lib/games-state.js';
import { games } from '../../../../data/games.js';
import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PER_GAME = 30;

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function num(v, min, max) {
  if (v === null || v === undefined || v === '') return { ok: true, v: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return { ok: false };
  return { ok: true, v: Math.round(n * 100) / 100 };
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

// Crear un paquete propio en un juego base.
export async function POST(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  if (!body) return json({ error: 'json_invalido' }, 400);
  const slug = String(body.slug || '');
  if (!games.some((g) => g.slug === slug)) return json({ error: 'juego_invalido' }, 400);
  const label = String(body.label || '').trim().slice(0, 40);
  const price = num(body.price, 0.01, 100000);
  if (!label || !price.ok || price.v === null) return json({ error: 'datos_invalidos' }, 400);
  try {
    const q = sql();
    const game = (await allGames()).find((g) => g.slug === slug);
    const current = game?.packages || [];
    if (current.length >= MAX_PER_GAME) return json({ error: 'demasiados' }, 400);
    if (current.some((p) => String(p.label).trim().toLowerCase() === label.toLowerCase())) {
      return json({ error: 'existe' }, 409);
    }
    for (let i = 0; i < 3; i++) {
      const id = 'cp-' + Math.random().toString(36).slice(2, 10);
      try {
        await q`INSERT INTO custom_packages (id, game_slug, label, price, sort)
          VALUES (${id}, ${slug}, ${label}, ${price.v},
            (SELECT COALESCE(MAX(sort), 0) + 1 FROM custom_packages WHERE game_slug = ${slug}))`;
        return json({ ok: true, id });
      } catch (e) {
        if (e?.code !== '23505') throw e;
      }
    }
    return json({ error: 'id_repetido' }, 500);
  } catch (e) {
    console.error('paquetes post error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function PATCH(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  if (!body) return json({ error: 'json_invalido' }, 400);
  const ids = new Set((await allGames()).flatMap((g) => (g.packages || []).map((p) => p.id)));
  const id = String(body?.id || '');
  if (!ids.has(id)) return json({ error: 'paquete_invalido' }, 400);
  try {
    const q = sql();
    if (body?.reset === true) {
      await q`DELETE FROM package_settings WHERE package_id = ${id}`;
      return json({ ok: true });
    }
    const price = num(body?.price, 0.01, 100000);
    const cost = num(body?.cost, 0, 100000);
    if (!price.ok || !cost.ok || typeof body?.active !== 'boolean') return json({ error: 'datos_invalidos' }, 400);
    if (body?.label !== undefined) {
      const lab = String(body.label).trim().slice(0, 40);
      if (!lab) return json({ error: 'datos_invalidos' }, 400);
      const r = await q`UPDATE custom_packages SET label = ${lab} WHERE id = ${id} RETURNING id`;
      if (!r.length) return json({ error: 'no_editable' }, 400);
    }
    await q`INSERT INTO package_settings (package_id, price, cost, active, updated_at)
      VALUES (${id}, ${price.v}, ${cost.v}, ${body.active}, now())
      ON CONFLICT (package_id) DO UPDATE
      SET price = EXCLUDED.price, cost = EXCLUDED.cost, active = EXCLUDED.active, updated_at = now()`;
    return json({ ok: true });
  } catch (e) {
    console.error('paquetes patch error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

// Borrar un paquete propio (los del catalogo base no se pueden borrar, solo pausar).
export async function DELETE(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  const id = String(body?.id || '');
  if (!/^cp-[a-z0-9]{1,16}$/.test(id)) return json({ error: 'no_editable' }, 400);
  try {
    const q = sql();
    const r = await q`DELETE FROM custom_packages WHERE id = ${id} RETURNING id`;
    if (!r.length) return json({ error: 'no_editable' }, 400);
    try {
      await q`DELETE FROM package_settings WHERE package_id = ${id}`;
    } catch (e) {}
    const p = await q`SELECT count(*)::int AS n FROM orders WHERE package_id = ${id} AND status = 'PENDIENTE'`;
    return json({ ok: true, pendientes: p[0]?.n || 0 });
  } catch (e) {
    console.error('paquetes delete error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
