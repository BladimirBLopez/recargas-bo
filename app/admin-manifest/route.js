import { SITE_NAME } from '@/data/games';

export const dynamic = 'force-static';

export function GET() {
  const body = {
    id: '/admin',
    name: SITE_NAME + ' Admin',
    short_name: 'Admin',
    description: 'Panel de administración de ' + SITE_NAME,
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es',
    background_color: '#08080c',
    theme_color: '#08080c',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
