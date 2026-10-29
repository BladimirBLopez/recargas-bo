import { sql } from '@/lib/db';
import { thumb } from '@/lib/cloudinary';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const rows = await sql()`SELECT url FROM banners WHERE active ORDER BY position, id`;
    return Response.json({ banners: rows.map((r) => ({ url: thumb(r.url, 1000) })) }, { headers });
  } catch (e) {
    return Response.json({ banners: [] }, { headers });
  }
}
