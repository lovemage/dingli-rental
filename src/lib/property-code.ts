// 物件編號：[L][YY][MMDD][NNN]，共 10 字元。
// - L：中分類字母（admin 在 /admin/taxonomy 可調；未設則退到 TYPE_MID_LETTERS；都沒命中為 'X'）
// - YY：建立年份的後兩碼
// - MMDD：建立月份+日期，兩位數補零
// - NNN：000–999 隨機碼（撞號自動 retry，1000 組合下實務不會撞）

import { prisma } from '@/lib/prisma';
import { TYPE_MID_LETTERS } from '@/data/taiwan-addresses';

// 格式：[L][YY 2 碼][MMDD 4 碼][NNN 3 碼] = 1 + 9 = 10 字元
const CODE_REGEX = /^[A-Z]\d{9}$/;
const MAX_RETRIES = 10;
export const PROPERTY_TYPE_LETTERS_SECTION = 'property_type_letters';

export function isPropertyCode(input: string): boolean {
  return CODE_REGEX.test(input.trim().toUpperCase());
}

export function normalizePropertyCode(input: string): string {
  return input.trim().toUpperCase();
}

// 同步 fallback：只用 source 常數（不查 DB）。給 legacy 或無 async 環境使用。
export function letterForType(typeMid: string | null | undefined): string {
  if (!typeMid) return 'X';
  return TYPE_MID_LETTERS[typeMid] || 'X';
}

// DB-aware 版本：先讀 SiteContent('property_type_letters').map（admin 設定的對應），
// 找不到就退回 source TYPE_MID_LETTERS，最後 fallback 'X'。
export async function getPropertyTypeLetters(): Promise<Record<string, string>> {
  try {
    const row = await prisma.siteContent.findUnique({
      where: { section: PROPERTY_TYPE_LETTERS_SECTION },
    });
    if (row?.data && typeof row.data === 'object') {
      const m = (row.data as { map?: unknown }).map;
      if (m && typeof m === 'object' && !Array.isArray(m)) {
        return m as Record<string, string>;
      }
    }
  } catch {
    // ignore — 退回 sync 預設
  }
  return {};
}

export async function resolveLetterForType(typeMid: string | null | undefined): Promise<string> {
  if (!typeMid) return 'X';
  const map = await getPropertyTypeLetters();
  const fromDb = map[typeMid];
  if (typeof fromDb === 'string' && /^[A-Z]$/.test(fromDb)) return fromDb;
  return TYPE_MID_LETTERS[typeMid] || 'X';
}

function pad(n: number, width: number): string {
  return n.toString().padStart(width, '0');
}

function buildCodeFromLetter(letter: string, date: Date): string {
  const yy = pad(date.getFullYear() % 100, 2);
  const mmdd = pad(date.getMonth() + 1, 2) + pad(date.getDate(), 2);
  const nnn = pad(Math.floor(Math.random() * 1000), 3);
  return `${letter}${yy}${mmdd}${nnn}`;
}

/**
 * 純運算：產生一組候選編號（不查 DB，sync letter fallback）。
 * 給特定情境用（例如不想 await letter resolve 的 server-side check）；新流程請改 createPropertyWithCode。
 */
export function buildCandidatePropertyCode(typeMid: string, date: Date = new Date()): string {
  return buildCodeFromLetter(letterForType(typeMid), date);
}

/**
 * 把 code 產生與 create 包成 atomic retry loop：
 * - 開頭 resolve 一次 letter（含 admin DB override），retry 迴圈共用
 * - 每輪 build candidate → prisma.create；撞 P2002 自動 retry
 * - 其他錯誤直接丟出
 */
export async function createPropertyWithCode<T>(
  typeMid: string,
  date: Date,
  createFn: (code: string) => Promise<T>
): Promise<T> {
  const letter = await resolveLetterForType(typeMid);
  let lastError: unknown = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = buildCodeFromLetter(letter, date);
    try {
      return await createFn(code);
    } catch (e: any) {
      if (e?.code === 'P2002' && Array.isArray(e?.meta?.target) && e.meta.target.includes('code')) {
        lastError = e;
        continue;
      }
      throw e;
    }
  }
  throw new Error(
    `無法產生唯一物件編號（${MAX_RETRIES} 次撞號）：${(lastError as Error)?.message || ''}`
  );
}

/**
 * 給 migration / 一次性背景補編號使用：先 buildCandidate 再 findUnique 確認沒撞。
 * 注意：這條路徑有 check-then-create 的理論 race window。
 * 在 migration（單一 process、無 concurrent insert）情境下安全；
 * 不要用在使用者請求路徑——請改用 `createPropertyWithCode`。
 */
export async function reserveUniqueCodeForMigration(
  typeMid: string,
  date: Date = new Date()
): Promise<string> {
  const letter = await resolveLetterForType(typeMid);
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = buildCodeFromLetter(letter, date);
    const exists = await prisma.property.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error('無法產生唯一物件編號（10 次撞號），請稍後再試');
}
