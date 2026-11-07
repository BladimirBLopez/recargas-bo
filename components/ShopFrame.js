'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SITE_NAME } from '@/data/games';
import { useSettings } from '@/components/SettingsProvider';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import SalesToast from '@/components/SalesToast';
import { NETWORKS } from '@/lib/socials';
import { SOCIAL_ICONS } from '@/components/SocialIcons';

export default function ShopFrame({ children }) {
  const path = usePathname() || '/';
  const { whatsapp, notice, socials } = useSettings();
  const links = NETWORKS.filter((n) => socials && socials[n.key]);
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
          {links.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              {links.map((n) => {
                const Icon = SOCIAL_ICONS[n.key];
                return (
                  <a
                    key={n.key}
                    href={socials[n.key]}
                    target="_blank"
                    rel="noopener noreferrer me"
                    aria-label={n.label}
                    title={n.label}
                    className="grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:-translate-y-0.5 hover:border-yellow-300/60 hover:text-yellow-300 hover:shadow-[0_0_14px_-2px_rgb(var(--accent)/0.7)]"
                  >
                    <Icon size={18} />
                  </a>
                );
              })}
            </div>
          )}
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
