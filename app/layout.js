import './globals.css';
import './theme.css';
import { Poppins, Barlow_Condensed } from 'next/font/google';
import { SITE_NAME } from '@/data/games';
import ShopFrame from '@/components/ShopFrame';
import { SettingsProvider } from '@/components/SettingsProvider';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

const font = Poppins({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], style: ['normal', 'italic'] });
const display = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], style: ['normal', 'italic'], variable: '--font-display' });

export const metadata = {
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
  metadataBase: new URL('https://recargas-bo.vercel.app'),
  icons: {
    icon: [{ url: '/icon-32.png', sizes: '32x32', type: 'image/png' }, { url: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
    apple: '/icon-180.png',
  },
  openGraph: {
    title: SITE_NAME,
    description: 'Recargas de juegos en Bolivia. Paga con QR, entrega rápida.',
    siteName: SITE_NAME,
    locale: 'es_BO',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
  title: `${SITE_NAME} | Recargas de juegos en Bolivia`,
  description:
    'Recarga diamantes y créditos de tus juegos favoritos en Bolivia. Paga con QR, entrega rápida.',
};

export const viewport = { themeColor: '#08080c', viewportFit: 'cover' };

const THEME_SCRIPT =
  "(function(){try{var t=localStorage.getItem('rb_theme');document.documentElement.dataset.theme=t==='light'?'light':'dark';}catch(e){document.documentElement.dataset.theme='dark';}})();";

export default async function RootLayout({ children }) {
  const settings = await getSettings();
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${font.className} ${display.variable} min-h-screen flex flex-col`}>
        <SettingsProvider value={settings}>
          <ShopFrame>{children}</ShopFrame>
        </SettingsProvider>
      </body>
    </html>
  );
}
