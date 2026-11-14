'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import MaterialIcon from '@/components/admin/MaterialIcon';

const NAV = [
  { href: '/admin', label: '儀表板', icon: 'dashboard' },
  { href: '/admin/properties/new', label: '新增物件', icon: 'add_circle' },
  { href: '/admin/properties', label: '物件管理', icon: 'home_work' },
  { href: '/admin/inquiries', label: '客戶詢問', icon: 'mail' },
  { href: '/admin/announcements', label: '公告管理', icon: 'campaign' },
  { href: '/admin/hero', label: '首頁管理', icon: 'imagesmode' },
  { href: '/admin/navigation', label: '頁首導覽', icon: 'menu' },
  { href: '/admin/taxonomy', label: '標籤與分類', icon: 'sell' },
  { href: '/admin/testimonials', label: '評論管理', icon: 'rate_review' },
  { href: '/admin/careers', label: '人才招募', icon: 'work' },
  { href: '/admin/contact', label: '聯絡頁面', icon: 'contact_mail' },
  { href: '/admin/floating-cta', label: '浮動按鈕', icon: 'support_agent' },
  { href: '/admin/ai-settings', label: 'AI 設定', icon: 'auto_awesome' },
  { href: '/admin/notifications', label: '通知設定', icon: 'notifications' },
  { href: '/admin/settings', label: '帳號設定', icon: 'settings' },
];

// 取最長前綴匹配，避免 /admin/properties 與 /admin/properties/new 同時亮起
function getActiveHref(path: string): string | null {
  let best: string | null = null;
  let bestLen = -1;
  for (const n of NAV) {
    if (n.href === '/admin') {
      if (path === '/admin') return '/admin';
      continue;
    }
    if (path === n.href || path.startsWith(n.href + '/')) {
      if (n.href.length > bestLen) {
        best = n.href;
        bestLen = n.href.length;
      }
    }
  }
  return best;
}

type AiQuotaState = {
  lowBalance: boolean;
  exhausted: boolean;
  remainingRatio: number;
  remainingUsd: number;
};

