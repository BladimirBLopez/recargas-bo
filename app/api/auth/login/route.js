import { sql } from '../../../../lib/db.js';
import { limited } from '../../../../lib/ratelimit.js';
import {
  hasSecret, verifyPin, createSession, sessionCookie, clientIp, cleanEmail, validPin, DUMMY_HASH,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
}

export async function POST(req) {
  if (!hasSecret()) return json({ error: 'sin_config' }, 500);
  if (await limited('login-user:' + clientIp(req), 10)) return json({ error: 'limite' }, 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const email = cleanEmail(body?.email);
  const pin = String(body?.pin ?? '');
  if (!email || !validPin(pin)) return json({ error: 'credenciales' }, 401);

  try {
    const q = sql();
    const rows = await q`SELECT id, name, email, pin_hash, locked_until FROM users WHERE email = ${email}`;
    const u = rows[0];

    if (!u) {
      await verifyPin(pin, DUMMY_HASH);
      return json({ error: 'credenciales' }, 401);
    }
    if (u.locked_until && new Date(u.locked_until).getTime() > Date.now()) {
      const mins = Math.ceil((new Date(u.locked_until).getTime() - Date.now()) / 60000);
      return json({ error: 'bloqueado', minutos: mins }, 429);
    }
    if (!u.pin_hash) return json({ error: 'usa_google' }, 401);

    const ok = await verifyPin(pin, u.pin_hash);
    if (!ok) {
      await q`UPDATE users SET
        failed_count = CASE WHEN failed_count + 1 >= 5 THEN 0 ELSE failed_count + 1 END,
        locked_until = CASE WHEN failed_count + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
        WHERE id = ${u.id}`;
      return json({ error: 'credenciales' }, 401);
    }

    await q`UPDATE users SET failed_count = 0, locked_until = NULL WHERE id = ${u.id}`;
    const token = await createSession(u.id);
    return json({ ok: true, user: { name: u.name, email: u.email } }, 200, {
      'Set-Cookie': sessionCookie(token),
    });
  } catch (e) {
    console.error('login error', e?.code || '', e?.message || '');
    return json({ error: 'no_se_pudo' }, 500);
  }
}
