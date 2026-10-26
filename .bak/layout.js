import './globals.css';
import Link from 'next/link';
import { SITE_NAME } from '@/data/games';

export const metadata = {
  title: `${SITE_NAME} | Recargas de juegos en Bolivia`,
  description:
    'Recarga diamantes y créditos de tus juegos favoritos en Bolivia. Paga con QR, entrega rápida.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-white/10 px-4 py-3">
          <Link href="/" className="text-xl font-bold text-white">
            🎮 {SITE_NAME}
          </Link>
        </header>
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">{children}</main>
        <footer className="border-t border-white/10 px-4 py-4 text-center text-sm text-white/50">
          © {new Date().getFullYear()} {SITE_NAME} · Bolivia
        </footer>
      </body>
    </html>
  );
}
