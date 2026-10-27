'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_NAME } from '@/data/games';
import { useSettings } from '@/components/SettingsProvider';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import SalesToast from '@/components/SalesToast';

export default function ShopFrame({ children }) {
  const path = usePathname() || '/';
  const { whatsapp, notice } = useSettings();
  if (path.startsWith('/admin')) return children;
  const wa = `https://wa.me/${whatsapp}`;
  return (
    <>
      <Header />
      <SalesToast />
      {notice && (
        <div className="border-b border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-center text-sm font-semibold text-yellow-300">
          {notice}
        </div>
      )}

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
    </>
  );
}
