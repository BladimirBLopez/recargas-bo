import { games } from '../../../../data/games.js';
import { sql } from '../../../../lib/db.js';
import { limited } from '../../../../lib/ratelimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';



function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return json({ ok: false, error: 'sin_config' }, 500);

  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('avisar:' + ip, 10)) return json({ error: 'limite' }, 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const code = typeof body?.code === 'string' ? body.code.trim() : '';
  if (!/^RB-[A-Z0-9]{5,12}$/.test(code)) return json({ error: 'codigo_invalido' }, 400);

  try {
    const q = sql();
    const rows = await q`UPDATE orders SET notified_at = now()
      WHERE code = ${code} AND notified_at IS NULL AND status = 'PENDIENTE'
      RETURNING id, code, game_slug, package_label, price, player_id, nickname`;
    const o = rows[0];
    if (!o) return json({ ok: true, sent: false });

    const gameName = games.find((g) => g.slug === o.game_slug)?.name || o.game_slug;
    const text =
      '🔔 ' + o.code + ' · ' + gameName + ' · ' + o.package_label + ' · Bs ' + Number(o.price) +
      '\nID: ' + o.player_id + (o.nickname ? ' · ' + o.nickname : '') +
      '\nPanel: ' + new URL(req.url).origin + '/admin';

    let sent = false;
    try {
      const r = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      });
      sent = r.ok;
      if (!r.ok) console.error('telegram status', r.status);
    } catch (e) {
      console.error('telegram fetch error');
    }
    if (!sent) {
      await q`UPDATE orders SET notified_at = NULL WHERE id = ${o.id}`;
      return json({ ok: false, sent: false }, 502);
    }
    return json({ ok: true, sent: true });
  } catch (e) {
    console.error('avisar error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
