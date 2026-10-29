import { isAdmin } from '@/lib/admin';
import { cldConfig, signParams } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FOLDERS = { banners: 'recargas-bo/banners', games: 'recargas-bo/games' };

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req) {
  if (!isAdmin(req)) return json({ error: 'no_autorizado' }, 401);
  const c = cldConfig();
  if (!c) return json({ error: 'cloudinary_no_configurado' }, 500);
  let body = null;
  try {
    body = await req.json();
  } catch {}
  const folder = FOLDERS[body?.folder] || FOLDERS.banners;
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signParams({ asset_folder: folder, public_id_prefix: folder, timestamp }, c.apiSecret);
  return json({ cloudName: c.cloudName, apiKey: c.apiKey, timestamp, folder, signature });
}
