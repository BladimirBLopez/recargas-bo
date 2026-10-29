'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  ['/admin/juegos', 'Precios y estado'],
  ['/admin/servicios', 'Servicios y fotos'],
  ['/admin/banners', 'Banners'],
];

export default function CatalogTabs() {
  const path = usePathname() || '';
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto">
      {TABS.map(([href, label]) => (
        <Link
          key={href}
          href={href}
          className={
            'shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ' +
            (path.startsWith(href)
              ? 'bg-gradient-to-r from-yellow-300 to-orange-400 text-black'
              : 'border border-white/10 bg-white/5 text-white/70')
          }
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
