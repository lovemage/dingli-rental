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

  let cachedData: Record<string, unknown> | null = null;
  try {
    const existing = await prisma.siteContent.findUnique({ where: { section: cacheKey } });
    if (existing) {
      const blob = existing.data as unknown as CmsCacheBlob | null;
      if (blob && typeof blob === 'object' && blob.data) {
        cachedData = blob.data;
        if (blob.sourceHash === sourceHash) {
          return blob.data;
        }
      }
    }
  } catch {
    // ignore
  }

  // cache miss / stale：背景刷新翻譯，先回傳舊資料或中文，避免阻塞公開頁 TTFB
  void (async () => {
    try {
      const out = await translateJsonObject(data, locale);
      if (!out || typeof out !== 'object') return;
      const translated = out as Record<string, unknown>;
      const blob: CmsCacheBlob = { sourceHash, data: translated };
      await prisma.siteContent.upsert({
        where: { section: cacheKey },
        create: { section: cacheKey, data: blob as any },
        update: { data: blob as any },
      });
    } catch (e) {
      console.warn(`[cms-translate] ${section}/${locale} refresh failed:`, (e as Error).message);
    }
  })();

  return cachedData ?? data;
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

/**
 * 主動把某個 section 的最新中文資料翻譯成 EN/JA 並寫回 cache。
 * 設計給 admin 儲存後立即觸發（fire-and-forget）。
 *
 * 比起「先刪 cache、等訪客觸發 lazy 翻譯」的舊流程：
 * - 不刪 cache → 翻譯完成前，EN/JA 訪客仍看得到舊翻譯（hash 不符會再觸發背景刷新），不會閃中文。
 * - 任一 locale 翻譯失敗只 console.warn，不影響其他語言，也不影響 admin 儲存。
 *
 * 並發保護（單一 Node process 範圍內）：
 * - In-flight dedupe：同一 `{section, locale, sourceHash}` 已在翻譯中時，回傳既有 promise，避免重複扣 token。
 * - Stale-write guard：翻譯完成後 upsert 前，重新讀取 zh 原始 row 的 hash；若已不符（admin 又存了新版），
 *   放棄寫入，讓較新的 warm 拿到最終定奪權，避免舊翻譯覆蓋新翻譯。
 *
 * 多實例部署時兩個保護皆失效（記憶體不共享 / 仍可能 race），但成本只是多花 token 與短暫不一致，不會壞資料。
 */
const inflightWarms = new Map<string, Promise<void>>();

export async function warmCmsTranslations(
  section: string,
  data: unknown
): Promise<void> {
  if (!data || typeof data !== 'object') return;
  const obj = data as Record<string, unknown>;
  if (Object.keys(obj).length === 0) return;
  const sourceHash = computeHash(obj);
  await Promise.all(
    CACHE_LOCALES.map((locale) => warmOneLocale(section, obj, locale, sourceHash))
  );
}

function warmOneLocale(
  section: string,
  obj: Record<string, unknown>,
  locale: CacheLocale,
  sourceHash: string
): Promise<void> {
  const inflightKey = `${section}__${locale}__${sourceHash}`;
  const existing = inflightWarms.get(inflightKey);
  if (existing) return existing;

  const cacheKey = cacheSection(section, locale);
  const promise = (async () => {
    try {
      const out = await translateJsonObject(obj, locale);
      if (!out || typeof out !== 'object') return;

      // Stale-write guard：避免舊翻譯覆蓋新翻譯。
      // 若 zh 原始 row 的 hash 已經不是我們開始翻譯時的 sourceHash，代表 admin 又存了新版，
      // 此時新版自己的 warm 會接手，舊版翻譯結果不應寫入 cache。
      const zhRow = await prisma.siteContent.findUnique({ where: { section } });
      if (zhRow && computeHash(zhRow.data) !== sourceHash) return;

      const blob: CmsCacheBlob = {
        sourceHash,
        data: out as Record<string, unknown>,
      };
      await prisma.siteContent.upsert({
        where: { section: cacheKey },
        create: { section: cacheKey, data: blob as any },
        update: { data: blob as any },
      });
    } catch (e) {
      console.warn(
        `[cms-translate] warm ${section}/${locale} failed:`,
        (e as Error).message
      );
    } finally {
      inflightWarms.delete(inflightKey);
    }
  })();

  inflightWarms.set(inflightKey, promise);
  return promise;
}
