import crypto from 'crypto';
import { sql } from '../../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
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
    console.error('co webhook telegram error');
  }
}

function firmaOk(secret, ts, raw, header) {
  if (!secret || secret.length < 16 || !header) return false;
  const esperada = 'sha256=' + crypto.createHmac('sha256', secret).update(ts + '.' + raw).digest('hex');
  const a = Buffer.from(esperada);
  const b = Buffer.from(String(header));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req) {
  const raw = await req.text();
  const ts = req.headers.get('x-centralone-timestamp') || '';
  const edad = Math.abs(Date.now() / 1000 - Number(ts));
  if (!(edad <= 300)) return json({ error: 'timestamp' }, 400);
  if (!firmaOk(process.env.CO_WEBHOOK_SECRET || '', ts, raw, req.headers.get('x-centralone-signature'))) {
    return json({ error: 'firma' }, 401);
  }

  let ev;
  try {
    ev = JSON.parse(raw);
  } catch {
    return json({ error: 'json' }, 400);
  }
  const name = String(ev?.event || '');
  if (name === 'webhook.test') {
    await telegram('✅ Webhook de Central One conectado (prueba)');
    return json({ ok: true });
  }

  const m = /^flakito-(RB-[A-Z0-9]{7})$/.exec(String(ev?.order?.idempotency_key || ''));
  if (!m) {
    await telegram('⚠️ Aviso de Central One sin código de Flakito: ' + name + ' · ' + (ev?.order?.reference_code || '?'));
    return json({ ok: true });
  }
  const code = m[1];

  try {
    const q = sql();
    if (name === 'order.delivered') {
      const u = await q`UPDATE orders SET status = 'ENTREGADO', co_status = 'delivered'
        WHERE code = ${code} AND status = 'PAGADO' RETURNING id`;
      if (u[0]) {
        await telegram('🎮 ' + code + ' ENTREGADO por Central One');
      } else {
        await q`UPDATE orders SET co_status = 'delivered' WHERE code = ${code} AND co_status IS DISTINCT FROM 'delivered'`;
      }
    } else if (name === 'order.failed' || name === 'order.partially_delivered' || name === 'order.refunded') {
      const u = await q`UPDATE orders SET co_status = ${name.replace('order.', '')}
        WHERE code = ${code} AND status = 'PAGADO' AND co_status IS DISTINCT FROM 'delivered' RETURNING id`;
      if (u[0]) await telegram('⚠️ ' + code + ': Central One avisa ' + name + '. Entrégalo a mano o revisa el portal.');
    }
    return json({ ok: true });
  } catch (e) {
    console.error('co webhook error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
