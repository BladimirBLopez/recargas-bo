'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  MdTune, MdSell, MdImage,
  MdViewCarousel, MdSettings
} from 'react-icons/md';

const TABS = [
  ['/admin/juegos', 'Juegos', MdSell],
  ['/admin/servicios', 'Servicios', MdImage],
  ['/admin/banners', 'Portada', MdViewCarousel],
];

export default function CatalogTabs() {
  const path = usePathname() || '';

  return (
    <section className="mb-6 space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-[#123D64] via-[#102B4B] to-[#09192E] p-5 shadow-xl shadow-black/20">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#00D9FF] to-[#007BFF] text-slate-950 shadow-lg shadow-cyan-500/20">
            <MdSettings className="text-2xl" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-extrabold tracking-tight text-white">
              Centro de administración
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Gestiona juegos, precios, servicios y publicidad desde un solo lugar.
            </p>
          </div>
        </div>
      </div>

      <nav aria-label="Secciones de configuración" className="grid grid-cols-4 gap-2">
        {TABS.map(([href, label, Icon]) => {
          const on = path === href || path.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              aria-current={on ? 'page' : undefined}
              className={
                'flex min-w-0 flex-col items-center justify-center gap-2 rounded-xl border px-1 py-3 text-[11px] font-bold transition-all duration-200 active:scale-95 sm:flex-row sm:px-3 sm:text-sm ' +
                (on
                  ? 'border-cyan-300/70 bg-gradient-to-br from-[#00D9FF] to-[#007BFF] text-slate-950 shadow-lg shadow-cyan-500/20'
                  : 'border-white/10 bg-[#10223B]/80 text-slate-300 hover:border-cyan-400/40 hover:bg-[#163554]')
              }
            >
              <Icon className="shrink-0 text-xl" />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
