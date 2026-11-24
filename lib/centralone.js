import { sql } from './db.js';

const BASE = 'https://portal.centraloneglobal.com/api/v1';

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
    console.error('co telegram error');
  }
}

export async function entregar(code) {
  const key = process.env.CO_API_KEY;
  if (!key) return { ok: false, reason: 'sin_llave' };
  const q = sql();
  const rows = await q`SELECT o.id, o.code, o.player_id, o.status, o.payment_mode, o.co_order_id, o.co_status, m.co_product_id
    FROM orders o JOIN co_products m ON m.package_id = o.package_id
    WHERE o.code = ${code}`;
  const o = rows[0];
  if (!o) return { ok: false, reason: 'sin_mapa' };
  if (o.status !== 'PAGADO' || o.payment_mode !== 'AUTOMATICO' || o.co_order_id || o.co_status) {
    return { ok: false, reason: 'no_aplica' };
  }
  const claim = await q`UPDATE orders SET co_status = 'enviando'
    WHERE id = ${o.id} AND co_order_id IS NULL AND co_status IS NULL RETURNING id`;
  if (!claim[0]) return { ok: false, reason: 'ya_en_curso' };
  try {
    const res = await fetch(BASE + '/orders', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'Content-Type': 'application/json',
        'Idempotency-Key': 'flakito-' + o.code,
      },
      body: JSON.stringify({
        items: [{ catalog_item_id: o.co_product_id, quantity: 1, target_payload: { player_id: String(o.player_id) } }],
        note: o.code,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 201 && data?.order?.id) {
      await q`UPDATE orders SET co_order_id = ${data.order.id}, co_status = 'confirmed' WHERE id = ${o.id}`;
      await telegram('📤 ' + o.code + ' enviado a Central One');
      return { ok: true, coOrderId: data.order.id };
    }
    const why = data?.error?.code || 'http_' + res.status;
    await q`UPDATE orders SET co_status = ${'error:' + why} WHERE id = ${o.id}`;
    await telegram('⚠️ ' + o.code + ' NO se pudo enviar a Central One: ' + why + '. Entrégalo a mano.');
    return { ok: false, reason: why };
  } catch (e) {
    console.error('co entregar error', e?.message || '');
    await q`UPDATE orders SET co_status = 'incierto' WHERE id = ${o.id}`;
    await telegram('⚠️ ' + o.code + ': sin respuesta de Central One, revisa si se creó el pedido antes de repetirlo.');
    return { ok: false, reason: 'red' };
  }
}
