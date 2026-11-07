import { sql } from '@/lib/db';
import { WHATSAPP } from '@/data/games';
import { cldConfig } from '@/lib/cloudinary';
import { cleanSocials } from '@/lib/socials';

export async function getSettings() {
  const out = { whatsapp: WHATSAPP, notice: '', payment_qr: '/qr-pago.png', socials: {} };
  try {
    const rows = await sql()`SELECT key, value FROM app_settings WHERE key IN ('whatsapp','notice','payment_qr','socials')`;
    for (const r of rows) {
      if (r.key === 'whatsapp' && r.value) out.whatsapp = r.value;
      if (r.key === 'notice') out.notice = r.value || '';
      if (r.key === 'socials') {
        try {
          out.socials = cleanSocials(JSON.parse(r.value)).clean;
        } catch {}
      }
      if (r.key === 'payment_qr' && typeof r.value === 'string') {
        try {
          const u = new URL(r.value);
          const cloud = cldConfig()?.cloudName;
          const prefix = '/' + cloud + '/image/upload/';
          if (cloud && u.protocol === 'https:' &&
              u.hostname === 'res.cloudinary.com' &&
              !u.username && !u.password &&
              !u.search && !u.hash &&
              u.pathname.startsWith(prefix) &&
              /^(?:v[0-9]+\/)?recargas-bo\/payments\/[a-zA-Z0-9_/-]+\.(?:png|jpg|jpeg|webp)$/.test(u.pathname.slice(prefix.length))) {
            out.payment_qr = r.value;
          }
        } catch {}
      }
    }
  } catch (e) {}
  return out;
}
