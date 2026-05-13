import Link from 'next/link';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isPropertyCode, normalizePropertyCode } from '@/lib/property-code';

export const dynamic = 'force-dynamic';

type SearchParams = { q?: string };

export default async function AdminPropertiesList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();

  // 編號精準查找：admin 直接跳該物件編輯頁
  if (q && isPropertyCode(q)) {
    const hit = await prisma.property
      .findUnique({ where: { code: normalizePropertyCode(q) }, select: { id: true } })
      .catch(() => null);
    if (hit) redirect(`/admin/properties/${hit.id}/edit`);
  }

  // 一般 keyword：搜 title / community / district / 編號（部分相符也接受）
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

  // 翻譯狀態資料可能因部署時 DB schema 尚未更新而暫時不可用，不能影響主列表顯示
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

  // 統計：每筆物件 EN / JA 翻譯是否存在（ja 相容舊資料代碼 jp）
  function translationStatus(p: any): { en: 'fresh' | 'missing'; ja: 'fresh' | 'missing' } {
    const trs = translationsByProperty.get(p.id) || [];
    const detect = (loc: 'en' | 'ja') => {
      const tr = trs.find((t: any) =>
        loc === 'ja' ? (t.locale === 'ja' || t.locale === 'jp') : t.locale === 'en'
      );
      if (!tr) return 'missing' as const;
      return 'fresh' as const;
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
            <button type="submit" className="btn btn-secondary text-sm">搜尋</button>
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => {
            const st = translationStatus(p);
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-line"
              >
                <div className="aspect-[4/3] bg-paper-2 overflow-hidden">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-ink-300">暫無圖片</div>
                  )}
                </div>
                <div className="p-4">
                  {p.code && (
                    <span className="text-[10px] font-mono font-bold tracking-wider text-ink-400 mb-1 block">#{p.code}</span>
                  )}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'active'
                          ? 'bg-brand-green-50 text-brand-green-700'
                          : 'bg-paper-2 text-ink-500'
                      }`}
                    >
                      {p.status === 'active' ? '上架中' : '已下架'}
                    </span>
                    <span className="text-xs text-ink-500">{p.typeMid}</span>
                  </div>
                  <h3 className="font-bold text-base line-clamp-1 mb-1">{p.title}</h3>
                  <p className="text-sm text-ink-500 mb-2">
                    {p.region}・{p.district}
                  </p>
                  <p className="text-brand-green-900 font-black text-lg mb-3">
                    NT$ {p.rent.toLocaleString()}
                    <span className="text-xs text-ink-500 font-medium"> /月</span>
                  </p>

                  {/* 翻譯狀態徽章 */}
                  <div className="flex gap-1.5 mb-3 text-[11px] font-bold">
                    <TransBadge label="EN" status={st.en} href={`/en/properties/${p.id}`} />
                    <TransBadge label="JA" status={st.ja} href={`/ja/properties/${p.id}`} />
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/admin/properties/${p.id}/edit`}
                      className="flex-1 text-center text-sm font-medium border border-line rounded-lg py-2 hover:border-brand-green-500 hover:text-brand-green-700"
                    >
                      編輯
                    </Link>
                    <Link
                      href={`/properties/${p.id}`}
                      target="_blank"
                      className="flex-1 text-center text-sm font-medium border border-line rounded-lg py-2 hover:border-brand-orange-500 hover:text-brand-orange-700"
                    >
                      預覽
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
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
  return <Link href={href} target="_blank" className={`px-1.5 py-0.5 rounded hover:opacity-80 ${className}`} title={title}>{icon} {label}</Link>;
}
