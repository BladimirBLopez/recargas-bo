import { destroySession, clearSessionCookie } from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await destroySession(req);
  } catch (e) {
    console.error('salir error', e?.code || '', e?.message || '');
  }
  return Response.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store', 'Set-Cookie': clearSessionCookie() } }
  );
}
