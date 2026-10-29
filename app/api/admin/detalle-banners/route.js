import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { allGames } from '@/lib/games-state';
import { cldConfig, thumb } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function readBody(req) {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

async function validGame(slug) {
  if (!slug || slug.length > 150) return false;
  const games = await allGames();
  return games.some((g) => g.slug === slug);
}

function cleanText(value, max) {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, max) || null;
}

function view(row) {
  return {
    slug: row.slug,
    url: row.url,
    preview: row.url ? thumb(row.url, 900) : null,
    title: row.title,
    subtitle: row.subtitle,
    chip1: row.chip_1,
    chip2: row.chip_2,
    chip3: row.chip_3,
  };
}

export async function GET(req) {
  if (!await isAdmin(req)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  try {
    const rows = await sql()`
      SELECT slug, url, title, subtitle,
             chip_1, chip_2, chip_3
      FROM game_detail_banners
      ORDER BY slug
    `;

    return json({ banners: rows.map(view) });
  } catch (e) {
    console.error('detalle banners get', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function PATCH(req) {
  if (!await isAdmin(req)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  const body = await readBody(req);
  const slug = String(body?.slug || '');

  if (!body || !await validGame(slug)) {
    return json({ error: 'juego_invalido' }, 400);
  }

  const title = cleanText(body.title, 100);
  const subtitle = cleanText(body.subtitle, 140);
  const chip1 = cleanText(body.chip1, 45);
  const chip2 = cleanText(body.chip2, 45);
  const chip3 = cleanText(body.chip3, 45);

  let url = null;
  let publicId = null;

  if (body.image) {
    const c = cldConfig();

    if (!c) {
      return json({ error: 'cloudinary_no_configurado' }, 500);
    }

    url = String(body.image.url || '');
    publicId = String(body.image.public_id || '');

    let validImage = false;

    try {
      const parsed = new URL(url);
      const prefix = '/' + c.cloudName + '/image/upload/';
      const imagePath = parsed.pathname;

      const imageSuffix = '/' + publicId;
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'avif'];

      const matchingFile = allowedExtensions.some((ext) =>
        imagePath.endsWith(imageSuffix + '.' + ext)
      );

      validImage =
        parsed.protocol === 'https:' &&
        parsed.hostname === 'res.cloudinary.com' &&
        parsed.port === '' &&
        parsed.username === '' &&
        parsed.password === '' &&
        parsed.search === '' &&
        parsed.hash === '' &&
        imagePath.startsWith(prefix) &&
        /^recargas-bo\/games\/[A-Za-z0-9_/-]+$/.test(publicId) &&
        publicId.length <= 200 &&
        matchingFile;
    } catch {}

    if (!validImage) {
      return json({ error: 'imagen_invalida' }, 400);
    }
  }

  try {
    const q = sql();

    const old = await q`
      SELECT url, public_id
      FROM game_detail_banners
      WHERE slug = ${slug}
    `;

    const finalUrl = body.image ? url : (old[0]?.url || null);
    const finalId = body.image ? publicId : (old[0]?.public_id || null);

    await q`
      INSERT INTO game_detail_banners (
        slug, url, public_id, title, subtitle,
        chip_1, chip_2, chip_3, updated_at
      )
      VALUES (
        ${slug}, ${finalUrl}, ${finalId},
        ${title}, ${subtitle},
        ${chip1}, ${chip2}, ${chip3}, NOW()
      )
      ON CONFLICT (slug)
      DO UPDATE SET
        url = EXCLUDED.url,
        public_id = EXCLUDED.public_id,
        title = EXCLUDED.title,
        subtitle = EXCLUDED.subtitle,
        chip_1 = EXCLUDED.chip_1,
        chip_2 = EXCLUDED.chip_2,
        chip_3 = EXCLUDED.chip_3,
        updated_at = NOW()
    `;

    return json({ ok: true });
  } catch (e) {
    console.error('detalle banners patch', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}

export async function DELETE(req) {
  if (!await isAdmin(req)) {
    return json({ error: 'no_autorizado' }, 401);
  }

  const body = await readBody(req);
  const slug = String(body?.slug || '');

  if (!body || !await validGame(slug)) {
    return json({ error: 'juego_invalido' }, 400);
  }

  try {
    await sql()`
      DELETE FROM game_detail_banners
      WHERE slug = ${slug}
    `;

    return json({ ok: true });
  } catch (e) {
    console.error('detalle banners delete', e?.message || '');
    return json({ error: 'db' }, 500);
  }
}
