// 物件編號：[L][YY][MMDD][NNN]，共 9 字元。
// - L：中分類字母（TYPE_MID_LETTERS；新類型 fallback 為 'X'）
// - YY：建立年份的後兩碼
// - MMDD：建立月份+日期，兩位數補零
// - NNN：000–999 隨機碼（撞號自動 retry，1000 組合下實務不會撞）

import { prisma } from '@/lib/prisma';
import { TYPE_MID_LETTERS } from '@/data/taiwan-addresses';

// 格式：[L][YY 2 碼][MMDD 4 碼][NNN 3 碼] = 1 + 9 = 10 字元
const CODE_REGEX = /^[A-Z]\d{9}$/;
const MAX_RETRIES = 10;

export function isPropertyCode(input: string): boolean {
  return CODE_REGEX.test(input.trim().toUpperCase());
}

export function normalizePropertyCode(input: string): string {
  return input.trim().toUpperCase();
}

export function letterForType(typeMid: string | null | undefined): string {
  if (!typeMid) return 'X';
  return TYPE_MID_LETTERS[typeMid] || 'X';
}

function pad(n: number, width: number): string {
  return n.toString().padStart(width, '0');
}

/**
 * 純運算：產生一組候選編號（不查 DB）。
 * 給 createPropertyWithCode 在 retry 迴圈裡反覆呼叫；本身沒有 side effect，不會撞 check-then-create race。
 */
export function buildCandidatePropertyCode(typeMid: string, date: Date = new Date()): string {
  const letter = letterForType(typeMid);
  const yy = pad(date.getFullYear() % 100, 2);
  const mmdd = pad(date.getMonth() + 1, 2) + pad(date.getDate(), 2);
  const nnn = pad(Math.floor(Math.random() * 1000), 3);
  return `${letter}${yy}${mmdd}${nnn}`;
}

/**
 * 把 code 產生與 create 包成 atomic retry loop：
 * - 每輪重新 buildCandidatePropertyCode 並嘗試 create
 * - 撞到 Prisma P2002 (unique constraint on `code`) 就再 retry
 * - 其他錯誤直接丟出
 *
 * 同日同字母的命名空間是 1000 組合，concurrent insert 撞號率極低；retry 10 次足夠。
 */
export async function createPropertyWithCode<T>(
  typeMid: string,
  date: Date,
  createFn: (code: string) => Promise<T>
): Promise<T> {
  let lastError: unknown = null;
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = buildCandidatePropertyCode(typeMid, date);
    try {
      return await createFn(code);
    } catch (e: any) {
      // Prisma unique constraint violation
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
  for (let i = 0; i < MAX_RETRIES; i++) {
    const code = buildCandidatePropertyCode(typeMid, date);
    const exists = await prisma.property.findUnique({ where: { code } });
    if (!exists) return code;
  }
  throw new Error('無法產生唯一物件編號（10 次撞號），請稍後再試');
}
