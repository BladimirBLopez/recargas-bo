import './globals.css';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { SITE_NAME, WHATSAPP } from '@/data/games';

const font = Poppins({ subsets: ['latin'], weight: ['400', '600', '700', '800', '900'], style: ['normal', 'italic'] });

export const metadata = {
  title: `${SITE_NAME} | Recargas de juegos en Bolivia`,
  description:
    'Recarga diamantes y créditos de tus juegos favoritos en Bolivia. Paga con QR, entrega rápida.',
};

export default function RootLayout({ children }) {
  const wa = `https://wa.me/${WHATSAPP}`;
  return (
    <html lang="es">
      <body className={`${font.className} min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-10 bg-black border-b border-white/10 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="text-2xl font-black italic tracking-tight text-yellow-300">
              {SITE_NAME.toUpperCase()}
            </Link>
            <a
              href={wa}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-yellow-300 text-black font-bold px-4 py-2 text-sm"
            >
              🎧 Soporte
            </a>
          </div>
        </header>

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">{children}</main>

        <footer className="border-t border-white/10 px-4 py-8 text-sm text-white/60">
          <div className="max-w-5xl mx-auto grid gap-6 sm:grid-cols-3">
            <div>
              <div className="font-black italic text-yellow-300 mb-2">{SITE_NAME.toUpperCase()}</div>
              <p>Recargas para tus juegos favoritos en Bolivia.</p>
            </div>
            <div>
              <div className="font-semibold text-white mb-2">Soporte</div>
              <a href={wa} target="_blank" rel="noreferrer" className="underline">
                Escríbenos por WhatsApp
              </a>
            </div>
            <div>
              <div className="font-semibold text-white mb-2">Métodos de pago</div>
              <span className="inline-block rounded-lg border border-white/20 px-3 py-1">
                QR bancario
              </span>
            </div>
          </div>
          <p className="text-center text-white/40 mt-8">
            © {new Date().getFullYear()} {SITE_NAME} · Bolivia
          </p>
        </footer>
      </body>
    </html>
  );
}
