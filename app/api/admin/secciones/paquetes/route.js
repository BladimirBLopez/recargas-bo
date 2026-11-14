import { randomBytes } from 'node:crypto';
import { sql } from '@/lib/db';
import { isAdmin } from '@/lib/admin';
import { allGames } from '@/lib/games-state';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const json = (data, status = 200) =>
  Response.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });

export async function POST(req) {
  if (!(await isAdmin(req)))
    return json({ error: 'no_autorizado' }, 401);

  let b;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const slug = String(b?.slug || '');
  const sectionId = String(b?.sectionId || '');
  const label = String(b?.label || '').trim();
  const price = Math.round(Number(b?.price) * 100) / 100;

  if (!slug || !(sectionId === 'rec' || sectionId === 'pass' || /^sec-[0-9a-f-]{36}$/.test(sectionId))
    || !label || label.length > 40
    || !Number.isFinite(price)
    || price < 0.01 || price > 100000)
    return json({ error: 'datos_invalidos' }, 400);

  try {
    const game = (await allGames())
      .find(g => g.slug === slug);

    if (!game)
      return json({ error: 'juego_invalido' }, 400);

    if (game.packages.length >= 30)
      return json({ error: 'limite_paquetes' }, 400);

    if (game.packages.some(p =>
      p.label.trim().toLowerCase() === label.toLowerCase()
    )) return json({ error: 'nombre_repetido' }, 409);

    const q = sql();

    if (sectionId === 'rec' || sectionId === 'pass') {
      const name = sectionId === 'rec' ? 'Recargas' : 'Pases';
      const sort = sectionId === 'rec' ? -2 : -1;
      await q`
        INSERT INTO package_sections
          (game_slug, id, name, sort)
        VALUES (${slug}, ${sectionId}, ${name}, ${sort})
        ON CONFLICT (game_slug, id) DO NOTHING
      `;
    }

    const section = await q`
      SELECT id FROM package_sections
      WHERE game_slug = ${slug} AND id = ${sectionId}
    `;

    if (!section.length)
      return json({ error: 'seccion_invalida' }, 400);

    const suffix = randomBytes(8).toString('hex');
    const id = game.custom
      ? slug + '-' + suffix
      : 'cp-' + suffix;

    let result;

    if (game.custom) {
      const pack = JSON.stringify([{ id, label, price }]);

      result = await q`
        WITH updated AS (
          UPDATE custom_games
          SET packages = packages || ${pack}::jsonb
          WHERE slug = ${slug}
            AND jsonb_array_length(packages) < 30
          RETURNING slug
        )
        INSERT INTO package_section_links
          (game_slug, package_id, section_id)
        SELECT slug, ${id}, ${sectionId}
        FROM updated
        RETURNING package_id
      `;
    } else {
      result = await q`
        WITH created AS (
          INSERT INTO custom_packages
            (id, game_slug, label, price, sort)
          VALUES (
            ${id}, ${slug}, ${label}, ${price},
            (SELECT COALESCE(MAX(sort), 0) + 1
             FROM custom_packages
             WHERE game_slug = ${slug})
          )
          RETURNING id, game_slug
        )
        INSERT INTO package_section_links
          (game_slug, package_id, section_id)
        SELECT game_slug, id, ${sectionId}
        FROM created
        RETURNING package_id
      `;
    }

    if (!result.length)
      return json({ error: 'no_creado' }, 409);

    return json({ ok: true, id });
  } catch (e) {
    console.error('secciones paquete', e?.code || '');
    return json({ error: 'db' }, 500);
  }
}
