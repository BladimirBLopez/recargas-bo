import { getSettings } from '@/lib/settings';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { payment_qr } = await getSettings();

  if (!payment_qr || payment_qr === '/qr-pago.png') {
    const data = await readFile(join(process.cwd(), 'public/qr-pago.png'));
    return new Response(data, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="qr-pago.png"',
        'Cache-Control': 'no-store',
      },
    });
  }

  try {
    const r = await fetch(payment_qr, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    if (!r.ok) throw new Error('qr_no_disponible');

    const type = r.headers.get('content-type') || '';
    if (!type.startsWith('image/')) throw new Error('tipo_invalido');

    const data = await r.arrayBuffer();
    if (data.byteLength > 5 * 1024 * 1024) {
      throw new Error('qr_demasiado_grande');
    }

    return new Response(data, {
      headers: {
        'Content-Type': type,
        'Content-Disposition': 'attachment; filename="qr-pago.png"',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    const data = await readFile(join(process.cwd(), 'public/qr-pago.png'));
    return new Response(data, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="qr-pago.png"',
        'Cache-Control': 'no-store',
      },
    });
  }
}
