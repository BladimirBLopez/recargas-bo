import crypto from 'node:crypto';
import { sql } from '../../../../../lib/db.js';
import { isAdmin } from '../../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function newCode() {
  return 'RB-' +
    crypto.randomBytes(5)
      .toString('hex')
      .slice(0, 7)
      .toUpperCase();
}

export async function POST(req) {
  if (!await isAdmin(req)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  // Bloqueado hasta tener otro medio de cobro.
  if (
    process.env.FF_MANUAL_PAYMENTS_READY !== 'true'
  ) {
    return json({
      error: 'cobro_manual_no_configurado',
    }, 409);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const id = String(body?.id ?? '').trim();

  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return json({ error: 'id_invalido' }, 400);
  }

  try {
    const q = sql();

    for (let i = 0; i < 5; i++) {
      const code = newCode();

      try {
        // Una sola sentencia SQL:
        // crea el pedido y vincula la solicitud.
        const rows = await q`
          WITH solicitud AS MATERIALIZED (
            SELECT
              r.id,
              r.player_id,
              r.nickname,
              r.user_id,
              r.discount_price_id,
              r.approved_price,
              p.label,
              p.cost
            FROM ff_discount_requests r
            JOIN ff_discount_prices p
              ON p.id = r.discount_price_id
            JOIN ff_discount_config cfg
              ON cfg.id = 1
            WHERE r.id = ${id}::bigint
              AND cfg.enabled = true
              AND p.active = true
              AND r.status = 'aprobado'
              AND r.decided_at IS NOT NULL
              AND r.order_id IS NULL
              AND r.expires_at > now()
              AND r.approved_price > 0
              AND NOT EXISTS (
                SELECT 1
                FROM orders o
                WHERE o.game_slug = 'free-fire'
                  AND o.player_id = r.player_id
                  AND o.discount = true
                  AND (
                    o.package_id =
                      r.discount_price_id
                    OR o.package_id =
                      p.base_package_id
                  )
                  AND o.status IN (
                    'PENDIENTE',
                    'PAGADO',
                    'ENTREGADO'
                  )
              )
            FOR UPDATE OF r
          ),
          creado AS (
            INSERT INTO orders (
              code,
              game_slug,
              package_id,
              package_label,
              price,
              player_id,
              nickname,
              user_id,
              discount,
              payment_mode,
              cost
            )
            SELECT
              ${code},
              'free-fire',
              discount_price_id,
              label,
              approved_price,
              player_id,
              nickname,
              user_id,
              true,
              'MANUAL',
              cost
            FROM solicitud
            RETURNING
              id, code, price, created_at
          ),
          vinculado AS (
            UPDATE ff_discount_requests r
            SET order_id = creado.id
            FROM creado
            WHERE r.id = ${id}::bigint
              AND r.order_id IS NULL
            RETURNING r.order_id
          )
          SELECT
            creado.id,
            creado.code,
            creado.price,
            creado.created_at
          FROM creado
          JOIN vinculado
            ON vinculado.order_id = creado.id`;

        if (!rows[0]) {
          return json({
            error: 'solicitud_no_disponible',
          }, 409);
        }

        return json({
          ok: true,
          orderId: rows[0].id,
          code: rows[0].code,
          price: Number(rows[0].price),
          paymentMode: 'MANUAL',
          paid: false,
        }, 201);

      } catch (e) {
        if (e?.code === '23505') {
          continue;
        }
        throw e;
      }
    }

    return json({
      error: 'codigo_repetido',
    }, 500);

  } catch (e) {
    console.error(
      'ff crear pedido error',
      e?.code || ''
    );

    return json({ error: 'db' }, 500);
  }
}
