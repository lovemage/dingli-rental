import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import MaterialIcon from '@/components/admin/MaterialIcon';

export default async function AdminDashboard() {
  let stats = { total: 0, active: 0, inactive: 0, slides: 0 };
  try {
    const [total, active, inactive, slides] = await Promise.all([
      prisma.property.count(),
      prisma.property.count({ where: { status: 'active' } }),
      prisma.property.count({ where: { status: 'inactive' } }),
      prisma.heroSlide.count(),
    ]);
    stats = { total, active, inactive, slides };
  } catch {
    // DB 尚未連線時的預設值
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">儀表板</h1>
        <p className="text-ink-500 text-sm">歡迎回到鼎立租售管理 後台</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="物件總數" num={stats.total} icon="home_work" />
        <StatCard title="已上架" num={stats.active} icon="check_circle" color="text-brand-green-700" />
        <StatCard title="已下架" num={stats.inactive} icon="pause_circle" color="text-ink-500" />
        <StatCard title="輪播圖" num={stats.slides} icon="imagesmode" color="text-brand-orange-700" />
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

      <div className="admin-card">
        <h2 className="font-bold text-lg mb-2">資料庫修改提示</h2>
        <p className="text-sm text-ink-700 mb-2">
          專案使用 Prisma ORM。若需新增表格或欄位，請編輯 <code className="bg-paper-2 px-1.5 py-0.5 rounded">prisma/schema.prisma</code>，然後執行：
        </p>
        <pre className="bg-ink-900 text-white text-xs p-3 rounded-lg overflow-x-auto">npx prisma db push</pre>
        <p className="text-xs text-ink-500 mt-2">
          連線 URL 設定於 <code className="bg-paper-2 px-1 py-0.5 rounded">.env</code> 的 <code>DATABASE_URL</code>。Railway 部署時會自動注入。
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, num, icon, color = 'text-ink-900' }: { title: string; num: number; icon: string; color?: string }) {
  return (
    <div className="admin-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-500 mb-1">{title}</p>
          <p className={`text-3xl font-black ${color}`}>{num}</p>
        </div>
        <MaterialIcon name={icon} className="text-4xl text-ink-500" />
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
