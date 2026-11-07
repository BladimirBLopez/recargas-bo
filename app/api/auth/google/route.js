import crypto from 'crypto';
import { limited } from '@/lib/ratelimit.js';
import { clientIp } from '@/lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = 'https://flakitogaming.store';
const REDIRECT = SITE + '/api/auth/google/callback';

function go(url, cookie) {
  const h = new Headers({ Location: url, 'Cache-Control': 'no-store' });
  if (cookie) h.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers: h });
}

export async function GET(req) {
  const host = (req.headers.get('host') || '').toLowerCase();
  if (host !== 'flakitogaming.store') return go(SITE + '/api/auth/google');
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || !process.env.GOOGLE_CLIENT_SECRET) return go(SITE + '/perfil?g=config');
  if (await limited('google:' + clientIp(req), 20)) return go(SITE + '/perfil?g=limite');
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return go(
    'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString(),
    'g_state=' + state + '; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600'
  );
}
