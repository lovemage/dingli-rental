import { getLocale, getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { translateCmsSection } from '@/lib/cms-translate';
import { HEADER_NAV_DEFAULTS, type HeaderNavContent } from '@/data/header-nav-defaults';
import HeaderClient from './HeaderClient';

// 從不可信來源（DB JSON / 翻譯 LLM 回傳）抓字串欄位；空字串或非 string 都退回 fallback。
function pickString(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim().length > 0 ? v : fallback;
}

// 翻譯快取若資料殘缺（LLM 漏譯、key 對不上），per-field 退回 admin 輸入的中文版，
// 避免全站 header 出現空白或 [object Object]。
function normalizeNav(
  raw: unknown,
  fallback: HeaderNavContent
): HeaderNavContent {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    properties: pickString(r.properties, fallback.properties),
    services: pickString(r.services, fallback.services),
    careers: pickString(r.careers, fallback.careers),
    contact: pickString(r.contact, fallback.contact),
  };
}

// 讀取後台「頁首導覽」設定。
// - 若 admin 從未儲存過 → DB row 為空 → fallback 至 messages/{locale}.json 的 header.* 既有翻譯，
//   避免 day-1 部署時 EN/JA 看到中文 default。
// - 若 admin 已儲存過 → 用 DB 中文版資料，再走 translateCmsSection 拿 EN/JA 翻譯快取
//   （admin 儲存當下會由 /api/content PUT 觸發 warmCmsTranslations 預熱）。
async function getHeaderNav(locale: string): Promise<HeaderNavContent> {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { section: 'header_nav' },
    });
    if (row?.data && typeof row.data === 'object') {
      const merged: HeaderNavContent = normalizeNav(row.data, HEADER_NAV_DEFAULTS);
      if (locale === 'zh') return merged;
      const translated = await translateCmsSection(
        'header_nav',
        merged as unknown as Record<string, unknown>,
        locale
      );
      return normalizeNav(translated, merged);
    }
  } catch {
    // ignore — fall through to i18n messages
  }
  try {
    const t = await getTranslations({ locale, namespace: 'header' });
    return {
      properties: t('properties'),
      services: t('services'),
      careers: t('careers'),
      contact: t('contact'),
    };
  } catch {
    return HEADER_NAV_DEFAULTS;
  }
}

export default async function Header() {
  const locale = await getLocale();
  const nav = await getHeaderNav(locale);
  return <HeaderClient locale={locale} nav={nav} />;
}
