'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

type PropertyItem = {
  id: number;
  code?: string | null;
  title: string;
  region: string;
  district: string;
  typeMid: string;
  rent: number;
  status: string;
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

export default function PropertiesManager({
  initialItems,
  monthStr,
  q,
}: {
  initialItems: PropertyItem[];
  monthStr: string;
  q: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [showOffShelf, setShowOffShelf] = useState(false);
  const [pending, setPending] = useState<number | null>(null);

  const activeItems = useMemo(() => items.filter((x) => x.status === 'active'), [items]);
  const inactiveItems = useMemo(() => items.filter((x) => x.status !== 'active'), [items]);

  async function updateStatus(id: number, status: 'active' | 'inactive', listingStatus?: 'active' | 'closed') {
    setPending(id);
    try {
      const res = await fetch(`/api/properties/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, listingStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || '更新狀態失敗');
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: data.status } : it)));
      if (status === 'inactive') setShowOffShelf(true);
    } catch (e: any) {
      alert(e?.message || '更新失敗');
    } finally {
      setPending(null);
    }
  }

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
              placeholder="編號 / 標題 / 區域"
              className="px-3 py-2 text-sm rounded-lg border border-line focus:outline-none focus:border-brand-green-500 w-48"
            />
            <input type="hidden" name="month" value={monthStr} />
            <button type="submit" className="btn btn-secondary text-sm">搜尋</button>
          </form>
          <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowOffShelf(true)}>
            已下架 ({inactiveItems.length})
          </button>
          <Link href="/admin/properties/new" className="btn btn-primary">+ 新增物件</Link>
        </div>
      </div>

      <div className="admin-card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-paper-2 text-xs text-ink-500">
            <tr>
              <th className="text-left px-3 py-2 font-bold whitespace-nowrap">編號</th>
              <th className="text-left px-3 py-2 font-bold w-14">圖</th>
              <th className="text-left px-3 py-2 font-bold">物件 / 區域</th>
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
            {activeItems.map((p) => (
              <tr key={p.id} className="hover:bg-paper-2/40 transition">
                <td className="px-3 py-2 font-mono text-[11px] text-ink-500 whitespace-nowrap">{p.code || '—'}</td>
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
                <td className="px-3 py-2 min-w-[200px]">
                  <Link
                    href={`/properties/${p.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-ink-900 line-clamp-1 hover:text-brand-green-700 underline-offset-2 hover:underline"
                    title="新視窗預覽"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-ink-500">{p.region}・{p.district}</p>
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
                  <button
                    type="button"
                    disabled={pending === p.id}
                    onClick={() => updateStatus(p.id, 'inactive', 'closed')}
                    className="text-xs font-medium border border-red-200 text-red-700 rounded-md px-2.5 py-1 hover:bg-red-50 disabled:opacity-50"
                  >
                    成交下架
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showOffShelf && (
        <div className="fixed inset-0 z-50 bg-ink-900/55 grid place-items-center px-4" onClick={() => setShowOffShelf(false)}>
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[85vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <h3 className="font-black text-lg">成交下架區塊</h3>
              <button type="button" className="btn btn-secondary text-sm" onClick={() => setShowOffShelf(false)}>關閉</button>
            </div>
            <div className="p-4 overflow-auto max-h-[70vh]">
              {inactiveItems.length === 0 ? (
                <p className="text-sm text-ink-500">目前沒有已下架物件</p>
              ) : (
                <div className="space-y-2">
                  {inactiveItems.map((p) => (
                    <div key={p.id} className="border border-line rounded-lg p-3 flex items-center justify-between gap-3">
                      <div>
                        <Link
                          href={`/properties/${p.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-sm hover:text-brand-green-700 underline-offset-2 hover:underline"
                          title="新視窗預覽"
                        >
                          {p.title}
                        </Link>
                        <p className="text-xs text-ink-500">#{p.code || '—'} ・ {p.region}・{p.district} ・ 上架時間 {fmtDate(p.createdAt)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={pending === p.id}
                        onClick={() => updateStatus(p.id, 'active', 'active')}
                        className="btn btn-primary text-sm disabled:opacity-50"
                      >
                        再次上架
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
