import crypto from 'crypto';

export const COOKIE = 'rb_admin';
export const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

function sign(exp) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_PASSWORD)
    .update('rb-admin:' + exp)
    .digest('hex');
}

function safeEq(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

function readCookie(req, name) {
  const h = req.headers.get('cookie') || '';
  for (const part of h.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return v.join('=');
  }
  return '';
}

export function makeToken() {
  const exp = Date.now() + COOKIE_MAX_AGE * 1000;
  return exp + '.' + sign(exp);
}

export function checkPassword(pw) {
  const real = process.env.ADMIN_PASSWORD;
  return Boolean(real) && safeEq(pw ?? '', real);
}

export function isAdmin(req) {
  if (!process.env.ADMIN_PASSWORD) return false;
  const [exp, sig] = readCookie(req, COOKIE).split('.');
  if (!exp || !sig || !(Number(exp) > Date.now())) return false;
  return safeEq(sig, sign(exp));
}
