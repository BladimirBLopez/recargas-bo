import { SITE_NAME } from '@/data/games';

export default function manifest() {
  return {
    name: SITE_NAME + ' | Recargas de juegos en Bolivia',
    short_name: SITE_NAME,
    description: 'Recarga diamantes y créditos de tus juegos favoritos. Paga con QR, entrega rápida.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    lang: 'es',
    background_color: '#08080c',
    theme_color: '#13a0af',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
