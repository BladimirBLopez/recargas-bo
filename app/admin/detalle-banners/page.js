import DetailBannerEditor from '@/components/admin/DetailBannerEditor';
import CatalogTabs from '@/components/admin/CatalogTabs';

export default function DetailBannersPage() {
  return (
    <div className="space-y-5">
      <CatalogTabs />
      <DetailBannerEditor />
    </div>
  );
}
