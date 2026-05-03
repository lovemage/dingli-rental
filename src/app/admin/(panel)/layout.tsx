import { redirect } from 'next/navigation';
import { getCurrentAdmin } from '@/lib/auth';
import AdminShell from '@/components/admin/AdminShell';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentAdmin();
  if (!me) redirect('/admin/login');
  return <AdminShell username={me.username}>{children}</AdminShell>;
}
