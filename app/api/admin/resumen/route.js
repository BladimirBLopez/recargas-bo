import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';
import { allGames } from '../../../../lib/games-state.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  try {
    const q = sql();
    const [cnt, hoy, mes, dias, top, pend, rec, list] = await Promise.all([
      q`SELECT status, count(*)::int AS n FROM orders GROUP BY status`,
      q`SELECT coalesce(sum(price),0) AS total, count(*)::int AS n FROM orders
          WHERE status IN ('PAGADO','ENTREGADO')
          AND (coalesce(paid_at, created_at) - interval '4 hours')::date = (now() - interval '4 hours')::date`,
      q`SELECT coalesce(sum(price),0) AS total, count(*)::int AS n FROM orders
          WHERE status IN ('PAGADO','ENTREGADO')
          AND date_trunc('month', coalesce(paid_at, created_at) - interval '4 hours') = date_trunc('month', now() - interval '4 hours')`,
      q`SELECT to_char(d::date, 'YYYY-MM-DD') AS day, coalesce(sum(o.price),0) AS total, count(o.id)::int AS n
          FROM generate_series((now() - interval '4 hours')::date - 6, (now() - interval '4 hours')::date, interval '1 day') AS d
          LEFT JOIN orders o ON o.status IN ('PAGADO','ENTREGADO')
            AND (coalesce(o.paid_at, o.created_at) - interval '4 hours')::date = d::date
          GROUP BY d ORDER BY d`,
      q`SELECT game_slug, count(*)::int AS n, coalesce(sum(price),0) AS total FROM orders
          WHERE status IN ('PAGADO','ENTREGADO') AND coalesce(paid_at, created_at) > now() - interval '30 days'
          GROUP BY game_slug ORDER BY total DESC LIMIT 5`,
      q`SELECT id, code, game_slug, package_label, price, created_at FROM orders
          WHERE status = 'PENDIENTE' ORDER BY id ASC LIMIT 5`,
      q`SELECT id, code, game_slug, package_label, price, status, created_at FROM orders
          ORDER BY id DESC LIMIT 6`,
      allGames(),
    ]);
    const counts = { PENDIENTE: 0, PAGADO: 0, ENTREGADO: 0, CANCELADO: 0, EXPIRADO: 0, todos: 0 };
    cnt.forEach((r) => {
      counts[r.status] = r.n;
      counts.todos += r.n;
    });

    let ganancia = { hoy: null, mes: null };
    try {
      const g = await q`SELECT
          coalesce(sum(price - cost) FILTER (WHERE (coalesce(paid_at, created_at) - interval '4 hours')::date = (now() - interval '4 hours')::date), 0) AS hoy,
          coalesce(sum(price - cost) FILTER (WHERE date_trunc('month', coalesce(paid_at, created_at) - interval '4 hours') = date_trunc('month', now() - interval '4 hours')), 0) AS mes
        FROM orders WHERE status IN ('PAGADO','ENTREGADO') AND cost IS NOT NULL`;
      ganancia = { hoy: Number(g[0].hoy), mes: Number(g[0].mes) };
    } catch (e) {
      console.error('resumen ganancia error', e?.code || '', e?.message || '');
    }

    return json({
      counts,
      hoy: { total: Number(hoy[0]?.total || 0), n: hoy[0]?.n || 0 },
      mes: { total: Number(mes[0]?.total || 0), n: mes[0]?.n || 0 },
      ganancia,
      dias: dias.map((r) => ({ day: r.day, total: Number(r.total), n: r.n })),
      top: top.map((r) => ({ game_slug: r.game_slug, n: r.n, total: Number(r.total) })),
      pendientes: pend,
      recientes: rec,
      names: Object.fromEntries(list.map((g) => [g.slug, g.name])),
    });
  } catch (e) {
    console.error('admin resumen error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
