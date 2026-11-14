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

export async function PATCH(req) {
  if (!(await isAdmin(req)))
    return json({ error: 'no_autorizado' }, 401);

  let b;
  try {
    b = await req.json();
  } catch {
    return json({ error: 'json_invalido' }, 400);
  }

  const slug = String(b?.slug || '');
  const packageId = String(b?.packageId || '');
  const sectionId = b?.sectionId;

  if (
    !slug || !packageId ||
    !(sectionId === null ||
      (typeof sectionId === 'string' && sectionId))
  ) {
    return json({ error: 'datos_invalidos' }, 400);
  }

  try {
    const game = (await allGames())
      .find(g => g.slug === slug);

    if (!game || !game.packages.some(
      p => p.id === packageId
    )) {
      return json({ error: 'paquete_invalido' }, 400);
    }

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

    if (sectionId === null) {
      await q`
        DELETE FROM package_section_links
        WHERE game_slug = ${slug}
          AND package_id = ${packageId}
      `;
    } else {
      const section = await q`
        SELECT id FROM package_sections
        WHERE game_slug = ${slug}
          AND id = ${sectionId}
        LIMIT 1
      `;

      if (!section.length)
        return json({ error: 'seccion_invalida' }, 400);

      await q`
        INSERT INTO package_section_links
          (game_slug, package_id, section_id)
        VALUES (${slug}, ${packageId}, ${sectionId})
        ON CONFLICT (game_slug, package_id)
        DO UPDATE SET section_id = EXCLUDED.section_id
      `;
    }

    return json({ ok: true });
  } catch (e) {
    console.error('asignar paquete error', e);
    return json({ error: 'db' }, 500);
  }
}
