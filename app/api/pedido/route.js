import { games } from '../../../data/games.js';
import { sql } from '../../../lib/db.js';
import { limited } from '../../../lib/ratelimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function newCode() {
  const a = Date.now().toString(36).toUpperCase().slice(-5);
  const b = Math.random().toString(36).slice(2, 4).toUpperCase().padEnd(2, '0');
  return 'RB-' + a + b;
}

export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('pedido:' + ip, 10)) return json({ error: 'limite' }, 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const game = games.find((g) => g.slug === body?.slug);
  const pkg = game?.packages.find((p) => p.id === body?.packageId);
  if (!game || !pkg) return json({ error: 'pack_invalido' }, 400);

  const playerId = String(body?.playerId ?? '').trim();
  const okId =
    game.slug === 'free-fire'
      ? /^\d{8,12}$/.test(playerId)
      : playerId.length > 3 && playerId.length <= 40;
  if (!okId) return json({ error: 'id_invalido' }, 400);

  const nickname = body?.nickname ? String(body.nickname).trim().slice(0, 60) : null;

  try {
    const q = sql();
    for (let i = 0; i < 3; i++) {
      const code = newCode();
      try {
        const rows = await q`INSERT INTO orders (code, game_slug, package_id, package_label, price, player_id, nickname)
          VALUES (${code}, ${game.slug}, ${pkg.id}, ${pkg.label}, ${pkg.price}, ${playerId}, ${nickname})
          RETURNING id, code, created_at`;
        const r = rows[0];
        return json({
          orderId: r.id,
          code: r.code,
          ts: new Date(r.created_at).getTime(),
          game: game.name,
          pkg: pkg.label,
          price: pkg.price,
        });
      } catch (e) {
        if (e?.code !== '23505') throw e;
      }
    }
    return json({ error: 'codigo_repetido' }, 500);
  } catch (e) {
    console.error('pedido error', e?.code || '', e?.message || '');
    return json({ error: 'no_se_pudo_crear' }, 500);
  }
}
