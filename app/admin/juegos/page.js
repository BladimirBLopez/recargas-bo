'use client';
import AdminGames from '@/components/AdminGames';
import CatalogTabs from '@/components/admin/CatalogTabs';
import Link from 'next/link';

export default function JuegosPage() {
  return (
    <div>
      <CatalogTabs />
      <Link
        href="/admin/detalle-banners"
        className="mb-4 block rounded-2xl border border-cyan-400/30 bg-gradient-to-r from-[#123E60] to-[#102B49] px-4 py-4 text-center text-sm font-extrabold text-cyan-100"
      >
        Personalizar banners de cada juego
      </Link>
      <AdminGames />
    </div>
  );
}
