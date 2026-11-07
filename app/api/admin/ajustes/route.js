import { revalidatePath } from 'next/cache';
import { sql } from '../../../../lib/db.js';
import { isAdmin } from '../../../../lib/admin.js';
import { getSettings } from '../../../../lib/settings.js';
import { cleanSocials } from '../../../../lib/socials.js';
import { cldConfig } from '../../../../lib/cloudinary.js';

const QR_FALLBACK = '/qr-pago.png';

function validQr(value) {
  if (value === QR_FALLBACK) return true;
  if (typeof value !== 'string' || value.length > 2048) return false;
  try {
    const u = new URL(value);
    const c = cldConfig();
    if (!c) return false;
    const prefix = '/' + c.cloudName + '/image/upload/';
    const path = u.pathname.slice(prefix.length);
    return u.protocol === 'https:' &&
      u.hostname === 'res.cloudinary.com' &&
      !u.username && !u.password &&
      !u.search && !u.hash &&
      u.pathname.startsWith(prefix) &&
      /^(?:v[0-9]+\/)?recargas-bo\/payments\/[a-zA-Z0-9_/-]+\.(?:png|jpg|jpeg|webp)$/.test(path);
  } catch {
    return false;
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  return json(await getSettings());
}

export async function PATCH(req) {
  if (!await isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }
  if (body?.action === 'payment_qr') {
    if (!validQr(body.payment_qr)) {
      return json({ error: 'qr_invalido' }, 400);
    }
    try {
      const q = sql();
      await q`INSERT INTO app_settings (key, value, updated_at)
        VALUES ('payment_qr', ${body.payment_qr}, now())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = now()`;
      revalidatePath('/', 'layout');
      return json({ ok: true, payment_qr: body.payment_qr });
    } catch (e) {
      console.error('payment qr error', e?.code || '', e?.message || '');
      return json({ error: 'db' }, 500);
    }
  }
  if (body?.action === 'socials') {
    const { clean, bad } = cleanSocials(body.socials);
    if (bad) return json({ error: 'social_invalido', red: bad }, 400);
    try {
      await sql()`INSERT INTO app_settings (key, value, updated_at)
        VALUES ('socials', ${JSON.stringify(clean)}, now())
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = now()`;
      try {
        revalidatePath('/', 'layout');
      } catch (e) {}
      return json({ ok: true, socials: clean });
    } catch (e) {
      console.error('socials error', e?.code || '', e?.message || '');
      return json({ error: 'db' }, 500);
    }
  }
  const whatsapp = String(body?.whatsapp ?? '').replace(/\D/g, '');
  const notice = String(body?.notice ?? '').trim().slice(0, 160);
  if (whatsapp.length < 8 || whatsapp.length > 15) return json({ error: 'whatsapp_invalido' }, 400);
  try {
    const q = sql();
    await q`INSERT INTO app_settings (key, value, updated_at) VALUES ('whatsapp', ${whatsapp}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    await q`INSERT INTO app_settings (key, value, updated_at) VALUES ('notice', ${notice}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    try {
      revalidatePath('/', 'layout');
    } catch (e) {}
    return json({ ok: true, whatsapp, notice });
  } catch (e) {
    console.error('ajustes patch error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
