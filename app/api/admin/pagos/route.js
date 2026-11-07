import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  if (!(await isAdmin(req))) return json({ error: 'no_autorizado' }, 401);
  try {
    const q = sql();
    const rows = await q`SELECT msg_id, amount, status, created_at FROM pagos_recibidos
      WHERE status IN ('varios','sin_pedido','repetido')
         OR (status = 'procesando' AND created_at < now() - interval '10 minutes')
      ORDER BY created_at DESC LIMIT 15`;
    const pagos = await Promise.all(
      rows.map(async (p) => {
        const [candidatos, pagados] = await Promise.all([
          q`SELECT code, status, game_slug, package_label, player_id, nickname, created_at FROM orders
            WHERE price = ${p.amount}::numeric AND status IN ('PENDIENTE','EXPIRADO','CANCELADO')
              AND created_at > now() - interval '2 days'
            ORDER BY (status = 'PENDIENTE') DESC, id DESC LIMIT 6`,
          q`SELECT code, paid_at FROM orders
            WHERE price = ${p.amount}::numeric AND status IN ('PAGADO','ENTREGADO')
              AND paid_at > ${p.created_at}::timestamptz - interval '3 hours'
            ORDER BY paid_at DESC LIMIT 3`,
        ]);
        return { ...p, candidatos, pagados };
      })
    );
    return json({ pagos });
  } catch (e) {
    console.error('admin pagos get error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function POST(req) {
  if (!(await isAdmin(req))) return json({ error: 'no_autorizado' }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const msgId = String(body?.msgId || '').slice(0, 120);
  const action = body?.action;
  if (!msgId || !['asignar', 'descartar'].includes(action)) return json({ error: 'datos_invalidos' }, 400);
  try {
    const q = sql();
    const rows = await q`SELECT amount, status, created_at FROM pagos_recibidos WHERE msg_id = ${msgId}`;
    const p = rows[0];
    if (!p) return json({ error: 'no_existe' }, 404);
    const open =
      ['varios', 'sin_pedido', 'repetido'].includes(p.status) ||
      (p.status === 'procesando' && Date.now() - new Date(p.created_at).getTime() > 10 * 60 * 1000);
    if (!open) return json({ error: 'ya_resuelto' }, 409);

    if (action === 'descartar') {
      await q`UPDATE pagos_recibidos SET status = 'descartado' WHERE msg_id = ${msgId}`;
      return json({ ok: true });
    }

    const code = String(body?.code || '').trim().toUpperCase();
    if (!/^RB-[A-Z0-9]{7}$/.test(code)) return json({ error: 'datos_invalidos' }, 400);
    const used = await q`SELECT 1 FROM pagos_recibidos WHERE order_code = ${code} AND status = 'confirmado' LIMIT 1`;
    if (used[0]) return json({ error: 'pedido_ya_pagado' }, 409);
    const upd = await q`UPDATE orders SET status = 'PAGADO', paid_at = now()
      WHERE code = ${code} AND price = ${p.amount}::numeric AND status IN ('PENDIENTE','EXPIRADO','CANCELADO')
      RETURNING id`;
    if (!upd[0]) return json({ error: 'pedido_no_valido' }, 409);
    await q`UPDATE pagos_recibidos SET status = 'confirmado', order_code = ${code} WHERE msg_id = ${msgId}`;
    return json({ ok: true });
  } catch (e) {
    console.error('admin pagos post error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
