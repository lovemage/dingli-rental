import 'server-only';
import crypto from 'node:crypto';

/**
 * 從 Next.js Request 萃取訪客 IP。
 *
 * 信任原則：只接受由 known 反向代理 / 平台寫入的 header（這些 header 被平台「無條件覆寫」，
 * 訪客自己送 cf-connecting-ip 不會被信任）。x-forwarded-for 屬於使用者可偽造的 header，
 * 預設不採用；除非部署環境明確設定 `TRUST_X_FORWARDED_FOR=1`（意即有自家可信代理在前）。
 *
 * 沒拿到 IP 一律回空字串，由呼叫端略過記錄（不會把所有訪客都歸到同一個空 hash）。
 */
const PLATFORM_TRUSTED_HEADERS = [
  'cf-connecting-ip',         // Cloudflare
  'x-vercel-forwarded-for',   // Vercel
  'fly-client-ip',            // Fly.io
  'x-real-ip',                // 一般 reverse proxy（nginx 等）寫入
];

export function getClientIp(req: Request): string {
  for (const h of PLATFORM_TRUSTED_HEADERS) {
    const v = req.headers.get(h);
    if (!v) continue;
    const ip = v.split(',')[0]?.trim();
    if (ip) return ip;
  }
  // x-forwarded-for 預設視為可偽造，僅當部署明確開啟才接受
  if (process.env.TRUST_X_FORWARDED_FOR === '1') {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
      const first = xff.split(',')[0]?.trim();
      if (first) return first;
    }
  }
  return '';
}

/**
 * SHA-256(salt + ip) → 隱藏明文 IP，避免合規問題。
 * salt 來自 env；未設定就 fallback 一個固定值（local dev OK，prod 請設 TRACKING_SALT）。
 */
export function hashIp(ip: string): string {
  if (!ip) return '';
  const salt = process.env.TRACKING_SALT || 'dingli-tracking-salt-please-override';
  return crypto.createHash('sha256').update(`${salt}::${ip}`).digest('hex');
}

/**
 * 將 Date 對齊到當天 UTC 00:00:00，作為去重粒度。
 * Prisma `@db.Date` 欄位接 JS Date，PG 端只保留日期；給 same-day 比對使用。
 */
export function dayStartUtc(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * 將月份字串「YYYY-MM」解析為 UTC 月份起訖。
 * 給 admin 月份篩選器用。回傳 null 表示格式錯誤。
 */
export function parseMonthRange(monthStr: string): { start: Date; end: Date } | null {
  const m = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]) - 1;
  if (month < 0 || month > 11) return null;
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));
  return { start, end };
}

/**
 * 列出可用月份（從 2026-05 到當月）給 admin selector，由新到舊排列。
 */
export function availableMonths(now: Date = new Date()): string[] {
  const months: string[] = [];
  const cur = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const start = new Date(Date.UTC(2026, 4, 1)); // 2026-05
  while (cur >= start) {
    const y = cur.getUTCFullYear();
    const m = String(cur.getUTCMonth() + 1).padStart(2, '0');
    months.push(`${y}-${m}`);
    cur.setUTCMonth(cur.getUTCMonth() - 1);
  }
  return months;
}
