import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['PENDIENTE', 'PAGADO', 'ENTREGADO', 'CANCELADO', 'EXPIRADO'];
const NEXT = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENTREGADO', 'PENDIENTE'],
};

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const status = new URL(req.url).searchParams.get('status');
  try {
    const q = sql();
    const rows = STATUSES.includes(status)
      ? await q`SELECT id, code, game_slug, package_label, price, player_id, nickname, status, created_at, paid_at
          FROM orders WHERE status = ${status} ORDER BY id DESC LIMIT 100`
      : await q`SELECT id, code, game_slug, package_label, price, player_id, nickname, status, created_at, paid_at
          FROM orders ORDER BY id DESC LIMIT 100`;
    return json({ orders: rows });
  } catch (e) {
    console.error('admin list error', e?.code || '', e?.message || '');
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
  const id = body?.id;
  const to = body?.status;
  if (!Number.isInteger(id) || !STATUSES.includes(to)) return json({ error: 'datos_invalidos' }, 400);
  try {
    const q = sql();
    const cur = await q`SELECT status FROM orders WHERE id = ${id}`;
    if (!cur[0]) return json({ error: 'no_existe' }, 404);
    const from = cur[0].status;
    if (!(NEXT[from] || []).includes(to)) return json({ error: 'cambio_no_permitido' }, 409);
    let upd;
    if (to === 'PAGADO') {
      upd = await q`UPDATE orders SET status = ${to}, paid_at = now() WHERE id = ${id} AND status = ${from} RETURNING id, status, paid_at`;
    } else if (to === 'PENDIENTE') {
      upd = await q`UPDATE orders SET status = ${to}, paid_at = NULL WHERE id = ${id} AND status = ${from} RETURNING id, status, paid_at`;
    } else {
      upd = await q`UPDATE orders SET status = ${to} WHERE id = ${id} AND status = ${from} RETURNING id, status, paid_at`;
    }
    if (!upd[0]) return json({ error: 'cambio_concurrente' }, 409);
    return json({ ok: true, order: upd[0] });
  } catch (e) {
    console.error('admin patch error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
