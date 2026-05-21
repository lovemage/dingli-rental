'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { type AdminPropertySort, sortAdminProperties } from '@/lib/admin-property-sort';
import { PROPERTY_SORT_OPTIONS } from '@/lib/property-sort';

type PropertyItem = {
  id: number;
  code?: string | null;
  title: string;
  region: string;
  district: string;
  street?: string | null;
  lane?: string | null;
  alley?: string | null;
  number?: string | null;
  numberSub?: string | null;
  typeMid: string;
  rent: number;
  usableArea: number;
  status: string;
  featured: boolean;
  createdAt: string;
  imageUrl: string | null;
  monthViews: number;
  totalViews: number;
};

function fmtDate(dateIso: string) {
  const d = new Date(dateIso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatFullAddress(p: Pick<PropertyItem, 'region' | 'district' | 'street' | 'lane' | 'alley' | 'number' | 'numberSub'>) {
  return `${p.region}${p.district}${p.street || ''}${p.lane ? `${p.lane}巷` : ''}${p.alley ? `${p.alley}弄` : ''}${p.number ? `${p.number}號` : ''}${p.numberSub ? `之${p.numberSub}` : ''}`;
}

export default function PropertiesManager({
  initialItems,
  monthStr,
  q,
}: {
  initialItems: PropertyItem[];
  monthStr: string;
  q: string;
}) {
  const ACTIVE_PAGE_SIZE = 30;
  const INACTIVE_PAGE_SIZE = 20;
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [pending, setPending] = useState<number | null>(null);
  const [activePage, setActivePage] = useState(1);
  const [activeSort, setActiveSort] = useState<AdminPropertySort | ''>('');
  const [inactiveSort, setInactiveSort] = useState<AdminPropertySort | ''>('');
  const [inactivePage, setInactivePage] = useState(1);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const activeItems = useMemo(() => items.filter((x) => x.status === 'active'), [items]);
  const inactiveItems = useMemo(() => items.filter((x) => x.status !== 'active'), [items]);
  const sortedActiveItems = useMemo(
    () => activeSort ? sortAdminProperties(activeItems, activeSort) : activeItems,
    [activeItems, activeSort]
  );
  const sortedInactiveItems = useMemo(
    () => inactiveSort ? sortAdminProperties(inactiveItems, inactiveSort) : inactiveItems,
    [inactiveItems, inactiveSort]
  );

  const activeTotalPages = Math.max(1, Math.ceil(sortedActiveItems.length / ACTIVE_PAGE_SIZE));
  const inactiveTotalPages = Math.max(1, Math.ceil(sortedInactiveItems.length / INACTIVE_PAGE_SIZE));
  const safeActivePage = Math.min(activePage, activeTotalPages);
  const safeInactivePage = Math.min(inactivePage, inactiveTotalPages);

  const pagedActiveItems = useMemo(() => {
    const start = (safeActivePage - 1) * ACTIVE_PAGE_SIZE;
    return sortedActiveItems.slice(start, start + ACTIVE_PAGE_SIZE);
  }, [sortedActiveItems, safeActivePage]);
  const pagedInactiveItems = useMemo(() => {
    const start = (safeInactivePage - 1) * INACTIVE_PAGE_SIZE;
    return sortedInactiveItems.slice(start, start + INACTIVE_PAGE_SIZE);
  }, [sortedInactiveItems, safeInactivePage]);

  async function updateStatus(
    id: number,
    status: 'active' | 'inactive',
    listingStatus?: 'active' | 'rented' | 'sold' | 'closed'
  ) {
    setPending(id);
    try {
      const res = await fetch(`/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, listingStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '更新狀態失敗');
      setItems((prev) => {
        const next = prev.map((it) => (
          it.id === id
            ? {
                ...it,
                status: data.status,
                createdAt: data.createdAt ? new Date(data.createdAt).toISOString() : it.createdAt,
              }
            : it
        ));
        return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      });
    } catch (e: any) {
      alert(e?.message || '更新失敗');
    } finally {
      setPending(null);
    }
  }

  async function copyCode(code?: string | null) {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((current) => (current === code ? null : current));
      }, 1200);
    } catch {
      setCopiedCode(null);
    }
  }

  const rows = activeTab === 'active' ? pagedActiveItems : pagedInactiveItems;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">物件管理</h1>
          <p className="text-ink-500 text-sm">上架中 {activeItems.length} 筆 / 已下架 {inactiveItems.length} 筆</p>
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <form action="/admin/properties" method="get" className="flex items-center gap-1">
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="編號/標題/區域/路名"
              className="px-3 py-2 text-sm rounded-lg border border-line focus:outline-none focus:border-brand-green-500 w-48"
            />
            <input type="hidden" name="month" value={monthStr} />
            <button type="submit" className="btn btn-secondary text-sm">搜尋</button>
          </form>
          <Link href="/admin/properties/new" className="btn btn-primary">+ 新增物件</Link>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('active')}
          className={`px-3.5 py-1.5 text-sm font-bold rounded-full border transition ${
            activeTab === 'active'
              ? 'bg-brand-green-700 text-white border-brand-green-700'
              : 'bg-white text-ink-700 border-line hover:border-brand-green-500'
          }`}
        >
          已上架（{activeItems.length}）
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inactive')}
          className={`px-3.5 py-1.5 text-sm font-bold rounded-full border transition ${
            activeTab === 'inactive'
              ? 'bg-brand-green-700 text-white border-brand-green-700'
              : 'bg-white text-ink-700 border-line hover:border-brand-green-500'
          }`}
        >
          已下架（{inactiveItems.length}）
        </button>
      </div>

      <div className="flex items-center justify-end">
        <label className="text-sm flex items-center gap-2">
          <span className="text-ink-500">排序</span>
          <select
            className="bg-white border border-line rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-brand-green-500"
            value={activeTab === 'active' ? activeSort : inactiveSort}
            onChange={(e) => {
              const next = e.target.value as AdminPropertySort | '';
              if (activeTab === 'active') {
                setActiveSort(next);
                setActivePage(1);
              } else {
                setInactiveSort(next);
                setInactivePage(1);
              }
            }}
          >
            <option value="">選取</option>
            {PROPERTY_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {ADMIN_SORT_LABELS[option.labelKey]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-paper-2 text-xs text-ink-500">
            <tr>
              {activeTab === 'inactive' && (
                <th className="text-left px-3 py-2 font-bold whitespace-nowrap">上架</th>
              )}
              <th className="text-left px-3 py-2 font-bold whitespace-nowrap">編號</th>
              <th className="text-left px-3 py-2 font-bold w-14">圖</th>
              <th className="text-left px-3 py-2 font-bold">物件 / 地址</th>
              <th className="text-left px-3 py-2 font-bold whitespace-nowrap">類型</th>
              <th className="text-right px-3 py-2 font-bold whitespace-nowrap">月租</th>
              <th className="text-right px-3 py-2 font-bold whitespace-nowrap" title={`${monthStr} 月 / 累積`}>
                瀏覽（{monthStr.slice(5)}月 / 累積）
              </th>
              <th className="text-center px-3 py-2 font-bold whitespace-nowrap">上架時間</th>
              <th className="text-right px-3 py-2 font-bold whitespace-nowrap">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-paper-2/40 transition">
                {activeTab === 'inactive' && (
                  <td className="px-3 py-2 whitespace-nowrap">
                    <button
                      type="button"
                      disabled={pending === p.id}
                      onClick={() => updateStatus(p.id, 'active', 'active')}
                      className="text-xs font-medium border border-brand-green-200 text-brand-green-700 rounded-md px-2.5 py-1 hover:bg-brand-green-50 disabled:opacity-50"
                    >
                      重新上架
                    </button>
                  </td>
                )}
                <td className="px-3 py-2 font-mono text-[11px] text-ink-500 whitespace-nowrap">
                  {p.code ? (
                    <button
                      type="button"
                      onClick={() => copyCode(p.code)}
                      className="inline-flex items-center gap-1 rounded-md border border-transparent px-1.5 py-1 font-mono text-[11px] font-bold text-ink-500 transition hover:border-brand-green-200 hover:bg-brand-green-50 hover:text-brand-green-700"
                      title="點擊複製物件編號"
                      aria-label={`複製物件編號 ${p.code}`}
                    >
                      <span>{p.code}</span>
                      <span className="text-[10px]">{copiedCode === p.code ? '已複製' : '複製'}</span>
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-paper-2">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-ink-300 text-xs">—</div>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 min-w-[240px]">
                  <Link
                    href={`/properties/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-ink-900 line-clamp-1 hover:text-brand-green-700 underline-offset-2 hover:underline"
                    title="新視窗預覽"
                  >
                    {p.title}
                  </Link>
                  {p.featured && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-brand-orange-50 px-2 py-0.5 text-[11px] font-bold text-brand-orange-700">
                      精選
                    </span>
                  )}
                  <p className="text-xs text-ink-500 line-clamp-1">{formatFullAddress(p)}</p>
                </td>
                <td className="px-3 py-2 text-xs text-ink-700 whitespace-nowrap">{p.typeMid}</td>
                <td className="px-3 py-2 text-right font-bold text-brand-green-900 whitespace-nowrap">NT$ {p.rent.toLocaleString()}</td>
                <td className="px-3 py-2 text-right font-mono text-xs whitespace-nowrap">
                  <span className="text-brand-green-700 font-bold">{p.monthViews.toLocaleString()}</span>
                  <span className="text-ink-400"> / </span>
                  <span className="text-ink-700">{p.totalViews.toLocaleString()}</span>
                </td>
                <td className="px-3 py-2 text-center text-xs whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  <Link href={`/admin/properties/${p.id}/edit`} className="text-xs font-medium border border-line rounded-md px-2.5 py-1 hover:border-brand-green-500 hover:text-brand-green-700 mr-1">編輯</Link>
                  {p.status === 'active' ? (
                    <button
                      type="button"
                      disabled={pending === p.id}
                      onClick={() => updateStatus(p.id, 'inactive', 'rented')}
                      className="text-xs font-medium border border-red-200 text-red-700 rounded-md px-2.5 py-1 hover:bg-red-50 disabled:opacity-50"
                    >
                      成交下架
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {activeTab === 'active' && activeTotalPages > 1 && (
          <div className="px-3 py-3 border-t border-line flex items-center justify-center gap-2 bg-white">
            <button
              type="button"
              onClick={() => setActivePage((p) => Math.max(1, p - 1))}
              disabled={safeActivePage === 1}
              className="text-xs font-medium border border-line rounded-md px-2.5 py-1 disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="text-xs text-ink-500">第 {safeActivePage} / {activeTotalPages} 頁</span>
            <button
              type="button"
              onClick={() => setActivePage((p) => Math.min(activeTotalPages, p + 1))}
              disabled={safeActivePage === activeTotalPages}
              className="text-xs font-medium border border-line rounded-md px-2.5 py-1 disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        )}

        {activeTab === 'inactive' && inactiveTotalPages > 1 && (
          <div className="px-3 py-3 border-t border-line flex items-center justify-center gap-2 bg-white">
            <button
              type="button"
              onClick={() => setInactivePage((p) => Math.max(1, p - 1))}
              disabled={safeInactivePage === 1}
              className="text-xs font-medium border border-line rounded-md px-2.5 py-1 disabled:opacity-50"
            >
              上一頁
            </button>
            <span className="text-xs text-ink-500">第 {safeInactivePage} / {inactiveTotalPages} 頁</span>
            <button
              type="button"
              onClick={() => setInactivePage((p) => Math.min(inactiveTotalPages, p + 1))}
              disabled={safeInactivePage === inactiveTotalPages}
              className="text-xs font-medium border border-line rounded-md px-2.5 py-1 disabled:opacity-50"
            >
              下一頁
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 && (
        <div className="admin-card">
          <p className="text-sm text-ink-500">{activeTab === 'active' ? '目前沒有已上架物件' : '目前沒有已下架物件'}</p>
        </div>
      )}
    </div>
  );
}

const ADMIN_SORT_LABELS: Record<(typeof PROPERTY_SORT_OPTIONS)[number]['labelKey'], string> = {
  sortRentDesc: '租金高到低',
  sortRentAsc: '租金低到高',
  sortCreatedDesc: '新到舊',
  sortCreatedAsc: '舊到新',
  sortAreaDesc: '坪數大到小',
  sortAreaAsc: '坪數小到大',
};
