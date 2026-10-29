'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MdTune, MdSell, MdImage, MdViewCarousel } from 'react-icons/md';

const TABS = [
  ['/admin/ajustes', 'General', MdTune],
  ['/admin/juegos', 'Precios', MdSell],
  ['/admin/servicios', 'Servicios', MdImage],
  ['/admin/banners', 'Banners', MdViewCarousel],
];

export default function CatalogTabs() {
  const path = usePathname() || '';
  return (
    <div className="mb-4">
      <h1 className="text-xl font-semibold">Ajustes</h1>
      <p className="mb-3 text-sm text-white/50">Tienda, precios e imágenes</p>
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-zinc-950/80 p-1">
        {TABS.map(([href, label, Icon]) => {
          const on = path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={
                'relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-bold transition active:scale-95 ' +
                (on ? 'bg-yellow-300/15 text-yellow-300 ring-1 ring-yellow-300/30' : 'text-white/55')
              }
            >
              <Icon className="text-xl" />
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
