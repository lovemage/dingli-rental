import PasswordForm from '@/components/admin/PasswordForm';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const me = await getCurrentAdmin();
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">帳號設定</h1>
        <p className="text-ink-500 text-sm">目前登入：<span className="font-bold">{me?.username}</span></p>
      </div>
      <PasswordForm />
    </div>
  );
}
