import './globals.css';
import { Poppins, Barlow_Condensed } from 'next/font/google';
import { SITE_NAME, WHATSAPP } from '@/data/games';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';

const font = Poppins({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], style: ['normal', 'italic'] });
const display = Barlow_Condensed({ subsets: ['latin'], weight: ['500', '600', '700', '800'], style: ['normal', 'italic'], variable: '--font-display' });

export const metadata = {
  title: `${SITE_NAME} | Recargas de juegos en Bolivia`,
  description:
    'Recarga diamantes y créditos de tus juegos favoritos en Bolivia. Paga con QR, entrega rápida.',
};

export default function RootLayout({ children }) {
  const wa = `https://wa.me/${WHATSAPP}`;
  return (
    <html lang="es">
      <body className={`${font.className} ${display.variable} min-h-screen flex flex-col`}>
        <Header />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>

        <footer className="border-t border-white/10 px-4 pt-8 pb-32">
          <div className="max-w-5xl mx-auto">
            <div className="text-xl font-bold">{SITE_NAME}</div>
            <p className="text-white/60">Recargas de juegos en Bolivia, rápidas y seguras.</p>
            <a href={wa} target="_blank" rel="noreferrer" className="mt-1 inline-block font-semibold text-green-400">
              Escríbenos por WhatsApp
            </a>
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
