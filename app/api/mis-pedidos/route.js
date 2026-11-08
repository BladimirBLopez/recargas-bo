import { sql } from '../../../lib/db.js';
import { getUser } from '../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function GET(req) {
  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'no_autorizado' }, 401);

    const q = sql();
    const rows = await q`
      SELECT code, game_slug, package_label,
             price, status, created_at
      FROM orders
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC, id DESC
      LIMIT 30
    `;

    return json({ orders: rows });
  } catch (e) {
    console.error('mis-pedidos error', e?.code || '');
    return json({ error: 'no_disponible' }, 503);
  }
}
