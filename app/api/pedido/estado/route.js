import { sql } from '../../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  const code = (new URL(req.url).searchParams.get('code') || '').trim().toUpperCase();
  if (!/^RB-[A-Z0-9]{7}$/.test(code)) return json({ error: 'codigo_invalido' }, 400);
  try {
    const rows = await sql()`SELECT status, payment_mode, price FROM orders WHERE code = ${code}`;
    if (!rows[0]) return json({ error: 'no_existe' }, 404);
    return json({
      status: rows[0].status,
      paymentMode: rows[0].payment_mode,
      price: rows[0].payment_mode === 'MANUAL'
        ? Number(rows[0].price)
        : undefined,
    });
  } catch (e) {
    console.error('estado error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
