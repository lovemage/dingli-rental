import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { translateJsonObject } from '@/lib/openrouter-translate';

/**
 * CMS 區塊（SiteContent.section）懶翻譯。
 *
 * 模式：
 * - 讀取 section 中文版資料時，若 locale=zh 直接回傳。
 * - 否則查詢 SiteContent.section='<section>__<locale>' 是否存在，且 sourceHash 是否相符。
 * - 命中 cache → 直接回傳翻譯版。
 * - 未命中 → 呼叫 OpenRouter 翻譯整包 JSON，寫入 cache，回傳翻譯版。
 *
 * 失敗時 (API 錯誤、JSON parse 失敗等)：fallback 到中文原資料，避免破版。
 */

const CACHE_LOCALES = ['en', 'ja'] as const;
type CacheLocale = (typeof CACHE_LOCALES)[number];

type CmsCacheBlob = {
  sourceHash: string;
  data: Record<string, unknown>;
};

function computeHash(data: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data ?? {}))
    .digest('hex');
}

function cacheSection(section: string, locale: string): string {
  return `${section}__${locale}`;
}

export async function translateCmsSection(
  section: string,
  data: Record<string, unknown>,
  locale: string
): Promise<Record<string, unknown>> {
  if (locale === 'zh' || !data || Object.keys(data).length === 0) return data;
  if (!CACHE_LOCALES.includes(locale as CacheLocale)) return data;

  const sourceHash = computeHash(data);
  const cacheKey = cacheSection(section, locale);

  try {
    const existing = await prisma.siteContent.findUnique({ where: { section: cacheKey } });
    if (existing) {
      const blob = existing.data as unknown as CmsCacheBlob | null;
      if (blob && typeof blob === 'object' && blob.sourceHash === sourceHash && blob.data) {
        return blob.data;
      }
    }
  } catch {
    // ignore — 後面重新翻譯
  }

  // 翻譯
  let translated: Record<string, unknown>;
  try {
    const out = await translateJsonObject(data, locale);
    if (out && typeof out === 'object') {
      translated = out as Record<string, unknown>;
    } else {
      return data;
    }
  } catch (e) {
    console.warn(`[cms-translate] ${section}/${locale} failed:`, (e as Error).message);
    return data;
  }

  // 寫 cache
  try {
    const blob: CmsCacheBlob = { sourceHash, data: translated };
    await prisma.siteContent.upsert({
      where: { section: cacheKey },
      create: { section: cacheKey, data: blob as any },
      update: { data: blob as any },
    });
  } catch (e) {
    console.warn(`[cms-translate] cache write failed for ${cacheKey}:`, (e as Error).message);
  }

  return translated;
}

/** 清除某個 section 的所有翻譯 cache（admin 編輯 section 時呼叫）。 */
export async function invalidateCmsTranslations(section: string): Promise<void> {
  const keys = CACHE_LOCALES.map((loc) => cacheSection(section, loc));
  try {
    await prisma.siteContent.deleteMany({ where: { section: { in: keys } } });
  } catch (e) {
    console.warn('[cms-translate] invalidate failed', (e as Error).message);
  }
}
