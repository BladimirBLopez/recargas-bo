import { getUser } from '../../../../lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  let user = null;
  try {
    const u = await getUser(req);
    if (u) user = { name: u.name, email: u.email };
  } catch (e) {
    console.error('yo error', e?.code || '', e?.message || '');
  }
  return Response.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
