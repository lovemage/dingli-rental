'use client';

import { useEffect, useRef, useState } from 'react';
import MaterialIcon from '@/components/admin/MaterialIcon';

type ChatRow = {
  id: number;
  language: string;
  messageCount: number;
  inquiryId: number | null;
  unread: boolean;
  preview: string;
  createdAt: string;
  updatedAt: string;
};

type ChatDetail = {
  id: number;
  messages: { role: 'user' | 'assistant'; content: string }[];
};

const LANGUAGE_LABEL: Record<string, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  vi: 'Tiếng Việt',
  th: 'ไทย',
  id: 'Indonesia',
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

/** 通知外層（分頁 badge、側欄 badge）未讀數變動 */
function publishAiUnread(count: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('admin:ai-chats-updated', { detail: { unreadCount: count } }));
}

/** 客戶詢問 → 「AI 客服記錄」分頁：列出 90 天內的 AI 客服對話（每頁 50 筆） */
export default function AiChatLogs({ onOpenInquiries }: { onOpenInquiries?: () => void }) {
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, ChatDetail>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const unreadRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (reloadKey === 0) setLoading(true);
      try {
        const res = await fetch(`/api/admin/ai-chats?page=${page}`, { cache: 'no-store' });
        const json = await res.json();
        if (cancelled || !res.ok) return;
        setRows(json.items || []);
        setTotal(Number(json.total) || 0);
        const pages = Number(json.totalPages) || 1;
        setTotalPages(pages);
        if (page > pages) setPage(pages);
        unreadRef.current = Number(json.unreadCount) || 0;
        publishAiUnread(unreadRef.current);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [page, reloadKey]);

  async function toggle(id: number) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const row = rows.find((x) => x.id === id);
    // 未讀的對話一律重抓（訪客可能有新訊息），抓取時後端同步標為已讀
    if (details[id] && !row?.unread) return;
    try {
      const res = await fetch(`/api/admin/ai-chats/${id}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) return;
      setDetails((d) => ({ ...d, [id]: json }));
      if (row?.unread) {
        setRows((list) => list.map((x) => (x.id === id ? { ...x, unread: false } : x)));
        markOneRead();
      }
    } catch {
      // ignore
    }
  }

  function markOneRead() {
    unreadRef.current = Math.max(0, unreadRef.current - 1);
    publishAiUnread(unreadRef.current);
  }

  async function remove(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/ai-chats/${id}`, { method: 'DELETE' });
      if (!res.ok) { alert('刪除失敗'); return; }
      if (expandedId === id) setExpandedId(null);
      setRows((r) => r.filter((x) => x.id !== id));
      setReloadKey((k) => k + 1); // 重抓本頁，補滿 50 筆並更新未讀數
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-ink-500 text-center py-12">載入中...</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-500">
        共 {total} 段對話。紀錄保留 90 天，超過自動刪除；客戶在對話中留下的需求單會自動進入「新進」。
      </p>

      {rows.length === 0 ? (
        <div className="admin-card text-center py-16 text-ink-500">
          <MaterialIcon name="forum" className="!text-5xl text-ink-300 mb-2" />
          <p>目前沒有 AI 客服對話</p>
        </div>
      ) : (
        rows.map((r) => {
          const expanded = expandedId === r.id;
          const detail = details[r.id];
          return (
            <div
              key={r.id}
              className={`admin-card !p-0 overflow-hidden transition ${r.unread ? '!bg-brand-orange-50/70 !border-brand-orange-300 shadow-md' : ''}`}
            >
              <div className="flex items-stretch">
              <button
                type="button"
                onClick={() => toggle(r.id)}
                className={`flex-1 min-w-0 text-left pl-5 pr-2 py-4 transition flex items-center gap-4 ${r.unread ? 'hover:bg-brand-orange-50' : 'hover:bg-paper-2'}`}
              >
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-paper-2 text-ink-700 whitespace-nowrap flex-shrink-0">
                  {LANGUAGE_LABEL[r.language] || r.language}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.unread && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white">
                        <MaterialIcon name="mark_chat_unread" className="!text-sm" />
                        新訊息
                      </span>
                    )}
                    {r.inquiryId && (
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-brand-orange-500 text-white">
                        已留需求單 #{r.inquiryId}
                      </span>
                    )}
                    <span className="text-xs text-ink-500">{r.messageCount} 則訊息</span>
                  </div>
                  <p className={`text-sm mt-1 line-clamp-1 ${r.unread ? 'font-bold text-ink-900' : 'text-ink-900'}`}>{r.preview || '（訪客尚未發問）'}</p>
                </div>
                <span className="hidden sm:block text-xs text-ink-500 whitespace-nowrap flex-shrink-0">{fmt(r.updatedAt)}</span>
                <span className={`text-ink-400 text-base flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden>▼</span>
              </button>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={deletingId === r.id}
                aria-label="刪除對話"
                title="刪除對話"
                className="flex-shrink-0 px-4 text-ink-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-40"
              >
                <MaterialIcon name="delete" className="!text-xl" />
              </button>
              </div>

              {expanded && (
                <div className="px-5 py-4 border-t border-line bg-paper-2/40 space-y-3">
                  {!detail ? (
                    <p className="text-sm text-ink-500">載入中...</p>
                  ) : (
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {detail.messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                              m.role === 'user'
                                ? 'bg-brand-green-700 text-white rounded-br-sm'
                                : 'bg-white border border-line text-ink-900 rounded-bl-sm'
                            }`}
                          >
                            {m.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs text-ink-500">
                    <span>開始 {fmt(r.createdAt)}・最後更新 {fmt(r.updatedAt)}</span>
                    {r.inquiryId && onOpenInquiries && (
                      <button type="button" onClick={onOpenInquiries} className="btn btn-secondary text-xs">
                        查看需求單
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(r.id)}
                      disabled={deletingId === r.id}
                      className="disabled:opacity-40 text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 ml-auto"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn btn-secondary text-xs disabled:opacity-40"
          >
            ‹ 上一頁
          </button>
          <span className="tabular-nums text-ink-500">{page} / {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="btn btn-secondary text-xs disabled:opacity-40"
          >
            下一頁 ›
          </button>
        </div>
      )}
    </div>
  );
}
