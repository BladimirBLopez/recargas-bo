'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdHome, MdHistory, MdAccountBalanceWallet, MdFileDownload, MdPerson } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { WHATSAPP } from '@/data/games';

const ITEMS = [
  { href: '/', label: 'Inicio', Icon: MdHome },
  { href: '/historial', label: 'Historial', Icon: MdHistory },
  { href: '/depositar', label: 'Depositar', Icon: MdAccountBalanceWallet },
  { href: '/app', label: 'App', Icon: MdFileDownload },
  { href: '/perfil', label: 'Perfil', Icon: MdPerson },
];

export default function BottomNav() {
  const path = usePathname() || '/';
  if (path.startsWith('/juego') || path.startsWith('/admin')) return null;
  const item = (active) =>
    'flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 font-display text-xs font-bold uppercase tracking-wide transition ' +
    (active ? 'bg-yellow-300/15 text-yellow-300' : 'text-white/55');
  return (
    <>
      <a
        href={'https://wa.me/' + WHATSAPP}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-20 right-4 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition active:scale-95"
      >
        <FaWhatsapp size={26} />
      </a>
      <nav className="fixed inset-x-3 bottom-3 z-20 mx-auto flex max-w-md gap-1 rounded-3xl border border-yellow-300/30 bg-zinc-950/95 p-1 shadow-[0_0_24px_-6px_rgb(var(--accent)/0.5)] backdrop-blur">
        {ITEMS.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={item(path === href)}>
            <Icon size={24} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
