'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, History, Headset } from 'lucide-react';
import { WHATSAPP } from '@/data/games';

const ITEMS = [
  { href: '/', label: 'Inicio', Icon: House },
  { href: '/historial', label: 'Historial', Icon: History },
];

export default function BottomNav() {
  const path = usePathname() || '/';
  if (path.startsWith('/juego') || path.startsWith('/admin')) return null;
  const item = (active) =>
    'flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-extrabold uppercase tracking-wide transition ' +
    (active ? 'bg-yellow-300/15 text-yellow-300' : 'text-white/50');
  return (
    <nav className="fixed inset-x-3 bottom-3 z-20 mx-auto flex max-w-md gap-1 rounded-3xl border border-white/10 bg-zinc-900/95 p-1.5 shadow-lg backdrop-blur">
      {ITEMS.map(({ href, label, Icon }) => (
        <Link key={href} href={href} className={item(path === href)}>
          <Icon size={22} />
          {label}
        </Link>
      ))}
      <a href={'https://wa.me/' + WHATSAPP} target="_blank" rel="noreferrer" className={item(false)}>
        <Headset size={22} />
        Soporte
      </a>
    </nav>
  );
}
