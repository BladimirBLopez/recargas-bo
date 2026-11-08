import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';

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

export async function GET(req) {
  if (!await isAdmin(req)) {
    return json({
      error: 'no_autorizado',
    }, 401);
  }

  try {
    const q = sql();

    const rows = await q`
      SELECT
        r.id::text AS id,
        r.player_id,
        r.nickname,
        r.user_id,
        r.status,
        r.created_at,
        r.decided_at,
        r.expires_at,
        r.order_id,
        o.code AS order_code,
        o.status AS order_status,
        o.payment_mode AS order_payment_mode,
        r.approved_price,
        r.discount_price_id,
        p.label AS package_label,
        p.price,
        p.active AS package_active,
        CASE
          WHEN r.status = 'vencida'
            OR (
              r.order_id IS NULL
              AND r.expires_at <= now()
              AND (
                r.status IN (
                  'pendiente',
                  'aprobado'
                )
                OR (
                  r.status = 'rechazado'
                  AND r.decided_at IS NULL
                )
              )
            )
          THEN 'vencida'
          ELSE r.status
        END AS estado_visible
      FROM ff_discount_requests r
      LEFT JOIN ff_discount_prices p
        ON p.id = r.discount_price_id
      LEFT JOIN orders o
        ON o.id = r.order_id
      ORDER BY r.created_at DESC
      LIMIT 50`;

    const counts = await q`
      SELECT
        count(*)::int AS total,
        count(*) FILTER (
          WHERE status = 'pendiente'
            AND (
              expires_at IS NULL
              OR expires_at > now()
            )
        )::int AS pendientes,
        count(*) FILTER (
          WHERE status = 'vencida'
            OR (
              order_id IS NULL
              AND expires_at <= now()
              AND (
                status IN (
                  'pendiente',
                  'aprobado'
                )
                OR (
                  status = 'rechazado'
                  AND decided_at IS NULL
                )
              )
            )
        )::int AS vencidas,
        count(*) FILTER (
          WHERE status = 'aprobado'
            AND (
              order_id IS NOT NULL
              OR expires_at IS NULL
              OR expires_at > now()
            )
        )::int AS aprobadas,
        count(*) FILTER (
          WHERE status = 'rechazado'
            AND decided_at IS NOT NULL
        )::int AS rechazadas
      FROM ff_discount_requests`;

    const configs = await q`
      SELECT
        enabled,
        open_hour,
        close_hour,
        timezone,
        valid_hours
      FROM ff_discount_config
      WHERE id = 1`;

    return json({
      ok: true,
      requests: rows.map((r) => ({
        ...r,
        price: r.price === null
          ? null
          : Number(r.price),
        approved_price: r.approved_price === null
          ? null
          : Number(r.approved_price),
      })),
      counts: counts[0],
      config: configs[0]
        ? {
            ...configs[0],
            manualPaymentsReady:
              process.env.FF_MANUAL_PAYMENTS_READY === 'true',
          }
        : null,
    });

  } catch (e) {
    console.error(
      'admin ff descuento error',
      e?.code || ''
    );

    return json({
      error: 'db',
    }, 500);
  }
}

export async function PATCH(req) {
  if (!await isAdmin(req)) {
    return json({
      error: 'no_autorizado',
    }, 401);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({
      error: 'json_invalido',
    }, 400);
  }

  const id = String(body?.id ?? '').trim();
  const action = body?.action;

  if (
    !/^[1-9]\d{0,17}$/.test(id) ||
    !['aprobar', 'rechazar'].includes(action)
  ) {
    return json({
      error: 'datos_invalidos',
    }, 400);
  }

  const status = action === 'aprobar'
    ? 'aprobado'
    : 'rechazado';

  try {
    const q = sql();

    const rows = await q`
      UPDATE ff_discount_requests AS r
      SET
        status = ${status},
        decided_at = now(),
        approved_price = CASE
          WHEN ${status}::text = 'aprobado'
          THEN (
            SELECT p.price
            FROM ff_discount_prices p
            WHERE p.id = r.discount_price_id
          )
          ELSE NULL
        END
      WHERE r.id = ${id}::bigint
        AND r.status = 'pendiente'
        AND r.expires_at > now()
        AND r.order_id IS NULL
        AND (
          ${status}::text = 'rechazado'
          OR (
            EXISTS (
              SELECT 1
              FROM ff_discount_config c
              WHERE c.id = 1
                AND c.enabled = true
            )
            AND EXISTS (
              SELECT 1
              FROM ff_discount_prices p
              WHERE p.id = r.discount_price_id
                AND p.active = true
                AND p.price >= 0.01
                AND p.price <= 9999999999.99
                AND p.price = round(p.price, 2)
            )
            AND NOT EXISTS (
              SELECT 1
              FROM orders o
              JOIN ff_discount_prices p
                ON p.id = r.discount_price_id
              WHERE o.game_slug = 'free-fire'
                AND o.player_id = r.player_id
                AND o.discount = true
                AND (
                  o.package_id = p.id
                  OR o.package_id =
                    p.base_package_id
                )
                AND o.status IN (
                  'PENDIENTE',
                  'PAGADO',
                  'ENTREGADO'
                )
            )
          )
        )
      RETURNING
        r.id::text AS id,
        r.status,
        r.decided_at,
        r.expires_at,
        r.approved_price,
        r.order_id`;

    if (!rows[0]) {
      return json({
        error: 'solicitud_no_disponible',
      }, 409);
    }

    return json({
      ok: true,
      request: rows[0],
    });

  } catch (e) {
    console.error(
      'admin ff decision error',
      e?.code || ''
    );

    return json({
      error: 'db',
    }, 500);
  }
}
