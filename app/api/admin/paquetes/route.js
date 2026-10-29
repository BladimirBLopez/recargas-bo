import { allGames } from '../../../../lib/games-state.js';
import { games } from '../../../../data/games.js';
import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function num(v, min, max) {
  if (v === null || v === undefined || v === '') return { ok: true, v: null };
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return { ok: false };
  return { ok: true, v: Math.round(n * 100) / 100 };
}

export async function PATCH(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
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
