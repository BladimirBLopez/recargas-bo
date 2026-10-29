import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';
import { allGames } from '../../../../lib/games-state.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['PENDIENTE', 'PAGADO', 'ENTREGADO', 'CANCELADO', 'EXPIRADO'];
const NEXT = {
  PENDIENTE: ['PAGADO', 'CANCELADO'],
  PAGADO: ['ENTREGADO', 'PENDIENTE'],
  CANCELADO: ['PENDIENTE'],
  EXPIRADO: ['PENDIENTE'],
};

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

// CSV: evita que Excel ejecute fórmulas escritas en el nickname
function cell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
const bo = (d) => (d ? new Date(new Date(d).getTime() - 4 * 3600 * 1000).toISOString().slice(0, 16).replace('T', ' ') : '');

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const sp = new URL(req.url).searchParams;
  const st = sp.get('status');
  const status = STATUSES.includes(st) ? st : null;
  const closed = st === 'cerrados';
  const csv = sp.get('format') === 'csv';
  const g = sp.get('game') || '';
  const game = /^[a-z0-9-]{1,60}$/.test(g) ? g : null;
  const f = sp.get('from') || '';
  const t = sp.get('to') || '';
  const from = /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null;
  const to = /^\d{4}-\d{2}-\d{2}$/.test(t) ? t : null;
  const term = (sp.get('q') || '').trim().slice(0, 40).replace(/[\\%_]/g, (m) => '\\' + m);
  const pat = term ? '%' + term + '%' : null;
  const limit = csv ? 5000 : Math.min(200, Math.max(1, parseInt(sp.get('limit'), 10) || 30));
  try {
    const q = sql();
    const [rows, agg, games] = await Promise.all([
      q`SELECT id, code, game_slug, package_label, price, player_id, nickname, status, created_at, paid_at
          FROM orders
          WHERE (${status}::text IS NULL OR status = ${status}::text)
            AND (${closed}::boolean IS NOT TRUE OR status IN ('CANCELADO','EXPIRADO'))
            AND (${game}::text IS NULL OR game_slug = ${game}::text)
            AND (${from}::date IS NULL OR (created_at - interval '4 hours')::date >= ${from}::date)
            AND (${to}::date IS NULL OR (created_at - interval '4 hours')::date <= ${to}::date)
            AND (${pat}::text IS NULL OR code ILIKE ${pat}::text OR player_id ILIKE ${pat}::text OR coalesce(nickname,'') ILIKE ${pat}::text)
          ORDER BY id DESC LIMIT ${limit + 1}`,
      q`SELECT count(*)::int AS n,
               coalesce(sum(price) FILTER (WHERE status IN ('PAGADO','ENTREGADO')),0) AS vendido
          FROM orders
          WHERE (${status}::text IS NULL OR status = ${status}::text)
            AND (${closed}::boolean IS NOT TRUE OR status IN ('CANCELADO','EXPIRADO'))
            AND (${game}::text IS NULL OR game_slug = ${game}::text)
            AND (${from}::date IS NULL OR (created_at - interval '4 hours')::date >= ${from}::date)
            AND (${to}::date IS NULL OR (created_at - interval '4 hours')::date <= ${to}::date)
            AND (${pat}::text IS NULL OR code ILIKE ${pat}::text OR player_id ILIKE ${pat}::text OR coalesce(nickname,'') ILIKE ${pat}::text)`,
      q`SELECT DISTINCT game_slug FROM orders ORDER BY game_slug`,
    ]);

    if (csv) {
      const names = new Map((await allGames()).map((x) => [x.slug, x.name]));
      const head = ['Código', 'Fecha (Bolivia)', 'Juego', 'Paquete', 'Precio Bs', 'ID jugador', 'Usuario', 'Estado', 'Pagado (Bolivia)'];
      const lines = [head.map(cell).join(',')];
      for (const o of rows.slice(0, limit)) {
        lines.push(
          [
            cell(o.code),
            cell(bo(o.created_at)),
            cell(names.get(o.game_slug) || o.game_slug),
            cell(o.package_label),
            Number(o.price),
            cell(o.player_id),
            cell(o.nickname || ''),
            cell(o.status),
            cell(bo(o.paid_at)),
          ].join(',')
        );
      }
      const day = bo(Date.now()).slice(0, 10);
      return new Response('\ufeff' + lines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="pedidos-' + day + '.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    return json({
      orders: rows.slice(0, limit),
      more: rows.length > limit,
      total: agg[0]?.n || 0,
      vendido: Number(agg[0]?.vendido || 0),
      games: games.map((r) => r.game_slug),
    });
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
