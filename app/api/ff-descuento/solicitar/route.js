import crypto from 'node:crypto';
import { sql } from '../../../../lib/db.js';
import { limited } from '../../../../lib/ratelimit.js';
import { sendTelegram } from '../../../../lib/telegram.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req) {
  const ip = (
    req.headers.get('x-forwarded-for') || 'x'
  ).split(',')[0].trim();

  if (await limited('ffsol:' + ip, 5, 600)) {
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
    body?.playerId || ''
  ).trim();

  const priceId = String(
    body?.discountPriceId || ''
  ).trim();

  const nickname = String(
    body?.nickname || ''
  ).replace(/[\x00-\x1f\x7f]/g, ' ')
    .trim().slice(0, 60);

  if (!/^\d{8,12}$/.test(playerId)) {
    return json({ error: 'id_invalido' }, 400);
  }

  if (!/^ffd-[a-z0-9-]{1,40}$/.test(priceId)) {
    return json({ error: 'paquete_invalido' }, 400);
  }

  try {
    const q = sql();

    const configs = await q`
      SELECT enabled, open_hour, close_hour,
             timezone, valid_hours
      FROM ff_discount_config
      WHERE id = 1`;

    const cfg = configs[0];

    if (!cfg?.enabled) {
      return json({
        error: 'promocion_inactiva',
      }, 409);
    }

    const packs = await q`
      SELECT id, label, price, base_package_id
      FROM ff_discount_prices
      WHERE id = ${priceId}
        AND active = true`;

    const pack = packs[0];
    const price = Number(pack?.price);

    if (
      !pack ||
      !Number.isFinite(price) ||
      price > 9999999999.99 ||
      Math.abs(
        price * 100 - Math.round(price * 100)
      ) > 0.00001 ||
      price <= 0
    ) {
      return json({
        error: 'paquete_no_disponible',
      }, 409);
    }

    // Liberar solicitudes vencidas sin pedido.
    await q`
      UPDATE ff_discount_requests
      SET status = 'vencida'
      WHERE player_id = ${playerId}
        AND discount_price_id = ${priceId}
        AND order_id IS NULL
        AND expires_at <= now()
        AND (
          status IN ('pendiente', 'aprobado')
          OR (
            status = 'rechazado'
            AND decided_at IS NULL
          )
        )`;

    const used = await q`
      SELECT 1 FROM orders
      WHERE game_slug = 'free-fire'
        AND player_id = ${playerId}
        AND discount = true
        AND (
          package_id = ${priceId}
          OR package_id =
            ${pack.base_package_id}
        )
        AND status IN (
          'PENDIENTE',
          'PAGADO',
          'ENTREGADO'
        )
      LIMIT 1`;

    if (used.length) {
      return json({
        error: 'beneficio_no_disponible',
      }, 409);
    }

    const existing = await q`
      SELECT 1 FROM ff_discount_requests
      WHERE player_id = ${playerId}
        AND discount_price_id = ${priceId}
        AND status IN ('pendiente', 'aprobado')
      LIMIT 1`;

    if (existing.length) {
      return json({
        error: 'solicitud_existente',
      }, 409);
    }

    const token = crypto.randomBytes(32)
      .toString('hex');

    const hash = crypto.createHash('sha256')
      .update(token).digest('hex');

    const hours = Number(cfg.valid_hours);

    if (
      !Number.isInteger(hours) ||
      hours < 1 || hours > 720
    ) {
      return json({
        error: 'config_invalida',
      }, 500);
    }

    const rows = await q`
      INSERT INTO ff_discount_requests (
        player_id, nickname,
        discount_price_id,
        tracking_token_hash,
        expires_at
      )
      VALUES (
        ${playerId},
        ${nickname || null},
        ${priceId},
        ${hash},
        now() + (
          ${hours}::int * interval '1 hour'
        )
      )
      RETURNING id, expires_at`;

    const solicitud = rows[0];

    const hora = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: cfg.timezone,
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(new Date())
    );

    const fueraHorario =
      hora < cfg.open_hour ||
      hora >= cfg.close_hour;

    const aviso = [
      '🎁 Solicitud Free Fire #' + solicitud.id,
      'ID: ' + playerId,
      'Nombre indicado: ' + (nickname || 'Sin verificar'),
      'Paquete: ' + pack.label,
      'Precio: Bs ' + price.toFixed(2),
      fueraHorario
        ? 'Fuera de horario de atencion'
        : 'Dentro del horario',
      'Revisar en el panel administrativo.',
    ].join('\n');

    const sent = await sendTelegram(aviso);

    return json({
      ok: true,
      requestId: String(solicitud.id),
      trackingToken: token,
      expiresAt: solicitud.expires_at,
      fueraHorario,
      notified: sent.ok,
    }, 201);

  } catch (e) {
    if (e?.code === '23505') {
      return json({
        error: 'solicitud_existente',
      }, 409);
    }

    console.error(
      'ff solicitud error',
      e?.code || ''
    );

    return json({ error: 'servidor' }, 500);
  }
}
