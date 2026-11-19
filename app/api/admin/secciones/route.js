import { randomUUID } from 'node:crypto';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { allGames } from '@/lib/games-state';
import { loadPackageSections } from '@/lib/package-sections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });

export async function GET(req) {
  if (!(await isAdmin(req)))
    return json({ error: 'no_autorizado' }, 401);

  const slug = new URL(req.url).searchParams.get('slug');
  if (!slug)
    return json({ error: 'falta_juego' }, 400);

  try {
    const { sections, assignments } =
      await loadPackageSections();

    return json({
      sections: sections.get(slug) || [],
      assignments: Object.fromEntries(
        assignments.get(slug) || new Map()
      )
    });
  } catch (e) {
    console.error('secciones get', e);
    return json({ error: 'db' }, 500);
  }
}

export async function POST(req) {
  if (!(await isAdmin(req)))
    return json({ error: 'no_autorizado' }, 401);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const slug = String(body?.slug || '');
  const name = String(body?.name || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!name || name.length > 40)
    return json({ error: 'nombre_invalido' }, 400);

  if (/^(recargas|pases|descuento)$/i.test(name))
    return json({ error: 'nombre_reservado' }, 400);

  try {
    const exists = (await allGames())
      .some(g => g.slug === slug);

    if (!exists)
      return json({ error: 'juego_invalido' }, 400);

    const q = sql();

    const count = await q`
      SELECT COUNT(*)::int AS n
      FROM package_sections
      WHERE game_slug = ${slug}
    `;

    if (count[0].n >= 20)
      return json({ error: 'limite_secciones' }, 400);

    const id = 'sec-' + randomUUID();

    await q`
      INSERT INTO package_sections
        (game_slug, id, name, sort)
      VALUES (
        ${slug},
        ${id},
        ${name},
        (
          SELECT COALESCE(MAX(sort), 0) + 1
          FROM package_sections
          WHERE game_slug = ${slug}
        )
      )
    `;

    return json({ ok: true, id });
  } catch (e) {
    if (e?.code === '23505')
      return json({ error: 'nombre_repetido' }, 409);

    console.error('secciones post', e);
    return json({ error: 'db' }, 500);
  }
}

// Editar nombre, orden o visibilidad de una sección.
export async function PATCH(req) {
  if (!(await isAdmin(req)))
    return json({ error: 'no_autorizado' }, 401);

  let b;
  try { b = await req.json(); }
  catch { return json({ error: 'json_invalido' }, 400); }

  const slug = String(b?.slug || '');
  const id = String(b?.id || '');
  const hasName = b?.name !== undefined;
  const hasActive = b?.active !== undefined;
  const hasSort = b?.sort !== undefined;

  // Secciones fijas (Recargas / Pases): solo se puede cambiar el nombre, por juego.
  if (id === 'rec' || id === 'pass') {
    if (!/^[a-z0-9-]{1,60}$/.test(slug) || !hasName || hasActive || hasSort) {
      return json({ error: 'datos_invalidos' }, 400);
    }
    const fixedName = String(b.name || '').replace(/\s+/g, ' ').trim();
    const other = id === 'rec' ? 'pases' : 'recargas';
    if (!fixedName || fixedName.length > 40 || fixedName.toLowerCase() === 'descuento' || fixedName.toLowerCase() === other) {
      return json({ error: 'nombre_invalido' }, 400);
    }
    try {
      await sql()`INSERT INTO package_sections (game_slug, id, name, sort, active)
        VALUES (${slug}, ${id}, ${fixedName}, ${id === 'rec' ? -2 : -1}, true)
        ON CONFLICT (game_slug, id) DO UPDATE SET name = EXCLUDED.name`;
      return json({ ok: true });
    } catch (e) {
      if (e?.code === '23505') return json({ error: 'nombre_repetido' }, 409);
      console.error('secciones patch fija', e);
      return json({ error: 'db' }, 500);
    }
  }

  if (!slug || !/^sec-[0-9a-f-]{36}$/.test(id))
    return json({ error: 'datos_invalidos' }, 400);

  if (!hasName && !hasActive && !hasSort)
    return json({ error: 'sin_cambios' }, 400);

  const name = hasName
    ? String(b.name || '').replace(/\s+/g, ' ').trim()
    : '';

  if (hasName && (
    !name || name.length > 40 ||
    /^(recargas|pases|descuento)$/i.test(name)
  )) return json({ error: 'nombre_invalido' }, 400);

  if (hasActive && typeof b.active !== 'boolean')
    return json({ error: 'estado_invalido' }, 400);

  if (hasSort && (
    !Number.isInteger(b.sort) ||
    b.sort < 0 || b.sort > 9999
  )) return json({ error: 'orden_invalido' }, 400);

  try {
    const q = sql();
    const r = await q`
      UPDATE package_sections
      SET
        name = CASE WHEN ${hasName}::boolean
          THEN ${name} ELSE name END,
        active = CASE WHEN ${hasActive}::boolean
          THEN ${hasActive ? b.active : false} ELSE active END,
        sort = CASE WHEN ${hasSort}::boolean
          THEN ${hasSort ? b.sort : 0} ELSE sort END
      WHERE game_slug = ${slug} AND id = ${id}
      RETURNING id
    `;

    if (!r.length)
      return json({ error: 'no_existe' }, 404);

    return json({ ok: true });
  } catch (e) {
    if (e?.code === '23505')
      return json({ error: 'nombre_repetido' }, 409);

    console.error('secciones patch', e);
    return json({ error: 'db' }, 500);
  }
}

// Eliminar una sección sin borrar sus paquetes.
export async function DELETE(req) {
  if (!(await isAdmin(req)))
    return json({ error: 'no_autorizado' }, 401);

  let b;
  try { b = await req.json(); }
  catch { return json({ error: 'json_invalido' }, 400); }

  const slug = String(b?.slug || '');
  const id = String(b?.id || '');

  if (!slug || !/^sec-[0-9a-f-]{36}$/.test(id))
    return json({ error: 'datos_invalidos' }, 400);

  try {
    const q = sql();
    const r = await q`
      DELETE FROM package_sections
      WHERE game_slug = ${slug} AND id = ${id}
      RETURNING id
    `;

    if (!r.length)
      return json({ error: 'no_existe' }, 404);

    return json({ ok: true });
  } catch (e) {
    console.error('secciones delete', e);
    return json({ error: 'db' }, 500);
  }
}
