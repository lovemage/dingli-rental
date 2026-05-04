import Link from 'next/link';
import MaterialIcon from '@/components/admin/MaterialIcon';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">儀表板</h1>
        <p className="text-ink-500 text-sm">歡迎回到鼎立租售管理 後台</p>
      </div>

      <div className="admin-card">
        <h2 className="font-bold text-lg mb-4">快速操作</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction href="/admin/properties/new" icon="add_circle" label="新增物件" />
          <QuickAction href="/admin/properties" icon="list_alt" label="物件列表" />
          <QuickAction href="/admin/hero" icon="imagesmode" label="輪播管理" />
          <QuickAction href="/admin/settings" icon="lock" label="修改密碼" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link href={href} className="border border-line rounded-lg p-4 hover:border-brand-green-500 hover:bg-brand-green-50/50 transition flex items-center gap-3">
      <MaterialIcon name={icon} className="text-3xl text-ink-700" />
      <span className="font-medium text-ink-900">{label}</span>
    </Link>
  );
}
