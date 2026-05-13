import Link from 'next/link';
import MaterialIcon from '@/components/admin/MaterialIcon';
import { prisma } from '@/lib/prisma';
import { parseMonthRange } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

async function getSiteVisitStats() {
  try {
    const monthStr = currentMonthStr();
    const range = parseMonthRange(monthStr);
    const [thisMonth, total] = await Promise.all([
      range
        ? prisma.siteVisit.count({ where: { day: { gte: range.start, lt: range.end } } })
        : Promise.resolve(0),
      prisma.siteVisit.count(),
    ]);
    return { monthStr, thisMonth, total };
  } catch {
    return { monthStr: currentMonthStr(), thisMonth: 0, total: 0 };
  }
}

export default async function AdminDashboard() {
  const { monthStr, thisMonth, total } = await getSiteVisitStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">儀表板</h1>
        <p className="text-ink-500 text-sm">歡迎回到鼎立租售管理 後台</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <KpiCard
          icon="visibility"
          label={`首頁訪客 · 本月 (${monthStr})`}
          value={thisMonth.toLocaleString()}
          hint="同 IP 同一天計 1 次"
          tone="green"
        />
        <KpiCard
          icon="trending_up"
          label="首頁訪客 · 累積總計"
          value={total.toLocaleString()}
          hint="自 2026-05 起算"
          tone="orange"
        />
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

function KpiCard({
  icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: string;
  label: string;
  value: string;
  hint: string;
  tone: 'green' | 'orange';
}) {
  const toneClass =
    tone === 'green'
      ? 'bg-brand-green-50 text-brand-green-700'
      : 'bg-brand-orange-50 text-brand-orange-700';
  return (
    <div className="admin-card">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 rounded-lg ${toneClass} grid place-items-center`}>
          <MaterialIcon name={icon} className="!text-2xl" />
        </div>
        <p className="text-xs font-bold text-ink-500">{label}</p>
      </div>
      <p className="text-3xl font-black text-ink-900">{value}</p>
      <p className="text-xs text-ink-400 mt-1">{hint}</p>
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
