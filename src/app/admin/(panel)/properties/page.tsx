import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isPropertyCode, normalizePropertyCode } from '@/lib/property-code';
import { availableMonths, parseMonthRange } from '@/lib/tracking';

export const dynamic = 'force-dynamic';

type SearchParams = { q?: string; month?: string };

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function AdminPropertiesList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const monthStr = (sp.month || '').trim() || currentMonthStr();
  const monthRange = parseMonthRange(monthStr);
  const months = availableMonths();

  // 編號精準查找：admin 直接跳該物件編輯頁
  if (q && isPropertyCode(q)) {
    const hit = await prisma.property
      .findUnique({ where: { code: normalizePropertyCode(q) }, select: { id: true } })
      .catch(() => null);
    if (hit) redirect(`/admin/properties/${hit.id}/edit`);
  }

  // 一般 keyword：搜 title / community / district / 編號
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: 'insensitive' as const } },
          { community: { contains: q, mode: 'insensitive' as const } },
          { district: { contains: q, mode: 'insensitive' as const } },
          { code: { contains: q.toUpperCase(), mode: 'insensitive' as const } },
        ],
      }
    : {};

  let items: any[] = [];
  let loadError = '';
  try {
    items = await prisma.property.findMany({
      where,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (e: any) {
    loadError = e?.message || '物件讀取失敗';
  }

  // 瀏覽次數（兩組）：本月 + 累積總計
  const viewMonthByProperty = new Map<number, number>();
  const viewTotalByProperty = new Map<number, number>();
  try {
    if (monthRange) {
      const monthRows = await prisma.propertyView.groupBy({
        by: ['propertyId'],
        where: { day: { gte: monthRange.start, lt: monthRange.end } },
        _count: { _all: true },
      });
      for (const r of monthRows) viewMonthByProperty.set(r.propertyId, r._count._all);
    }
    const totalRows = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      _count: { _all: true },
    });
    for (const r of totalRows) viewTotalByProperty.set(r.propertyId, r._count._all);
  } catch {
    // ignore — 新部署前 PropertyView 表還沒 push 也不能擋住列表
  }

  // 翻譯狀態
  let translationsByProperty = new Map<number, Array<{ locale: string; sourceHash: string }>>();
  try {
    const rows = await prisma.propertyTranslation.findMany({
      select: { propertyId: true, locale: true, sourceHash: true },
    });
    const map = new Map<number, Array<{ locale: string; sourceHash: string }>>();
    for (const r of rows) {
      const arr = map.get(r.propertyId) ?? [];
      arr.push({ locale: r.locale, sourceHash: r.sourceHash });
      map.set(r.propertyId, arr);
    }
    translationsByProperty = map;
  } catch {
    // ignore
  }

  function translationStatus(p: any): { en: 'fresh' | 'missing'; ja: 'fresh' | 'missing' } {
    const trs = translationsByProperty.get(p.id) || [];
    const detect = (loc: 'en' | 'ja') => {
      const tr = trs.find((t: any) =>
        loc === 'ja' ? (t.locale === 'ja' || t.locale === 'jp') : t.locale === 'en'
      );
      return tr ? ('fresh' as const) : ('missing' as const);
    };
    return { en: detect('en'), ja: detect('ja') };
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">物件管理</h1>
          <p className="text-ink-500 text-sm">共 {items.length} 筆</p>
          {loadError && <p className="text-red-600 text-xs mt-1">{loadError}</p>}
        </div>
        <div className="flex items-start gap-3 flex-wrap">
          <form action="/admin/properties" method="get" className="flex items-center gap-1">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="編號 / 標題 / 區域"
              className="px-3 py-2 text-sm rounded-lg border border-line focus:outline-none focus:border-brand-green-500 w-48"
            />
            {/* keep month param when searching */}
            <input type="hidden" name="month" value={monthStr} />
            <button type="submit" className="btn btn-secondary text-sm">搜尋</button>
          </form>
          <form action="/admin/properties" method="get" className="flex items-center gap-1">
            <input type="hidden" name="q" value={q} />
            <select
              name="month"
              defaultValue={monthStr}
              className="px-3 py-2 text-sm rounded-lg border border-line focus:outline-none focus:border-brand-green-500"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <button type="submit" className="btn btn-secondary text-sm">套用月份</button>
          </form>
          <Link href="/admin/properties/new" className="btn btn-primary">+ 新增物件</Link>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="admin-card text-center text-ink-500 py-14">
          <p className="mb-3">尚未建立任何物件</p>
          <Link href="/admin/properties/new" className="btn btn-primary">建立第一筆物件</Link>
        </div>
      ) : (
        <div className="admin-card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-paper-2 text-xs text-ink-500">
              <tr>
                <th className="text-left px-3 py-2 font-bold whitespace-nowrap">編號</th>
                <th className="text-left px-3 py-2 font-bold w-14">圖</th>
                <th className="text-left px-3 py-2 font-bold">物件 / 區域</th>
                <th className="text-left px-3 py-2 font-bold whitespace-nowrap">類型</th>
                <th className="text-right px-3 py-2 font-bold whitespace-nowrap">月租</th>
                <th className="text-center px-3 py-2 font-bold whitespace-nowrap">狀態</th>
                <th className="text-right px-3 py-2 font-bold whitespace-nowrap" title={`${monthStr} 月 / 累積`}>
                  瀏覽（{monthStr.slice(5)}月 / 累積）
                </th>
                <th className="text-center px-3 py-2 font-bold whitespace-nowrap">翻譯</th>
                <th className="text-right px-3 py-2 font-bold whitespace-nowrap">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((p) => {
                const st = translationStatus(p);
                const monthCount = viewMonthByProperty.get(p.id) ?? 0;
                const totalCount = viewTotalByProperty.get(p.id) ?? 0;
                return (
                  <tr key={p.id} className="hover:bg-paper-2/40 transition">
                    <td className="px-3 py-2 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                      {p.code || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-paper-2">
                        {p.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-ink-300 text-xs">—</div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 min-w-[200px]">
                      <p className="font-bold text-ink-900 line-clamp-1">{p.title}</p>
                      <p className="text-xs text-ink-500">{p.region}・{p.district}</p>
                    </td>
                    <td className="px-3 py-2 text-xs text-ink-700 whitespace-nowrap">{p.typeMid}</td>
                    <td className="px-3 py-2 text-right font-bold text-brand-green-900 whitespace-nowrap">
                      NT$ {p.rent.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'active'
                            ? 'bg-brand-green-50 text-brand-green-700'
                            : 'bg-paper-2 text-ink-500'
                        }`}
                      >
                        {p.status === 'active' ? '上架中' : '已下架'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs whitespace-nowrap">
                      <span className="text-brand-green-700 font-bold">{monthCount.toLocaleString()}</span>
                      <span className="text-ink-400"> / </span>
                      <span className="text-ink-700">{totalCount.toLocaleString()}</span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <div className="inline-flex gap-1 text-[10px] font-bold">
                        <TransBadge label="EN" status={st.en} href={`/en/properties/${p.id}`} />
                        <TransBadge label="JA" status={st.ja} href={`/ja/properties/${p.id}`} />
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/properties/${p.id}/edit`}
                        className="text-xs font-medium border border-line rounded-md px-2.5 py-1 hover:border-brand-green-500 hover:text-brand-green-700 mr-1"
                      >
                        編輯
                      </Link>
                      <Link
                        href={`/properties/${p.id}`}
                        target="_blank"
                        className="text-xs font-medium border border-line rounded-md px-2.5 py-1 hover:border-brand-orange-500 hover:text-brand-orange-700"
                      >
                        預覽
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TransBadge({
  label,
  status,
  href,
}: {
  label: string;
  status: 'fresh' | 'missing';
  href: string;
}) {
  const className =
    status === 'fresh'
      ? 'bg-brand-green-50 text-brand-green-700 border border-brand-green-500/40'
      : 'bg-paper-2 text-ink-500 border border-line';
  const icon = status === 'fresh' ? '✓' : '○';
  const title = status === 'fresh' ? '已翻譯完成' : '尚未翻譯';
  return (
    <Link href={href} target="_blank" className={`px-1.5 py-0.5 rounded hover:opacity-80 ${className}`} title={title}>
      {icon} {label}
    </Link>
  );
}
