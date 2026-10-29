import { sql } from './db.js';

export async function getDetailBanner(slug) {
  try {
    const rows = await sql()`
      SELECT url, title, subtitle, chip_1, chip_2, chip_3
      FROM game_detail_banners
      WHERE slug = ${slug}
      LIMIT 1
    `;

    if (!rows.length) return null;

    const row = rows[0];

    return {
      url: row.url || null,
      title: row.title || null,
      subtitle: row.subtitle || null,
      chip1: row.chip_1 || null,
      chip2: row.chip_2 || null,
      chip3: row.chip_3 || null,
    };
  } catch (e) {
    console.error('game detail banner', e?.code || '', e?.message || '');
    return null;
  }
}
