import { limited } from '../../../lib/ratelimit.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOGIN_PAGE = 'https://shop2game.com/app/100067/idlogin';
const ENDPOINT = 'https://shop2game.com/api/auth/player_id_login';
const UA =
  'Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36';


function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

function saveCookies(res, jar) {
  const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  for (const c of list) {
    const pair = c.split(';')[0];
    const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}

const cookieHeader = (jar) => [...jar].map(([k, v]) => k + '=' + v).join('; ');

function isChallenge(res, data, body) {
  const url = data && typeof data.url === 'string' ? data.url.toLowerCase() : '';
  const b = (body || '').toLowerCase();
  return (
    url.includes('captcha-delivery.com') ||
    url.includes('datadome') ||
    ((res.status === 403 || res.status === 429) &&
      (b.includes('captcha-delivery.com') || b.includes('datadome')))
  );
}

async function preflight(jar) {
  const res = await fetch(LOGIN_PAGE, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': UA,
    },
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  saveCookies(res, jar);
  await res.text();
}

async function login(id, jar) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    Origin: 'https://shop2game.com',
    Referer: LOGIN_PAGE,
    'User-Agent': UA,
  };
  if (jar.size) headers.Cookie = cookieHeader(jar);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ app_id: 100067, login_id: id, app_server_id: 0 }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  saveCookies(res, jar);
  const body = await res.text();
  let data = null;
  try {
    data = JSON.parse(body);
  } catch (e) {}
  return { res, data, body };
}

async function verificarRoblox(id, request) {
  if (!/^[A-Za-z0-9_]{3,20}$/.test(id)) {
    return json({ ok: false, code: 'INVALID_FORMAT', message: 'El usuario debe tener de 3 a 20 caracteres: letras, números o _.' }, 400);
  }
  const ip = (request.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('verificar:' + ip, 15)) {
    return json({ ok: false, code: 'RATE_LIMITED', message: 'Demasiadas consultas, espera un minuto.' }, 429);
  }
  try {
    const res = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ usernames: [id], excludeBannedUsers: true }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (res.status === 429) {
      return json({ ok: false, code: 'RATE_LIMITED', message: 'Roblox limitó las consultas.' });
    }
    if (!res.ok) {
      return json({ ok: false, code: 'NETWORK_ERROR', message: 'Roblox respondió HTTP ' + res.status + '.' });
    }
    const data = await res.json();
    const u = Array.isArray(data && data.data) ? data.data[0] : null;
    if (!u || !u.id) {
      return json({ ok: false, code: 'INVALID_PLAYER', message: 'No se encontró el usuario.' });
    }
    let avatar = '';
    try {
      const t = await fetch(
        'https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=' + encodeURIComponent(u.id) + '&size=150x150&format=Png&isCircular=false',
        { signal: AbortSignal.timeout(5000), cache: 'no-store' }
      );
      if (t.ok) {
        const td = await t.json();
        const url = td && td.data && td.data[0] && td.data[0].imageUrl;
        if (typeof url === 'string') {
          const p = new URL(url);
          if (p.protocol === 'https:') avatar = p.href;
        }
      }
    } catch (e) {}
    return json({
      ok: true,
      code: 'SUCCESS',
      nickname: String(u.displayName || u.name),
      username: String(u.name),
      region: '',
      avatar,
    });
  } catch (e) {
    return json({ ok: false, code: 'NETWORK_ERROR', message: 'No se pudo consultar a Roblox.' });
  }
}

