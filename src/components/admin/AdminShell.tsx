'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import MaterialIcon from '@/components/admin/MaterialIcon';

const NAV = [
  { href: '/admin', label: '儀表板', icon: 'dashboard' },
  { href: '/admin/properties/new', label: '新增物件', icon: 'add_circle' },
  { href: '/admin/properties', label: '物件管理', icon: 'home_work' },
  { href: '/admin/inquiries', label: '客戶詢問', icon: 'mark_email_unread' },
  { href: '/admin/hero', label: '首頁管理', icon: 'imagesmode' },
  { href: '/admin/taxonomy', label: '標籤與分類', icon: 'sell' },
  { href: '/admin/testimonials', label: '評論管理', icon: 'rate_review' },
  { href: '/admin/careers', label: '人才招募', icon: 'work' },
  { href: '/admin/contact', label: '聯絡頁面', icon: 'contact_mail' },
  { href: '/admin/floating-cta', label: '浮動按鈕', icon: 'support_agent' },
  { href: '/admin/ai-settings', label: 'AI 設定', icon: 'auto_awesome' },
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

export default function AdminShell({ username, children }: { username: string; children: React.ReactNode }) {
  const path = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const activeHref = useMemo(() => getActiveHref(path), [path]);

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
          <button onClick={() => setOpen(true)} className="text-2xl text-ink-700" aria-label="選單">
            <MaterialIcon name="menu" className="text-3xl" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/LOGO_0.png" alt="" width={140} height={28} className="h-7 w-auto" />
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
              <Image src="/LOGO_0.png" alt="鼎立租售管理" width={180} height={36} className="h-9 w-auto" />
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
                  <Image src="/LOGO_0.png" alt="" width={150} height={32} className="h-8 w-auto" />
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
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
