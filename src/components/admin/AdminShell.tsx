'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV = [
  { href: '/admin', label: '儀表板', icon: '📊' },
  { href: '/admin/properties', label: '物件管理', icon: '🏠' },
  { href: '/admin/properties/new', label: '新增物件', icon: '➕' },
  { href: '/admin/hero', label: '首頁輪播', icon: '🖼️' },
  { href: '/admin/settings', label: '帳號設定', icon: '⚙️' },
];

export default function AdminShell({ username, children }: { username: string; children: React.ReactNode }) {
  const path = usePathname() || '';
  const router = useRouter();
  const [open, setOpen] = useState(false);

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
          <button onClick={() => setOpen(true)} className="text-2xl text-ink-700" aria-label="選單">☰</button>
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
              const active = n.href === '/admin' ? path === '/admin' : path.startsWith(n.href);
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium transition ${active ? 'bg-brand-green-50 text-brand-green-900' : 'text-ink-700 hover:bg-paper-2'}`}
                >
                  <span>{n.icon}</span> {n.label}
                </Link>
              );
            })}
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
                <button onClick={() => setOpen(false)} className="text-xl text-ink-700">✕</button>
              </div>
              <nav className="flex-1 p-3 overflow-y-auto">
                {NAV.map((n) => {
                  const active = n.href === '/admin' ? path === '/admin' : path.startsWith(n.href);
                  return (
                    <Link
                      key={n.href}
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-sm font-medium transition ${active ? 'bg-brand-green-50 text-brand-green-900' : 'text-ink-700 hover:bg-paper-2'}`}
                    >
                      <span className="text-lg">{n.icon}</span> {n.label}
                    </Link>
                  );
                })}
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
