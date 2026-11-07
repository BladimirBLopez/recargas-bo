import crypto from 'crypto';
import { sql } from '@/lib/db.js';
import { limited } from '@/lib/ratelimit.js';
import { createSession, sessionCookie, clientIp, cleanEmail, cleanName } from '@/lib/auth.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SITE = 'https://flakitogaming.store';
const CLEAR = 'g_state=; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

function go(path, session) {
  const h = new Headers({ Location: SITE + path, 'Cache-Control': 'no-store' });
  h.append('Set-Cookie', CLEAR);
  if (session) h.append('Set-Cookie', session);
  return new Response(null, { status: 302, headers: h });
}

function readState(req) {
  for (const part of (req.headers.get('cookie') || '').split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === 'g_state') return v.join('=');
  }
  return '';
}

function same(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y);
}

export async function GET(req) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code') || '';
  const state = url.searchParams.get('state') || '';
  if (url.searchParams.get('error')) return go('/perfil?g=cancelado');
  if (!code || !same(state, readState(req))) return go('/perfil?g=error');
  if (await limited('google-cb:' + clientIp(req), 20)) return go('/perfil?g=limite');
  const id = process.env.GOOGLE_CLIENT_ID;
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!id || !secret) return go('/perfil?g=config');

  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: id,
        client_secret: secret,
        redirect_uri: SITE + '/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!r.ok) return go('/perfil?g=error');
    const tok = await r.json();
    const part = String(tok.id_token || '').split('.')[1] || '';
    const p = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
    const okIss = p.iss === 'https://accounts.google.com' || p.iss === 'accounts.google.com';
    const verified = p.email_verified === true || p.email_verified === 'true';
    const email = cleanEmail(p.email);
    if (!okIss || p.aud !== id || !(p.exp * 1000 > Date.now()) || !verified || !p.sub || !email) {
      return go('/perfil?g=error');
    }
    const sub = String(p.sub);
    const q = sql();
    let rows = await q`SELECT id FROM users WHERE google_id = ${sub} LIMIT 1`;
    if (!rows[0]) {
      rows = await q`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
      if (rows[0]) {
        await q`UPDATE users SET google_id = ${sub}, email_verified = true WHERE id = ${rows[0].id}`;
      } else {
        const name = cleanName(p.name) || cleanName(email.split('@')[0].slice(0, 40)) || 'Cliente';
        try {
          rows = await q`INSERT INTO users (email, name, google_id, email_verified)
            VALUES (${email}, ${name}, ${sub}, true) RETURNING id`;
        } catch (e) {
          if (e?.code !== '23505') throw e;
          rows = await q`SELECT id FROM users WHERE email = ${email} LIMIT 1`;
        }
      }
    }
    if (!rows[0]) return go('/perfil?g=error');
    const token = await createSession(rows[0].id);
    return go('/perfil', sessionCookie(token));
  } catch (e) {
    console.error('google callback error', e?.code || '', e?.message || '');
    return go('/perfil?g=error');
  }
}
