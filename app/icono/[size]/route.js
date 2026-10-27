import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

const SIZES = [180, 192, 512];

export async function GET(req, { params }) {
  const { size } = await params;
  const n = Number(size);
  if (!SIZES.includes(n)) return new Response('no encontrado', { status: 404 });
  const maskable = new URL(req.url).searchParams.get('m') === '1';
  const glyph = Math.round(n * (maskable ? 0.5 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #13a0af, #0e7490)',
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24">
          <path d="M13 2L4 14h6l-1 8 9-12h-6z" fill="#ffffff" />
        </svg>
      </div>
    ),
    {
      width: n,
      height: n,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    }
  );
}
