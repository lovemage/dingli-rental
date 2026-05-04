'use client';

import { useEffect, useState } from 'react';
import MaterialIcon from '@/components/admin/MaterialIcon';

type Inquiry = {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  region: string | null;
  propertyType: string | null;
  budget: number | null;
  message: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Counts = { all: number; new: number; contacted: number; closed: number };

const STATUS_TABS: { key: 'all' | 'new' | 'contacted' | 'closed'; label: string }[] = [
  { key: 'all',       label: '全部' },
  { key: 'new',       label: '新進' },
  { key: 'contacted', label: '已聯絡' },
  { key: 'closed',    label: '已結案' },
];

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  new:       { label: '新進',   className: 'bg-red-50 text-red-700' },
  contacted: { label: '已聯絡', className: 'bg-brand-green-50 text-brand-green-700' },
  closed:    { label: '已結案', className: 'bg-paper-2 text-ink-500' },
};

function fmt(dt: string) {
  try {
    return new Date(dt).toLocaleString('zh-TW', {
      timeZone: 'Asia/Taipei',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dt; }
}

export default function InquiriesManager() {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, new: 0, contacted: 0, closed: 0 });
  const [tab, setTab] = useState<'all' | 'new' | 'contacted' | 'closed'>('new');
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  async function refresh(currentTab = tab) {
    setLoading(true);
    try {
      const url = currentTab === 'all'
        ? '/api/admin/inquiries'
        : `/api/admin/inquiries?status=${currentTab}`;
      const res = await fetch(url, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) {
        setItems(json.items || []);
        setCounts(json.counts || { all: 0, new: 0, contacted: 0, closed: 0 });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(tab); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [tab]);

  async function updateInquiry(id: number, patch: { status?: string; notes?: string }) {
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || '更新失敗');
      }
      await refresh();
    } catch (e: any) {
      alert(e?.message || '更新失敗');
    } finally {
      setSavingId(null);
    }
  }

  async function deleteInquiry(id: number) {
    if (!confirm('確定要刪除這筆詢問？此操作無法復原。')) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || '刪除失敗');
      }
      await refresh();
    } catch (e: any) {
      alert(e?.message || '刪除失敗');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* === Tab === */}
      <div className="bg-white border border-line rounded-xl p-1 flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((t) => {
          const count = counts[t.key];
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`flex-1 min-w-fit px-4 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1.5 ${active ? 'bg-brand-green-700 text-white shadow-sm' : 'text-ink-700 hover:bg-paper-2'}`}
            >
              {t.label}
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-paper-2 text-ink-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* === List === */}
      {loading ? (
        <p className="text-ink-500 text-center py-12">載入中...</p>
      ) : items.length === 0 ? (
        <div className="admin-card text-center py-16 text-ink-500">
          <MaterialIcon name="inbox" className="!text-5xl text-ink-300 mb-2" />
          <p>目前沒有詢問</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => {
            const expanded = expandedId === it.id;
            const badge = STATUS_BADGE[it.status] || STATUS_BADGE.new;
            return (
              <div key={it.id} className="admin-card !p-0 overflow-hidden">
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : it.id)}
                  className="w-full text-left px-5 py-4 hover:bg-paper-2 transition flex items-center gap-4"
                >
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge.className} whitespace-nowrap flex-shrink-0`}>
                    {badge.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-ink-900">{it.name}</span>
                      <span className="text-sm text-ink-700">{it.phone}</span>
                      {it.region && <span className="text-xs text-ink-500">· {it.region}</span>}
                      {it.propertyType && <span className="text-xs text-ink-500">· {it.propertyType}</span>}
                      {it.budget != null && it.budget > 0 && (
                        <span className="text-xs text-brand-orange-700 font-bold">· NT$ {it.budget.toLocaleString()}/月</span>
                      )}
                    </div>
                    {it.message && !expanded && (
                      <p className="text-xs text-ink-500 mt-1 line-clamp-1">{it.message}</p>
                    )}
                  </div>
                  <div className="hidden sm:block text-xs text-ink-500 whitespace-nowrap flex-shrink-0">
                    {fmt(it.createdAt)}
                  </div>
                  <span className={`text-ink-400 text-base flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden>▼</span>
                </button>

                {/* Expanded body */}
                {expanded && (
                  <div className="px-5 py-4 border-t border-line bg-paper-2/40 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <Field label="姓名" value={it.name} />
                      <Field label="電話" value={
                        <a href={`tel:${it.phone.replace(/[^\d+]/g, '')}`} className="text-brand-green-700 hover:underline">{it.phone}</a>
                      } />
                      <Field label="Email" value={
                        it.email ? <a href={`mailto:${it.email}`} className="text-brand-green-700 hover:underline break-all">{it.email}</a> : '—'
                      } />
                      <Field label="送出時間" value={fmt(it.createdAt)} />
                      <Field label="希望地區" value={it.region || '不限'} />
                      <Field label="物件類型" value={it.propertyType || '不限'} />
                      <Field label="預算" value={it.budget && it.budget > 0 ? `NT$ ${it.budget.toLocaleString()} / 月` : '—'} />
                    </div>

                    {it.message && (
                      <div>
                        <p className="text-xs font-bold text-ink-500 mb-1">需求描述</p>
                        <div className="bg-white border border-line rounded-lg px-3 py-2.5 text-sm text-ink-900 whitespace-pre-wrap">
                          {it.message}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-ink-500 mb-1">內部備註</p>
                      <textarea
                        defaultValue={it.notes || ''}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v !== (it.notes || '')) void updateInquiry(it.id, { notes: v });
                        }}
                        placeholder="點此輸入聯絡進度、客戶喜好…（離開焦點自動儲存）"
                        className="input-base !text-sm min-h-[80px] resize-y"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-line">
                      {it.status !== 'contacted' && (
                        <button
                          type="button"
                          disabled={savingId === it.id}
                          onClick={() => updateInquiry(it.id, { status: 'contacted' })}
                          className="btn btn-primary text-xs disabled:opacity-50"
                        >
                          <MaterialIcon name="check" className="!text-base mr-1" />
                          標記為已聯絡
                        </button>
                      )}
                      {it.status !== 'closed' && (
                        <button
                          type="button"
                          disabled={savingId === it.id}
                          onClick={() => updateInquiry(it.id, { status: 'closed' })}
                          className="btn btn-secondary text-xs disabled:opacity-50"
                        >
                          結案
                        </button>
                      )}
                      {it.status !== 'new' && (
                        <button
                          type="button"
                          disabled={savingId === it.id}
                          onClick={() => updateInquiry(it.id, { status: 'new' })}
                          className="btn btn-secondary text-xs disabled:opacity-50"
                        >
                          重新標為新進
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={savingId === it.id}
                        onClick={() => deleteInquiry(it.id)}
                        className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 ml-auto"
                      >
                        <MaterialIcon name="delete" className="!text-base mr-1" />
                        刪除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-ink-500 mb-0.5">{label}</p>
      <div className="text-ink-900">{value}</div>
    </div>
  );
}
