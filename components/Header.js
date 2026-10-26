'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, User, Zap } from 'lucide-react';
import { SITE_NAME } from '@/data/games';

export default function Header() {
  const path = usePathname() || '/';
  const router = useRouter();

  const openSearch = () => {
    if (path === '/') window.dispatchEvent(new Event('rb-search'));
    else router.push('/?buscar=1');
  };

  return (
    <header className="sticky top-0 z-30 border-b-2 border-yellow-300 bg-black/90 shadow-[0_6px_24px_-8px_rgb(var(--accent)/0.6)] backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-5xl items-center gap-2 px-4">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-yellow-300 to-red-500 text-black">
            <Zap size={22} fill="currentColor" />
          </span>
          <span className="truncate font-display text-2xl font-extrabold italic uppercase tracking-tight text-sky-500 sm:text-3xl">
            {SITE_NAME}
          </span>
        </Link>

        <button
          onClick={openSearch}
          aria-label="Buscar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-zinc-950 active:scale-95 transition"
        >
          <Search size={20} />
        </button>

        <Link
          href="/perfil"
          className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-yellow-300 bg-zinc-950 py-1 pl-1.5 pr-3"
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white/70">
            <User size={20} />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold">Invitado</span>
            <span className="block text-xs text-white/60">Ingresar</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
