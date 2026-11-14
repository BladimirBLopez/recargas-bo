import { sql } from './db.js';

export async function loadPackageSections() {
  const sections = new Map();
  const assignments = new Map();

  try {
    const q = sql();

    const [rows, links] = await Promise.all([
      q`
        SELECT game_slug, id, name, sort, active
        FROM package_sections
        ORDER BY game_slug, sort, id
      `,
      q`
        SELECT game_slug, package_id, section_id
        FROM package_section_links
      `
    ]);

    for (const row of rows) {
      if (!sections.has(row.game_slug)) {
        sections.set(row.game_slug, []);
      }
      sections.get(row.game_slug).push(row);
    }

    for (const row of links) {
      if (!assignments.has(row.game_slug)) {
        assignments.set(row.game_slug, new Map());
      }
      assignments.get(row.game_slug).set(
        row.package_id,
        row.section_id
      );
    }

  } catch (e) {
    console.error(
      'package-sections error',
      e?.code || '',
      e?.message || ''
    );
    throw e;
  }

  return { sections, assignments };
}
