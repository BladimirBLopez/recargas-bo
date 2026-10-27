import crypto from 'crypto';
import { promisify } from 'util';
import { sql } from './db.js';

const scrypt = promisify(crypto.scrypt);

export const SESSION_COOKIE = 'rb_session';
const MAX_AGE = 30 * 24 * 60 * 60;

// Hash de relleno: así el tiempo de respuesta no delata si un correo existe.
export const DUMMY_HASH = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(64);

export const hasSecret = () => Boolean(process.env.AUTH_SECRET);

export async function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(pin + ':' + process.env.AUTH_SECRET, salt, 32);
  return 'scrypt$' + salt + '$' + key.toString('hex');
}

export async function verifyPin(pin, stored) {
  const [, salt, hash] = String(stored || '').split('$');
  if (!salt || !hash) return false;
  const key = await scrypt(pin + ':' + process.env.AUTH_SECRET, salt, 32);
  const a = Buffer.from(hash, 'hex');
  return a.length === key.length && crypto.timingSafeEqual(a, key);
}

export function cleanEmail(v) {
  const e = String(v ?? '').trim().toLowerCase();
  return e.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) ? e : '';
}

export function cleanName(v) {
  const n = String(v ?? '').replace(/\s+/g, ' ').trim();
  return n.length >= 2 && n.length <= 40 ? n : '';
}

export const validPin = (p) => /^\d{4}$/.test(String(p ?? ''));

export function clientIp(req) {
  return (req.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
}

const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');

export async function createSession(userId) {
  const q = sql();
  const token = crypto.randomBytes(32).toString('hex');
  await q`INSERT INTO sessions (token_hash, user_id, expires_at)
    VALUES (${sha(token)}, ${userId}, now() + interval '30 days')`;
  if (Math.random() < 0.02) {
    await q`DELETE FROM sessions WHERE expires_at < now()`;
  }
  return token;
}

export const sessionCookie = (token) =>
  SESSION_COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + MAX_AGE;

export const clearSessionCookie = () =>
  SESSION_COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';

function readToken(req) {
  const h = req.headers.get('cookie') || '';
  for (const part of h.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === SESSION_COOKIE) {
      const t = v.join('=');
      return /^[a-f0-9]{64}$/.test(t) ? t : '';
    }
  }
  return '';
}

export async function getUser(req) {
  const t = readToken(req);
  if (!t) return null;
  const rows = await sql()`SELECT u.id, u.name, u.email
    FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ${sha(t)} AND s.expires_at > now()`;
  return rows[0] || null;
}

export async function destroySession(req) {
  const t = readToken(req);
  if (t) await sql()`DELETE FROM sessions WHERE token_hash = ${sha(t)}`;
}
