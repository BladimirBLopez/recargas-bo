import InstallCard from '@/components/InstallCard';
import { SITE_NAME } from '@/data/games';

export const metadata = { title: `Instalar ${SITE_NAME}` };

export default function AppPage() {
  return <InstallCard />;
}
