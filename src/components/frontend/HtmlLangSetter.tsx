'use client';

import { useEffect } from 'react';

/**
 * 在客戶端把 <html lang> 與目前 next-intl locale 同步。
 * 根 layout 為了支援 admin/api 區塊保留 lang="zh-TW"，這個元件負責補上動態調整。
 */
export default function HtmlLangSetter({ locale }: { locale: string }) {
  useEffect(() => {
    const htmlLang =
      locale === 'en' ? 'en' : locale === 'ja' ? 'ja' : 'zh-TW';
    if (typeof document !== 'undefined') {
      document.documentElement.lang = htmlLang;
    }
  }, [locale]);
  return null;
}
