import { checkPassword, makeToken, COOKIE, COOKIE_MAX_AGE } from '../../../../lib/admin.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

function json(body, status = 200, extra = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...extra } });
}

export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD) return json({ error: 'sin_config' }, 500);
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (limited(ip)) return json({ error: 'limite' }, 429);
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
