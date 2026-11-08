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

// Dice cuantos pedidos PENDIENTES se crearon en los ultimos 3 min.
// El script de Gmail lo usa para revisar mas seguido solo cuando hay un cliente pagando.
// No devuelve codigos ni datos de clientes.
export async function GET(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('pendientes:' + ip, 40)) return json({ error: 'limite' }, 429);
  if (!okSecret(req.headers.get('x-pago-secret'))) return json({ error: 'no_autorizado' }, 401);
  try {
    const q = sql();
    const r = await q`SELECT count(*)::int AS n FROM orders
      WHERE status = 'PENDIENTE'
          AND payment_mode = 'AUTOMATICO'
          AND created_at > now() - interval '3 minutes'`;
    return json({ pending: r[0]?.n || 0 });
  } catch (e) {
    console.error('pendientes error', e?.code || '');
    return json({ error: 'error' }, 500);
  }
}
