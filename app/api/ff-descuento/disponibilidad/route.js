import { sql } from '../../../../lib/db.js';
import { limited } from '../../../../lib/ratelimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export async function POST(req) {
  const ip = (
    req.headers.get('x-forwarded-for') || 'x'
  ).split(',')[0].trim();

  if (await limited('ffdisp:' + ip, 15, 60)) {
    return json({ error: 'limite' }, 429);
  }

  if (Number(req.headers.get('content-length')) > 4096) {
    return json({ error: 'datos_invalidos' }, 413);
  }

  let body;

  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const playerId = String(
    body?.playerId ?? ''
  ).trim();

  if (!/^\d{8,12}$/.test(playerId)) {
    return json({ error: 'id_invalido' }, 400);
  }

  try {
    const q = sql();

    const config = await q`
      SELECT enabled
      FROM ff_discount_config
      WHERE id = 1`;

    if (config[0]?.enabled !== true) {
      return json({
        enabled: false,
        packages: [],
      });
    }

    const rows = await q`
      SELECT
        p.id,
        p.label,
        p.price,
        (
          NOT EXISTS (
            SELECT 1
            FROM ff_discount_requests r
            WHERE r.player_id = ${playerId}
              AND r.discount_price_id = p.id
              AND r.status IN (
                'pendiente',
                'aprobado'
              )
              AND (
                r.order_id IS NOT NULL
                OR r.expires_at IS NULL
                OR r.expires_at > now()
              )
          )
          AND NOT EXISTS (
            SELECT 1
            FROM orders o
            WHERE o.game_slug = 'free-fire'
              AND o.player_id = ${playerId}
              AND o.discount = true
              AND (
                o.package_id = p.id
                OR o.package_id = p.base_package_id
              )
              AND o.status IN (
                'PENDIENTE',
                'PAGADO',
                'ENTREGADO'
              )
          )
        ) AS eligible
      FROM ff_discount_prices p
      WHERE p.active = true
        AND p.price >= 0.01
        AND p.price <= 9999999999.99
        AND p.price = round(p.price, 2)
      ORDER BY p.sort, p.id`;

    return json({
      enabled: true,
      packages: rows.map((p) => ({
        id: p.id,
        label: p.label,
        price: Number(p.price),
        eligible: p.eligible === true,
      })),
    });

  } catch (e) {
    console.error(
      'ff disponibilidad error',
      e?.code || ''
    );

    return json({
      error: 'servidor',
    }, 500);
  }
}