async function verificarML(id, zone, request) {
  if (!/^\d{5,12}$/.test(id) || !/^\d{1,5}$/.test(zone)) {
    return json({ ok: false, code: 'INVALID_FORMAT', message: 'ID o Zona con formato inválido.' }, 400);
  }
  const ip = (request.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('verificar:' + ip, 15)) {
    return json({ ok: false, code: 'RATE_LIMITED', message: 'Demasiadas consultas, espera un minuto.' }, 429);
  }
  const base = process.env.ML_CHECK_URL || 'https://api.isan.eu.org/nickname/ml';
  try {
    const u = new URL(base);
    if (u.protocol !== 'https:') throw new Error('url');
    u.searchParams.set('id', id);
    u.searchParams.set('server', zone);
    const res = await fetch(u.href, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (res.status === 429) {
      return json({ ok: false, code: 'RATE_LIMITED', message: 'El verificador limitó las consultas.' });
    }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || typeof data !== 'object') {
      return json({ ok: false, code: 'NETWORK_ERROR', message: 'El verificador respondió HTTP ' + res.status + '.' });
    }
    const name = typeof data.name === 'string' ? data.name.trim() : '';
    if (data.success === true && name) {
      return json({
        ok: true,
        code: 'SUCCESS',
        nickname: name.slice(0, 60),
        region: String(data.country || ''),
        avatar: '',
      });
    }
    return json({ ok: false, code: 'NOT_FOUND', message: 'No se pudo confirmar la cuenta.' });
  } catch (e) {
    return json({ ok: false, code: 'NETWORK_ERROR', message: 'No se pudo consultar el verificador.' });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get('game');
  const id = (searchParams.get('id') || '').trim();
  const debug = searchParams.get('debug') === '1';

  if (game === 'roblox') return verificarRoblox(id, request);
  if (game === 'mobile-legends') return verificarML(id, (searchParams.get('zone') || '').trim(), request);

  if (game !== 'free-fire') {
    return json({ ok: false, code: 'GAME_NOT_SUPPORTED', message: 'Juego no soportado.' }, 400);
  }
  if (!/^\d{8,12}$/.test(id)) {
    return json({ ok: false, code: 'INVALID_FORMAT', message: 'El ID debe tener de 8 a 12 dígitos.' }, 400);
  }

  const ip = (request.headers.get('x-forwarded-for') || 'x').split(',')[0].trim();
  if (await limited('verificar:' + ip, 15)) {
    return json({ ok: false, code: 'RATE_LIMITED', message: 'Demasiadas consultas, espera un minuto.' }, 429);
  }

  try {
    const jar = new Map();
    await preflight(jar);
    let r = await login(id, jar);
    let retried = false;
    if (isChallenge(r.res, r.data, r.body)) {
      retried = true;
      r = await login(id, jar);
    }
    const { res, data, body } = r;
    const info = debug
      ? { status: res.status, retried, cookies: jar.size, keys: data ? Object.keys(data) : null }
      : undefined;

    if (isChallenge(res, data, body)) {
      return json({ ok: false, code: 'PROVIDER_RESTRICTED', message: 'Garena pidió verificación.', debug: info });
    }
    if (res.status === 429) {
      return json({ ok: false, code: 'RATE_LIMITED', message: 'Garena limitó las consultas.', debug: info });
    }
    if (!res.ok) {
      return json({ ok: false, code: 'NETWORK_ERROR', message: 'Garena respondió HTTP ' + res.status + '.', debug: info });
    }
    if (!data || typeof data !== 'object') {
      return json({ ok: false, code: 'INVALID_RESPONSE', message: 'Respuesta vacía o no JSON.', debug: info });
    }

    const nickname = data.nickname || (data.data && data.data.nickname) || (data.player && data.player.nickname) || '';
    const region = data.region || data.country || (data.data && (data.data.region || data.data.country)) || '';
    if (nickname) {
      const rawAvatar = data.img_url || data.data?.img_url || data.player?.img_url || '';
      let avatar = '';

      if (typeof rawAvatar === 'string') {
        try {
          const parsed = new URL(rawAvatar);
          if (parsed.protocol === 'https:') avatar = parsed.href;
        } catch (e) {}
      }

      return json({
        ok: true,
        code: 'SUCCESS',
        nickname: String(nickname),
        region: String(region || ''),
        avatar,
        debug: info,
      });
    }
    const msg = String(data.message || data.error || data.errorMsg || '');
    return json({
      ok: false,
      code: msg === 'error_params' ? 'INVALID_RESPONSE' : 'INVALID_PLAYER',
      message: msg || 'No se encontró la cuenta.',
      debug: info,
    });
  } catch (e) {
    return json({ ok: false, code: 'NETWORK_ERROR', message: 'No se pudo consultar a Garena.' });
  }
}
