'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, History, Wallet, Download, User, MessageCircle } from 'lucide-react';
import { WHATSAPP } from '@/data/games';

const ITEMS = [
  { href: '/', label: 'Inicio', Icon: House },
  { href: '/historial', label: 'Historial', Icon: History },
  { href: '/depositar', label: 'Depositar', Icon: Wallet },
  { href: '/app', label: 'App', Icon: Download },
  { href: '/perfil', label: 'Perfil', Icon: User },
];

export default function BottomNav() {
  const path = usePathname() || '/';
  if (path.startsWith('/juego') || path.startsWith('/admin')) return null;
  const item = (active) =>
    'flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 font-display text-sm font-bold uppercase tracking-wide transition ' +
    (active ? 'bg-yellow-300/15 text-yellow-300' : 'text-white/55');
  return (
    <>
      <a
        href={'https://wa.me/' + WHATSAPP}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition active:scale-95"
      >
        <MessageCircle size={28} />
      </a>
      <nav className="fixed inset-x-3 bottom-3 z-20 mx-auto flex max-w-md gap-1 rounded-3xl border border-yellow-300/30 bg-zinc-950/95 p-1.5 shadow-[0_0_24px_-6px_rgb(var(--accent)/0.5)] backdrop-blur">
        {ITEMS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={item(path === href)}>
            <Icon size={22} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
