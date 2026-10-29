import { isAdmin, changePassword, COOKIE } from '@/lib/admin';
import { limited } from '@/lib/ratelimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200, extra = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...extra },
  });
}

export async function PATCH(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);

  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('admin-clave:' + ip, 5)) {
    return json({ error: 'limite' }, 429);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  try {
    const result = await changePassword(body?.current, body?.next);
    if (!result.ok) return json(result, 400);

    const cookie = COOKIE +
      '=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0';

    return json({ ok: true }, 200, { 'Set-Cookie': cookie });
  } catch (e) {
    console.error('Cambio de clave:', e?.code || e?.message || 'error');
    return json({ error: 'servidor' }, 500);
  }
}
