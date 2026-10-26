import { checkPassword, makeToken, COOKIE, COOKIE_MAX_AGE } from '../../../../lib/admin.js';

import { limited } from '../../../../lib/ratelimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


function json(body, status = 200, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
}

export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD) return json({ error: 'sin_config' }, 500);
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('login:' + ip, 5)) return json({ error: 'limite' }, 429);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  if (!checkPassword(body?.password)) return json({ error: 'clave_incorrecta' }, 401);
  const cookie =
    COOKIE + '=' + makeToken() + '; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=' + COOKIE_MAX_AGE;
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}

export async function DELETE() {
  const cookie = COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';
  return json({ ok: true }, 200, { 'Set-Cookie': cookie });
}
