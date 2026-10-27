import { sql } from '@/lib/db';
import { WHATSAPP } from '@/data/games';

export async function getSettings() {
  const out = { whatsapp: WHATSAPP, notice: '' };
  try {
    const rows = await sql()`SELECT key, value FROM app_settings WHERE key IN ('whatsapp','notice')`;
    for (const r of rows) {
      if (r.key === 'whatsapp' && r.value) out.whatsapp = r.value;
      if (r.key === 'notice') out.notice = r.value || '';
    }
  } catch (e) {}
  return out;
}
