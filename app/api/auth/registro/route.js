import { sql } from '../../../../lib/db.js';
import { limited } from '../../../../lib/ratelimit.js';
import {
  hasSecret, hashPin, createSession, sessionCookie, clientIp, cleanEmail, cleanName, validPin,
} from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
}

export async function POST(req) {
  if (!hasSecret()) return json({ error: 'sin_config' }, 500);
  if (await limited('registro:' + clientIp(req), 5)) return json({ error: 'limite' }, 429);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  const name = cleanName(body?.name);
  const email = cleanEmail(body?.email);
  const pin = String(body?.pin ?? '');
  if (!name) return json({ error: 'nombre_invalido' }, 400);
  if (!email) return json({ error: 'correo_invalido' }, 400);
  if (!validPin(pin)) return json({ error: 'pin_invalido' }, 400);

  try {
    const pinHash = await hashPin(pin);
    const rows = await sql()`INSERT INTO users (email, name, pin_hash)
      VALUES (${email}, ${name}, ${pinHash}) RETURNING id, name, email`;
    const u = rows[0];
    const token = await createSession(u.id);
    return json({ ok: true, user: { name: u.name, email: u.email } }, 200, {
      'Set-Cookie': sessionCookie(token),
    });
  } catch (e) {
    if (e?.code === '23505') return json({ error: 'correo_existe' }, 409);
    console.error('registro error', e?.code || '', e?.message || '');
    return json({ error: 'no_se_pudo' }, 500);
  }
}
