import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { cldConfig, thumb, destroyImage } from '@/lib/cloudinary';
import { allGames, imageMap } from '@/lib/games-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BADGES = ['promo', 'nuevo'];

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

function cleanPackages(list, slug) {
  if (!Array.isArray(list) || list.length > 30) return null;
  const out = [];
  for (const p of list) {
    const label = String(p?.label || '').trim().slice(0, 40);
    const price = Math.round(Number(p?.price) * 100) / 100;
    if (!label || !Number.isFinite(price) || price <= 0 || price > 100000) return null;
    const keep = typeof p?.id === 'string' && p.id.startsWith(slug + '-') && /^[a-z0-9-]+$/.test(p.id);
    const id = keep ? p.id : slug + '-' + Math.random().toString(36).slice(2, 8);
    out.push({ id, label, price });
  }
  return out;
}

export async function GET(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  try {
    const [list, im] = await Promise.all([allGames(), imageMap()]);
    return json({
      games: list.map((g) => ({
        slug: g.slug,
        name: g.name,
        kind: g.kind,
        emoji: g.emoji,
        custom: Boolean(g.custom),
        idLabel: g.idLabel || '',
        badge: g.badge || '',
        image: im.has(g.slug) ? thumb(im.get(g.slug), 300) : null,
        packages: (g.packages || []).map((p) => ({ id: p.id, label: p.label, price: p.price })),
      })),
    });
  } catch (e) {
    console.error('servicios get error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function POST(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  if (!body) return json({ error: 'json_invalido' }, 400);
  const name = String(body.name || '').trim().slice(0, 40);
  const slug = slugify(name);
  if (!name || !slug) return json({ error: 'nombre_invalido' }, 400);
  const kind = body.kind === 'tarjeta' ? 'tarjeta' : 'directa';
  const badge = BADGES.includes(body.badge) ? body.badge : null;
  const idLabel = String(body.idLabel || '').trim().slice(0, 40) || 'ID de jugador';
  const packages = cleanPackages(body.packages || [], slug);
  if (!packages) return json({ error: 'paquetes_invalidos' }, 400);
  try {
    if ((await allGames()).some((g) => g.slug === slug)) return json({ error: 'existe' }, 409);
    await sql()`INSERT INTO custom_games (slug, name, kind, id_label, badge, packages)
      VALUES (${slug}, ${name}, ${kind}, ${idLabel}, ${badge}, ${JSON.stringify(packages)}::jsonb)`;
    return json({ ok: true, slug });
  } catch (e) {
    console.error('servicios post error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function PATCH(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  const slug = String(body?.slug || '');
  if (!body || !slug) return json({ error: 'datos_invalidos' }, 400);
  try {
    if (!(await allGames()).some((g) => g.slug === slug)) return json({ error: 'no_existe' }, 404);
    const q = sql();
    if (body.image) {
      const c = cldConfig();
      if (!c) return json({ error: 'cloudinary_no_configurado' }, 500);
      const url = String(body.image.url || '');
      const pid = String(body.image.public_id || '').slice(0, 200);
      if (!url.startsWith('https://res.cloudinary.com/' + c.cloudName + '/')) return json({ error: 'url_invalida' }, 400);
      const old = await q`SELECT public_id FROM game_images WHERE slug = ${slug}`;
      await q`INSERT INTO game_images (slug, url, public_id, updated_at)
        VALUES (${slug}, ${url}, ${pid}, now())
        ON CONFLICT (slug) DO UPDATE SET url = EXCLUDED.url, public_id = EXCLUDED.public_id, updated_at = now()`;
      if (old[0]?.public_id && old[0].public_id !== pid) await destroyImage(old[0].public_id);
      return json({ ok: true });
    }
    if (body.edit) {
      const e = body.edit;
      const kind = e.kind === 'tarjeta' ? 'tarjeta' : 'directa';
      const badge = BADGES.includes(e.badge) ? e.badge : null;
      const idLabel = String(e.idLabel || '').trim().slice(0, 40) || 'ID de jugador';
      const packages = cleanPackages(e.packages || [], slug);
      if (!packages) return json({ error: 'paquetes_invalidos' }, 400);
      const r = await q`UPDATE custom_games
        SET kind = ${kind}, badge = ${badge}, id_label = ${idLabel}, packages = ${JSON.stringify(packages)}::jsonb
        WHERE slug = ${slug} RETURNING slug`;
      if (!r.length) return json({ error: 'no_editable' }, 400);
      return json({ ok: true });
    }
    return json({ error: 'datos_invalidos' }, 400);
  } catch (e) {
    console.error('servicios patch error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function DELETE(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const body = await readBody(req);
  const slug = String(body?.slug || '');
  if (!body || !slug) return json({ error: 'datos_invalidos' }, 400);
  try {
    const q = sql();
    if (!body.imageOnly) {
      const r = await q`DELETE FROM custom_games WHERE slug = ${slug} RETURNING slug`;
      if (!r.length) return json({ error: 'no_editable' }, 400);
      try {
        await q`DELETE FROM game_settings WHERE slug = ${slug}`;
      } catch (e) {}
    }
    const img = await q`DELETE FROM game_images WHERE slug = ${slug} RETURNING public_id`;
    if (img[0]?.public_id) await destroyImage(img[0].public_id);
    return json({ ok: true });
  } catch (e) {
    console.error('servicios delete error', e?.code || '', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
