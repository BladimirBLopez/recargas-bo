'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { MdSearch, MdClose, MdPerson } from 'react-icons/md';
import { SITE_NAME } from '@/data/games';
import { useUser } from '@/components/useUser';
import ThemeToggle from '@/components/ThemeToggle';

export default function Header() {
  const path = usePathname() || '/';
  const router = useRouter();
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');

  // La barra de búsqueda abierta hace el header más alto; las pestañas se ajustan con --hh.
  useEffect(() => {
    document.documentElement.style.setProperty('--hh', open ? '126px' : '62px');
  }, [open]);

  // Avisa al inicio (GameSearch) qué se está buscando.
  useEffect(() => {
    const t = setTimeout(
      () => window.dispatchEvent(new CustomEvent('rb-q', { detail: open ? q : '' })),
      0
    );
    return () => clearTimeout(t);
  }, [q, open, path]);

  const toggle = () => {
    if (open) {
      setOpen(false);
      setQ('');
      return;
    }
    setOpen(true);
    if (path !== '/') router.push('/');
  };

  const onChange = (e) => {
    setQ(e.target.value);
    if (path !== '/') router.push('/');
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-yellow-300 bg-black/90 shadow-[0_6px_24px_-8px_rgb(var(--accent)/0.6)] backdrop-blur">
      <div className="mx-auto flex h-[60px] max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
          <img src="/logo-header.png" alt={SITE_NAME} height="40" className="h-10 w-auto shrink-0" />
        </Link>

        <button
          onClick={toggle}
          aria-label="Buscar"
          className={
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl border-2 transition active:scale-95 ' +
            (open
              ? 'border-yellow-300 bg-yellow-300/10 text-yellow-300'
              : 'border-white/10 bg-zinc-950 text-white')
          }
        >
          <MdSearch size={22} />
        </button>

        <ThemeToggle className="h-9 w-9 rounded-xl border-2 border-white/10 bg-zinc-950 text-white" />

        <Link
          href="/perfil"
          className="flex shrink-0 items-center gap-2 rounded-xl border-2 border-yellow-300 bg-zinc-950 py-0.5 pl-1 pr-2.5"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15 text-white/70">
            {user ? (
              <span className="font-display text-sm font-extrabold text-yellow-300">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <MdPerson size={20} />
            )}
          </span>
          <span className="leading-tight">
            <span className="block max-w-[84px] truncate text-xs font-bold">{user ? user.name.split(' ')[0] : 'Invitado'}</span>
            <span className="block text-[10px] text-white/60">{user ? 'Mi cuenta' : 'Ingresar'}</span>
          </span>
        </Link>
      </div>

      {open && (
        <div className="mx-auto max-w-5xl px-4 pb-3">
          <div className="flex h-12 items-center gap-3 rounded-2xl border-2 border-yellow-300 bg-zinc-950 px-4 shadow-[0_0_16px_-4px_rgb(var(--accent)/0.6)]">
            <MdSearch size={22} className="shrink-0 text-white/70" />
            <input
              autoFocus
              value={q}
              onChange={onChange}
              placeholder="Buscar juego…"
              className="w-full bg-transparent text-base outline-none placeholder:text-white/50"
            />
            <button
              aria-label="Cerrar búsqueda"
              onClick={toggle}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10"
            >
              <MdClose size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
