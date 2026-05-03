'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-line">
      <div className="container-page">
        <nav className="flex items-center justify-between h-[76px]">
          <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image src="/LOGO_0.png" alt="鼎立租售管理 Dingli Rental Service" width={220} height={44} priority className="h-11 w-auto" />
          </Link>

          {/* desktop nav */}
          <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
            <li><Link href="/properties" className="font-medium text-ink-700 hover:text-brand-green-700 transition">物件分類</Link></li>
            <li><Link href="/services" className="font-medium text-ink-700 hover:text-brand-green-700 transition">服務特色</Link></li>
            <li><Link href="/careers" className="font-medium text-ink-700 hover:text-brand-green-700 transition">人才招募</Link></li>
            <li><Link href="/contact" className="font-medium text-ink-700 hover:text-brand-green-700 transition">聯絡我們</Link></li>
          </ul>

          <Link href="/contact" className="hidden md:inline-flex btn btn-primary text-sm py-2.5 px-5">
            立即諮詢 <span aria-hidden>→</span>
          </Link>

          <button
            type="button"
            className="md:hidden text-2xl text-brand-green-900"
            aria-label="開啟選單"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '✕' : '☰'}
          </button>
        </nav>

        {/* mobile menu */}
        {open && (
          <div className="md:hidden pb-4">
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              <li><Link href="/properties" className="block py-2 font-medium text-ink-700" onClick={() => setOpen(false)}>物件分類</Link></li>
              <li><Link href="/services" className="block py-2 font-medium text-ink-700" onClick={() => setOpen(false)}>服務特色</Link></li>
              <li><Link href="/careers" className="block py-2 font-medium text-ink-700" onClick={() => setOpen(false)}>人才招募</Link></li>
              <li><Link href="/contact" className="block py-2 font-medium text-ink-700" onClick={() => setOpen(false)}>聯絡我們</Link></li>
              <li><Link href="/contact" className="btn btn-primary text-sm py-2.5 px-5 self-start mt-2" onClick={() => setOpen(false)}>立即諮詢 →</Link></li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );
}
