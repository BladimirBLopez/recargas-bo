import { games } from '../../../data/games.js';
import { sql } from '../../../lib/db.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Solo se muestran las 2 primeras letras del usuario para cuidar su privacidad.
function mask(n) {
  const s = String(n || '').trim();
  if (!s) return 'Cliente';
  return Array.from(s).slice(0, 2).join('') + '•••';
}

export async function GET() {
  const headers = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' };
  try {
    const rows = await sql()`SELECT game_slug, package_label, price, nickname, paid_at
      FROM orders
      WHERE status IN ('PAGADO', 'ENTREGADO') AND paid_at IS NOT NULL
      ORDER BY paid_at DESC LIMIT 10`;
    const ventas = rows.map((r) => ({
      user: mask(r.nickname),
      game: games.find((g) => g.slug === r.game_slug)?.name || 'Recarga',
      pkg: r.package_label,
      price: r.price,
      ts: new Date(r.paid_at).toISOString(),
    }));
    return Response.json({ ventas }, { headers });
  } catch (e) {
    console.error('ventas error', e?.code || '', e?.message || '');
    return Response.json({ ventas: [] }, { headers: { 'Cache-Control': 'no-store' } });
  }
}
