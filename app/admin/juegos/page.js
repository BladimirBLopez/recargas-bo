'use client';
import AdminGames from '@/components/AdminGames';
import CatalogTabs from '@/components/admin/CatalogTabs';

export default function JuegosPage() {
  return (
    <div>
      <CatalogTabs />
      <AdminGames />
    </div>
  );
}
