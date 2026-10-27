'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { MdHome, MdHistory, MdAccountBalanceWallet, MdFileDownload, MdPerson } from 'react-icons/md';
import { FaWhatsapp } from 'react-icons/fa';
import { useSettings } from '@/components/SettingsProvider';
import { useInstall } from '@/components/useInstall';

const ITEMS = [
  { href: '/', label: 'Inicio', Icon: MdHome },
  { href: '/historial', label: 'Historial', Icon: MdHistory },
  { href: '/depositar', label: 'Depositar', Icon: MdAccountBalanceWallet },
  { href: '/app', label: 'App', Icon: MdFileDownload },
  { href: '/perfil', label: 'Perfil', Icon: MdPerson },
];

export default function BottomNav() {
  const path = usePathname() || '/';
  const { whatsapp } = useSettings();
  const { canInstall, install } = useInstall();
  if (path.startsWith('/juego') || path.startsWith('/admin')) return null;
  return (
    <>
      <a
        href={'https://wa.me/' + whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp"
        className="fixed bottom-20 right-4 z-20 grid h-12 w-12 place-items-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/30 transition active:scale-95"
      >
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-green-500/40" />
        <FaWhatsapp size={26} />
      </a>
      <nav className="fixed inset-x-3 bottom-3 z-20 mx-auto flex max-w-md gap-1 rounded-3xl border border-yellow-300/30 bg-zinc-950/95 p-1 shadow-[0_0_24px_-6px_rgb(var(--accent)/0.5)] backdrop-blur">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = path === href;
          const isApp = href === '/app';
          const text = isApp && canInstall ? 'Instalar' : label;
          return (
            <Link
              key={href}
              href={href}
              onClick={(e) => {
                if (isApp && canInstall) {
                  e.preventDefault();
                  install();
                }
              }}
              className="relative flex flex-1 flex-col items-center rounded-2xl px-1 py-1.5 font-display text-xs font-bold uppercase tracking-wide transition active:scale-95"
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  className="absolute inset-0 rounded-2xl bg-yellow-300/15 ring-1 ring-yellow-300/30"
                />
              )}
              <span
                className={
                  'relative z-10 flex flex-col items-center gap-0.5 transition-colors ' +
                  (active ? 'text-yellow-300' : isApp && canInstall ? 'text-yellow-300' : 'text-white/55')
                }
              >
                <Icon size={24} />
                {text}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