export default function AdminShell({ username, children }: { username: string; children: React.ReactNode }) {
  const path = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newInquiries, setNewInquiries] = useState(0);
  const [unreadAiChats, setUnreadAiChats] = useState(0);
  const unreadInquiries = newInquiries + unreadAiChats; // 側欄 badge：新進詢問 + AI 客服未讀
  const [aiQuota, setAiQuota] = useState<AiQuotaState | null>(null);
  const activeHref = useMemo(() => getActiveHref(path), [path]);
  const aiAlert = Boolean(aiQuota && (aiQuota.lowBalance || aiQuota.exhausted));

  // AI 額度剩餘 ≤ 20%：側欄「AI 設定」紅點＋頁面上方文字提醒
  useEffect(() => {
    let alive = true;
    async function fetchQuota() {
      try {
        const res = await fetch('/api/admin/ai-usage', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (!alive) return;
        setAiQuota({
          lowBalance: Boolean(json.lowBalance),
          exhausted: Boolean(json.exhausted),
          remainingRatio: Number(json.remainingRatio) || 0,
          remainingUsd: Math.max(0, Number(json.totalUsd) - Number(json.currentUsd)) || 0,
        });
      } catch {
        // ignore
      }
    }
    function onVisible() {
      if (document.visibilityState === 'visible') void fetchQuota();
    }
    void fetchQuota();
    const timer = window.setInterval(() => { void fetchQuota(); }, 120000);
    window.addEventListener('admin:ai-usage-updated', fetchQuota);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('admin:ai-usage-updated', fetchQuota);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [path]);

  useEffect(() => {
    let alive = true;
    async function fetchUnread() {
      try {
        const res = await fetch('/api/admin/inquiries', { cache: 'no-store' });
        const json = await res.json();
        if (!alive) return;
        const next = Number(json?.counts?.new || 0);
        const ai = Number(json?.counts?.aiUnread || 0);
        setNewInquiries(Number.isFinite(next) ? next : 0);
        setUnreadAiChats(Number.isFinite(ai) ? ai : 0);
      } catch {
        // ignore
      }
    }

    function onUpdated(e: Event) {
      const detail = (e as CustomEvent<{ newCount?: number }>).detail;
      const next = Number(detail?.newCount ?? 0);
      if (Number.isFinite(next)) setNewInquiries(next);
    }

    function onAiUpdated(e: Event) {
      const next = Number((e as CustomEvent<{ unreadCount?: number }>).detail?.unreadCount ?? 0);
      if (Number.isFinite(next)) setUnreadAiChats(next);
    }

    function onVisible() {
      if (document.visibilityState === 'visible') void fetchUnread();
    }

    void fetchUnread();
    const timer = window.setInterval(() => { void fetchUnread(); }, 30000);
    window.addEventListener('admin:inquiries-updated', onUpdated as EventListener);
    window.addEventListener('admin:ai-chats-updated', onAiUpdated as EventListener);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      alive = false;
      window.clearInterval(timer);
      window.removeEventListener('admin:inquiries-updated', onUpdated as EventListener);
      window.removeEventListener('admin:ai-chats-updated', onAiUpdated as EventListener);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-paper-2">
      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-30 bg-white border-b border-line lg:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={() => setOpen(true)} className="relative text-2xl text-ink-700" aria-label="選單">
            <MaterialIcon name="menu" className="text-3xl" />
            {aiAlert && <span className="absolute top-0.5 right-0 h-2.5 w-2.5 rounded-full bg-red-600" aria-hidden />}
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <Image
              src="/LOGO_0.png"
              alt="鼎立租售管理 Dingli Rental Service"
              width={387}
              height={44}
              unoptimized
              className="h-7 w-auto"
              style={{ width: 'auto' }}
            />
            <span className="text-xs font-bold text-ink-700">後台</span>
          </Link>
          <button onClick={logout} className="text-xs text-ink-500">登出</button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-line sticky top-0">
          <div className="p-5 border-b border-line">
            <Link href="/admin" className="flex items-center gap-2">
              <Image
                src="/LOGO_0.png"
                alt="鼎立租售管理 Dingli Rental Service"
                width={387}
                height={44}
                unoptimized
                className="h-11 w-auto"
                style={{ width: 'auto' }}
              />
            </Link>
            <p className="text-xs text-ink-500 mt-1.5">後台管理系統</p>
          </div>
          <nav className="flex-1 p-3">
            {NAV.map((n) => {
              const active = activeHref === n.href;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${active ? 'bg-brand-green-50 text-brand-green-900' : 'text-ink-700 hover:bg-paper-2'}`}
                >
                  <MaterialIcon name={n.icon} className="text-xl" />
                  {n.label}
                  {n.href === '/admin/inquiries' && unreadInquiries > 0 && (
                    <span className="ml-auto inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-bold">
                      {unreadInquiries}
                    </span>
                  )}
                  {n.href === '/admin/ai-settings' && aiAlert && (
                    <span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-600" aria-label="AI 額度不足" />
                  )}
                </Link>
              );
            })}

            <div className="my-3 border-t border-line" />

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium text-brand-green-700 hover:bg-brand-green-50 transition"
            >
              <MaterialIcon name="open_in_new" className="text-xl" />
              回到網站
            </Link>
          </nav>
          <div className="p-3 border-t border-line">
            <p className="text-xs text-ink-500 px-3 mb-1">登入身份</p>
            <p className="px-3 mb-2 font-bold text-sm">{username}</p>
            <button onClick={logout} className="w-full text-left text-sm text-ink-500 px-3 py-2 hover:bg-paper-2 rounded-lg">登出</button>
          </div>
        </aside>

        {/* Drawer (mobile) */}
        {open && (
          <>
            <div className="fixed inset-0 bg-ink-900/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
            <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden flex flex-col">
              <div className="p-5 border-b border-line flex items-center justify-between">
                <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2">
                  <Image
                    src="/LOGO_0.png"
                    alt="鼎立租售管理 Dingli Rental Service"
                    width={387}
                    height={44}
                    unoptimized
                    className="h-9 w-auto"
                    style={{ width: 'auto' }}
                  />
                </Link>
                <button onClick={() => setOpen(false)} className="text-xl text-ink-700">
                  <MaterialIcon name="close" className="text-2xl" />
                </button>
              </div>
              <nav className="flex-1 p-3 overflow-y-auto">
                {NAV.map((n) => {
                  const active = activeHref === n.href;
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium transition ${active ? 'bg-brand-green-50 text-brand-green-900' : 'text-ink-700 hover:bg-paper-2'}`}
                    >
                      <MaterialIcon name={n.icon} className="text-2xl" />
                      {n.label}
                      {n.href === '/admin/inquiries' && unreadInquiries > 0 && (
                        <span className="ml-auto inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-[11px] font-bold">
                          {unreadInquiries}
                        </span>
                      )}
                      {n.href === '/admin/ai-settings' && aiAlert && (
                        <span className="ml-auto h-2.5 w-2.5 rounded-full bg-red-600" aria-label="AI 額度不足" />
                      )}
                    </Link>
                  );
                })}

                <div className="my-3 border-t border-line" />

                <Link
                  href="/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium text-brand-green-700 hover:bg-brand-green-50 transition"
                >
                  <MaterialIcon name="open_in_new" className="text-2xl" />
                  回到網站
                </Link>
              </nav>
              <div className="p-4 border-t border-line">
                <p className="text-xs text-ink-500 mb-1">登入身份</p>
                <p className="font-bold text-sm mb-2">{username}</p>
                <button onClick={logout} className="w-full text-sm text-ink-500 py-2 hover:bg-paper-2 rounded-lg text-left">登出</button>
              </div>
            </aside>
          </>
        )}

        {/* Main */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {aiQuota && aiAlert && (
            <Link
              href="/admin/ai-settings"
              className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 transition"
            >
              <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-red-600" aria-hidden />
              <span>
                {aiQuota.exhausted
                  ? 'AI 額度已用盡：AI 翻譯、OCR 辨識、AI 客服已暫停，請聯繫工作室加值。'
                  : `AI 額度剩餘 ${Math.round(aiQuota.remainingRatio * 100)}%（US$${aiQuota.remainingUsd.toFixed(2)}），即將用盡，請聯繫工作室加值。`}
              </span>
            </Link>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
