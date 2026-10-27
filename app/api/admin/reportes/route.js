import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function addDays(s, n) {
  const d = new Date(s + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function cell(v) {
  let s = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const sp = new URL(req.url).searchParams;
  const today = new Date(Date.now() - 4 * 3600 * 1000).toISOString().slice(0, 10);
  let from = /^\d{4}-\d{2}-\d{2}$/.test(sp.get('from') || '') ? sp.get('from') : addDays(today, -29);
  let to = /^\d{4}-\d{2}-\d{2}$/.test(sp.get('to') || '') ? sp.get('to') : today;
  if (from > to) [from, to] = [to, from];
  if (addDays(from, 366) < to) from = addDays(to, -365);
  const g = sp.get('game') || '';
  const game = /^[a-z0-9-]{1,60}$/.test(g) ? g : null;
  const csv = sp.get('format') === 'csv';

  try {
    const q = sql();

    if (csv) {
      const rows = await q`SELECT code,
          to_char(created_at - interval '4 hours', 'YYYY-MM-DD HH24:MI') AS creado,
          to_char(paid_at - interval '4 hours', 'YYYY-MM-DD HH24:MI') AS pagado,
          game_slug, package_label, price, player_id, nickname, status
        FROM orders
        WHERE (created_at - interval '4 hours')::date BETWEEN ${from}::date AND ${to}::date
          AND (${game}::text IS NULL OR game_slug = ${game}::text)
        ORDER BY id DESC LIMIT 5000`;
      const head = ['Codigo', 'Creado (hora Bolivia)', 'Pagado (hora Bolivia)', 'Juego', 'Paquete', 'Precio Bs', 'ID jugador', 'Nickname', 'Estado'];
      const lines = [head.join(';')];
      rows.forEach((r) =>
        lines.push(
          [r.code, r.creado, r.pagado, r.game_slug, r.package_label, Number(r.price), r.player_id, r.nickname, r.status]
            .map(cell)
            .join(';')
        )
      );
      return new Response('\uFEFF' + lines.join('\r\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="pedidos-' + from + '_' + to + '.csv"',
          'Cache-Control': 'no-store',
        },
      });
    }

    const [dias, juegos, estados, games] = await Promise.all([
      q`SELECT to_char(d::date, 'YYYY-MM-DD') AS day, coalesce(sum(o.price),0) AS total, count(o.id)::int AS n
          FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
          LEFT JOIN orders o ON o.status IN ('PAGADO','ENTREGADO')
            AND (coalesce(o.paid_at, o.created_at) - interval '4 hours')::date = d::date
            AND (${game}::text IS NULL OR o.game_slug = ${game}::text)
          GROUP BY d ORDER BY d`,
      q`SELECT game_slug, count(*)::int AS n, coalesce(sum(price),0) AS total FROM orders
          WHERE status IN ('PAGADO','ENTREGADO')
            AND (coalesce(paid_at, created_at) - interval '4 hours')::date BETWEEN ${from}::date AND ${to}::date
            AND (${game}::text IS NULL OR game_slug = ${game}::text)
          GROUP BY game_slug ORDER BY total DESC LIMIT 10`,
      q`SELECT status, count(*)::int AS n FROM orders
          WHERE (created_at - interval '4 hours')::date BETWEEN ${from}::date AND ${to}::date
            AND (${game}::text IS NULL OR game_slug = ${game}::text)
          GROUP BY status`,
      q`SELECT DISTINCT game_slug FROM orders ORDER BY game_slug`,
    ]);

    const series = dias.map((r) => ({ day: r.day, total: Number(r.total), n: r.n }));
    const total = series.reduce((a, d) => a + d.total, 0);
    const n = series.reduce((a, d) => a + d.n, 0);
    const est = {};
    estados.forEach((r) => (est[r.status] = r.n));
    return json({
      from,
      to,
      total,
      n,
      ticket: n ? total / n : 0,
      dias: series,
      juegos: juegos.map((r) => ({ game_slug: r.game_slug, n: r.n, total: Number(r.total) })),
      estados: est,
      games: games.map((r) => r.game_slug),
    });
  } catch (e) {
    console.error('admin reportes error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
