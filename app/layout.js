import './globals.css';
import Link from 'next/link';
import { Poppins, Barlow_Condensed } from 'next/font/google';
import { SITE_NAME, WHATSAPP } from '@/data/games';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import SalesToast from '@/components/SalesToast';

const font = Poppins({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], style: ['normal', 'italic'] });
const display = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], style: ['normal', 'italic'], variable: '--font-display' });

export const metadata = {
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
  icons: { icon: '/icono/192', apple: '/icono/180' },
  title: `${SITE_NAME} | Recargas de juegos en Bolivia`,
  description:
    'Recarga diamantes y créditos de tus juegos favoritos en Bolivia. Paga con QR, entrega rápida.',
};

export const viewport = { themeColor: '#08080c', viewportFit: 'cover' };

export default function RootLayout({ children }) {
  const wa = `https://wa.me/${WHATSAPP}`;
  return (
    <html lang="es">
      <body className={`${font.className} ${display.variable} min-h-screen flex flex-col`}>
        <Header />
        <SalesToast />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>

        <footer className="border-t border-yellow-300/30 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-32">
          <div className="max-w-5xl mx-auto">
            <div className="text-xl font-bold">{SITE_NAME}</div>
            <p className="text-white/60">Recargas de juegos en Bolivia, rápidas y seguras.</p>
            <a href={wa} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-green-400">
              Escríbenos por WhatsApp
            </a>
            <nav className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/60">
              {[['/terminos', 'Términos'], ['/privacidad', 'Privacidad'], ['/garantias', 'Garantías'], ['/ayuda', 'Ayuda']].map(([h, t]) => (
                <Link key={h} href={h} className="hover:text-white">{t}</Link>
              ))}
            </nav>
            <p className="mt-6 text-center text-xs text-white/40">
              © {new Date().getFullYear()} {SITE_NAME}. Todos los derechos reservados.
            </p>
          </div>
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
