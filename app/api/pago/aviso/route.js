import crypto from 'crypto';
import { sql } from '../../../../lib/db.js';
import { limited } from '../../../../lib/ratelimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function okSecret(got) {
  const real = process.env.PAGO_SECRET || '';
  if (real.length < 16) return false;
  const a = Buffer.from(String(got || ''));
  const b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function telegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
    });
  } catch (e) {
    console.error('telegram fetch error');
  }
}

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('pago:' + ip, 60)) return json({ error: 'limite' }, 429);
  if (!okSecret(req.headers.get('x-pago-secret'))) return json({ error: 'no_autorizado' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const msgId = typeof body?.msgId === 'string' ? body.msgId.trim().slice(0, 120) : '';
  const amount = Math.round(Number(body?.amount) * 100) / 100;
  const when = new Date(body?.paidAt);
  if (!msgId || !(amount > 0 && amount < 100000) || isNaN(when.getTime()) || when.getTime() > Date.now() + 5 * 60 * 1000) {
    return json({ error: 'datos_invalidos' }, 400);
  }
  const paidAt = when.toISOString();
  const origin = new URL(req.url).origin;

  const q = sql();
  try {
    const ins = await q`INSERT INTO pagos_recibidos (msg_id, amount, status)
      VALUES (${msgId}, ${amount}, 'procesando') ON CONFLICT (msg_id) DO NOTHING RETURNING msg_id`;
    if (!ins[0]) return json({ ok: true, dup: true });

    // Solo pendientes con el precio exacto creados en los ultimos 90 min antes del pago.
    const cands = await q`SELECT id, code FROM orders
      WHERE status = 'PENDIENTE' AND price = ${amount}::numeric
        AND payment_mode = 'AUTOMATICO'
        AND created_at <= ${paidAt}::timestamptz + interval '1 minute'
        AND created_at > ${paidAt}::timestamptz - interval '90 minutes'
      ORDER BY id`;

    if (cands.length === 1) {
      const o = cands[0];
      const upd = await q`UPDATE orders SET status = 'PAGADO', paid_at = now()
        WHERE id = ${o.id} AND status = 'PENDIENTE'
          AND payment_mode = 'AUTOMATICO' RETURNING id`;
      if (upd[0]) {
        await q`UPDATE pagos_recibidos SET status = 'confirmado', order_code = ${o.code} WHERE msg_id = ${msgId}`;
        await telegram('✅ Pago automático Bs ' + amount + ' · ' + o.code + ' pasó a PAGADO\nPanel: ' + origin + '/admin');
        return json({ ok: true, confirmed: o.code });
      }
    }

    const state = cands.length > 1 ? 'varios' : 'sin_pedido';
    let msg;
    if (cands.length > 1) {
      msg = '⚠️ Llegó un pago de Bs ' + amount + ' y hay ' + cands.length + ' pedidos pendientes con ese monto: ' + cands.map((c) => c.code).join(', ') + '. Elige el correcto en Pagos.';
    } else {
      msg = '⚠️ Llegó un pago de Bs ' + amount + ' y no hay pedido pendiente con ese monto.';
      const dup = await q`SELECT code FROM orders
        WHERE status IN ('PAGADO','ENTREGADO') AND price = ${amount}::numeric
          AND payment_mode = 'AUTOMATICO'
          AND paid_at > ${paidAt}::timestamptz - interval '3 hours'
        ORDER BY id DESC LIMIT 1`;
      if (dup[0]) msg += ' Posible pago repetido: ' + dup[0].code + ' ya estaba pagado.';
      msg += ' Revísalo en Pagos.';
    }
    await q`UPDATE pagos_recibidos SET status = ${state} WHERE msg_id = ${msgId}`;
    await telegram(msg + '\nPagos: ' + origin + '/admin/pagos');
    return json({ ok: true, confirmed: null, state });
  } catch (e) {
    console.error('pago aviso error', e?.code || '', e?.message || '');
    try {
      await q`DELETE FROM pagos_recibidos WHERE msg_id = ${msgId} AND status = 'procesando'`;
    } catch (e2) {}
    return json({ error: 'db' }, 500);
  }
}
