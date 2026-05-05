import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import TranslatePendingButton from '@/components/admin/TranslatePendingButton';
import { computePropertySourceHash } from '@/lib/property-translate';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesList() {
  let items: any[] = [];
  let loadError = '';
  try {
    items = await prisma.property.findMany({
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

  // 統計：每筆物件 EN / JA 翻譯是否最新
  function translationStatus(p: any): { en: 'fresh' | 'stale' | 'missing'; ja: 'fresh' | 'stale' | 'missing' } {
    const hash = computePropertySourceHash(p);
    const trs = translationsByProperty.get(p.id) || [];
    const detect = (loc: string) => {
      const tr = trs.find((t: any) => t.locale === loc);
      if (!tr) return 'missing' as const;
      return tr.sourceHash === hash ? ('fresh' as const) : ('stale' as const);
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
          <TranslatePendingButton />
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
                    <TransBadge label="EN" status={st.en} />
                    <TransBadge label="JA" status={st.ja} />
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
}: {
  label: string;
  status: 'fresh' | 'stale' | 'missing';
}) {
  const className =
    status === 'fresh'
      ? 'bg-brand-green-50 text-brand-green-700 border border-brand-green-500/40'
      : status === 'stale'
        ? 'bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-300'
        : 'bg-paper-2 text-ink-500 border border-line';
  const icon = status === 'fresh' ? '✓' : status === 'stale' ? '↻' : '○';
  const title =
    status === 'fresh' ? '已翻譯，最新' : status === 'stale' ? '已翻譯，但內容已變更需重譯' : '尚未翻譯';
  return (
    <span className={`px-1.5 py-0.5 rounded ${className}`} title={title}>
      {icon} {label}
    </span>
  );
}
