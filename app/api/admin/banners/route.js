import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { cldConfig, thumb, destroyImage } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

const view = (r) => ({ id: Number(r.id), thumb: thumb(r.url, 500), active: r.active, position: r.position });

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  try {
    const rows = await sql()`SELECT id, url, position, active FROM banners ORDER BY position, id`;
    return json({ banners: rows.map(view) });
  } catch (e) {
    console.error('banners get error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  if (!body) return json({ error: 'json_invalido' }, 400);
  const c = cldConfig();
  if (!c) return json({ error: 'cloudinary_no_configurado' }, 500);
  const url = String(body.url || '');
  const pid = String(body.public_id || '').slice(0, 200);
  if (!url.startsWith('https://res.cloudinary.com/' + c.cloudName + '/')) return json({ error: 'url_invalida' }, 400);
  try {
    const q = sql();
    const n = await q`SELECT count(*)::int AS n FROM banners`;
    if (n[0].n >= 12) return json({ error: 'limite' }, 400);
    await q`INSERT INTO banners (url, public_id, position)
      VALUES (${url}, ${pid}, (SELECT COALESCE(MAX(position), -1) + 1 FROM banners))`;
    return json({ ok: true });
  } catch (e) {
    console.error('banners post error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function PATCH(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  const id = Number(body?.id);
  if (!body || !Number.isInteger(id)) return json({ error: 'datos_invalidos' }, 400);
  try {
    const q = sql();
    if (typeof body.active === 'boolean') {
      await q`UPDATE banners SET active = ${body.active} WHERE id = ${id}`;
      return json({ ok: true });
    }
    if (body.dir !== 'up' && body.dir !== 'down') return json({ error: 'datos_invalidos' }, 400);
    const rows = await q`SELECT id FROM banners ORDER BY position, id`;
    const ids = rows.map((r) => Number(r.id));
    const i = ids.indexOf(id);
    const j = body.dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return json({ ok: true });
    [ids[i], ids[j]] = [ids[j], ids[i]];
    for (let k = 0; k < ids.length; k++) {
      await q`UPDATE banners SET position = ${k} WHERE id = ${ids[k]}`;
    }
    return json({ ok: true });
  } catch (e) {
    console.error('banners patch error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function DELETE(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  const id = Number(body?.id);
  if (!body || !Number.isInteger(id)) return json({ error: 'datos_invalidos' }, 400);
  try {
    const q = sql();
    const rows = await q`SELECT public_id FROM banners WHERE id = ${id}`;
    await q`DELETE FROM banners WHERE id = ${id}`;
    if (rows[0]?.public_id) await destroyImage(rows[0].public_id);
    return json({ ok: true });
  } catch (e) {
    console.error('banners delete error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
