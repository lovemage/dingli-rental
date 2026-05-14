'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  LanguageSwitcherDesktop,
  LanguageSwitcherMobile,
} from './LanguageSwitcher';
import type { HeaderNavContent } from '@/data/header-nav-defaults';

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

type Props = {
  locale: string;
  nav: HeaderNavContent;
};

export default function HeaderClient({ locale, nav }: Props) {
  const [open, setOpen] = useState(false);
  // 仍從 i18n messages 讀的微文案：CTA 按鈕、a11y 標籤、語言切換器
  const t = useTranslations('header');
  const lp = (p: string) => localePath(locale, p);

  return (
    <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-md border-b border-line">
      <div className="container-page">
        <nav className="flex items-center justify-between h-[76px]">
          <Link href={lp('/')} className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <Image
              src="/LOGO_0.png"
              alt="鼎立租售管理 Dingli Rental Service"
              width={387}
              height={44}
              priority
              unoptimized
              className="h-11 w-auto"
              style={{ width: 'auto' }}
            />
          </Link>

          {/* desktop nav */}
          <ul className="hidden md:flex items-center gap-8 list-none m-0 p-0">
            <li>
              <Link href={lp('/properties')} className="font-medium text-ink-700 hover:text-brand-green-700 transition">
                {nav.properties}
              </Link>
            </li>
            <li>
              <Link href={lp('/services')} className="font-medium text-ink-700 hover:text-brand-green-700 transition">
                {nav.services}
              </Link>
            </li>
            <li>
              <Link href={lp('/careers')} className="font-medium text-ink-700 hover:text-brand-green-700 transition">
                {nav.careers}
              </Link>
            </li>
            <li>
              <Link href={lp('/contact')} className="font-medium text-ink-700 hover:text-brand-green-700 transition">
                {nav.contact}
              </Link>
            </li>
          </ul>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcherDesktop />
            <Link href={lp('/contact')} className="btn btn-primary text-sm py-2.5 px-5">
              {t('consultCta')} <span aria-hidden>→</span>
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden text-2xl text-brand-green-900"
            aria-label={open ? t('closeMenu') : t('openMenu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '✕' : '☰'}
          </button>
        </nav>

        {/* mobile menu */}
        {open && (
          <div className="md:hidden pb-4">
            <ul className="flex flex-col gap-3 list-none m-0 p-0">
              <li>
                <Link
                  href={lp('/properties')}
                  className="block py-2 font-medium text-ink-700"
                  onClick={() => setOpen(false)}
                >
                  {nav.properties}
                </Link>
              </li>
              <li>
                <Link
                  href={lp('/services')}
                  className="block py-2 font-medium text-ink-700"
                  onClick={() => setOpen(false)}
                >
                  {nav.services}
                </Link>
              </li>
              <li>
                <Link
                  href={lp('/careers')}
                  className="block py-2 font-medium text-ink-700"
                  onClick={() => setOpen(false)}
                >
                  {nav.careers}
                </Link>
              </li>
              <li>
                <Link
                  href={lp('/contact')}
                  className="block py-2 font-medium text-ink-700"
                  onClick={() => setOpen(false)}
                >
                  {nav.contact}
                </Link>
              </li>
              <li>
                <Link
                  href={lp('/contact')}
                  className="btn btn-primary text-sm py-2.5 px-5 self-start mt-2"
                  onClick={() => setOpen(false)}
                >
                  {t('consultCta')} →
                </Link>
              </li>
            </ul>
            <LanguageSwitcherMobile onPick={() => setOpen(false)} />
          </div>
        )}
      </div>
    </header>
  );
}
