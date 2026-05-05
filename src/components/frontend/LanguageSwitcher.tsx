'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { routing } from '@/i18n/routing';

const LOCALE_LABEL: Record<string, { short: string; long: string }> = {
  zh: { short: '中', long: '中文' },
  en: { short: 'EN', long: 'English' },
  ja: { short: 'JP', long: '日本語' },
};

function buildLocalePath(pathname: string, currentLocale: string, nextLocale: string) {
  // 移除路徑開頭的 locale segment（若有）
  const stripped = pathname.replace(
    new RegExp(`^/(?:${routing.locales.join('|')})(?=/|$)`),
    ''
  ) || '/';

  if (nextLocale === routing.defaultLocale) {
    return stripped;
  }
  return `/${nextLocale}${stripped === '/' ? '' : stripped}`;
}

/** 桌面版：globe icon + 下拉 */
export function LanguageSwitcherDesktop() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('header');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const switchTo = (next: string) => {
    setOpen(false);
    router.replace(buildLocalePath(pathname, locale, next));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={t('language')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-full border border-line text-ink-700 hover:border-brand-green-500 hover:text-brand-green-700 transition text-sm font-medium"
      >
        <span className="material-symbols-rounded !text-[20px]">language</span>
        <span className="font-bold">{LOCALE_LABEL[locale]?.short ?? locale.toUpperCase()}</span>
        <span className="material-symbols-rounded !text-[18px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 min-w-[140px] bg-white border border-line rounded-xl shadow-lg overflow-hidden z-50"
        >
          {routing.locales.map((code) => (
            <button
              key={code}
              role="menuitemradio"
              aria-checked={code === locale}
              onClick={() => switchTo(code)}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-paper-2 transition flex items-center justify-between ${
                code === locale ? 'text-brand-green-700 font-bold' : 'text-ink-700'
              }`}
            >
              <span>{LOCALE_LABEL[code]?.long ?? code}</span>
              {code === locale && (
                <span className="material-symbols-rounded !text-[18px]">check</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** 行動版：選單內的語言區塊 */
export function LanguageSwitcherMobile({ onPick }: { onPick?: () => void }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('header');

  const switchTo = (next: string) => {
    onPick?.();
    router.replace(buildLocalePath(pathname, locale, next));
  };

  return (
    <div className="border-t border-line pt-3 mt-3">
      <p className="text-xs uppercase tracking-wider text-ink-500 font-bold mb-2 flex items-center gap-1.5">
        <span className="material-symbols-rounded !text-[16px]">language</span>
        {t('language')}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {routing.locales.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={`py-2 rounded-lg border text-sm font-bold transition ${
              code === locale
                ? 'bg-brand-green-700 text-white border-brand-green-700'
                : 'bg-white text-ink-700 border-line hover:border-brand-green-500'
            }`}
          >
            {LOCALE_LABEL[code]?.long ?? code}
          </button>
        ))}
      </div>
    </div>
  );
}
