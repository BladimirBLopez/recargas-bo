import AdminShell from '@/components/admin/AdminShell';

export const metadata = {
  title: 'Panel',
  manifest: '/admin-manifest',
  appleWebApp: { capable: true, title: 'Admin', statusBarStyle: 'black-translucent' },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }) {
  return <AdminShell>{children}</AdminShell>;
}
