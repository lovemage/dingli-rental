import { prisma } from '@/lib/prisma';

export type AiUsageKind = 'ocr' | 'translate' | 'chat' | 'other';

/** 紀錄分區：客服、物件（物件翻譯／OCR）、網站內容（CMS 翻譯）分開存，互不擠掉 */
export type AiUsageScope = 'chat' | 'property' | 'site';
export const AI_USAGE_SCOPES: AiUsageScope[] = ['chat', 'property', 'site'];

export type AiUsageLogEntry = {
  at: string;
  kind: AiUsageKind;
  delta: number;
  balance: number;
  /** 例：物件 #478 → EN */
  label?: string;
  /** 補登的舊紀錄：用量為估算值，累計／剩餘無法回推（balance 不使用） */
  estimated?: boolean;
};

export type AiUsageLogs = Record<AiUsageScope, AiUsageLogEntry[]>;

/** 儲值紀錄（由工作室登記；後台唯讀顯示） */
export type AiTopupEntry = {
  at: string;
  amountUsd: number;
  totalAfter: number;
  note?: string;
};

export type AiUsageMeter = {
  totalUsd: number;
  currentUsd: number;
  updatedAt: string;
  logs: AiUsageLogs;
  topups: AiTopupEntry[];
};

const SECTION = 'ai_usage_meter';
const DEFAULT_TOTAL_USD = 10;
const DEFAULT_CURRENT_USD = 0.52;
const INCREMENT_MIN = 0.025;
const INCREMENT_MAX = 0.055;
/** 每個分區保留的筆數上限（含補登的舊紀錄） */
const LOG_LIMIT = 5000;
/** 剩餘額度低於此比例時，後台顯示紅點提醒 */
export const AI_LOW_BALANCE_RATIO = 0.2;

const VALID_KINDS: AiUsageKind[] = ['ocr', 'translate', 'chat', 'other'];

function emptyLogs(): AiUsageLogs {
  return { chat: [], property: [], site: [] };
}

function sanitizeLog(raw: unknown): AiUsageLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      const at = typeof item?.at === 'string' ? item.at : '';
      const kind: AiUsageKind = VALID_KINDS.includes(item?.kind) ? item.kind : 'other';
      const delta = Number(item?.delta);
      const balance = Number(item?.balance);
      if (!at || !Number.isFinite(delta) || !Number.isFinite(balance)) return null;
      const entry: AiUsageLogEntry = { at, kind, delta, balance };
      if (typeof item?.label === 'string' && item.label.trim()) entry.label = item.label.trim().slice(0, 80);
      if (item?.estimated === true) entry.estimated = true;
      return entry;
    })
    .filter((x): x is AiUsageLogEntry => x !== null)
    .slice(0, LOG_LIMIT);
}

function sanitizeLogs(data: any): AiUsageLogs {
  const logs = emptyLogs();
  if (data?.logs && typeof data.logs === 'object') {
    for (const scope of AI_USAGE_SCOPES) logs[scope] = sanitizeLog(data.logs[scope]);
  }
  // 舊版單一 log：客服歸客服，其餘（翻譯／OCR）歸物件
  if (Array.isArray(data?.log)) {
    for (const entry of sanitizeLog(data.log)) {
      (entry.kind === 'chat' ? logs.chat : logs.property).push(entry);
    }
  }
  return logs;
}

function sanitizeTopups(raw: unknown): AiTopupEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((t: any) => {
      const at = typeof t?.at === 'string' ? t.at : '';
      const amountUsd = Number(t?.amountUsd);
      const totalAfter = Number(t?.totalAfter);
      if (!at || !Number.isFinite(amountUsd) || !Number.isFinite(totalAfter)) return null;
      const entry: AiTopupEntry = { at, amountUsd, totalAfter };
      if (typeof t?.note === 'string' && t.note.trim()) entry.note = t.note.trim().slice(0, 100);
      return entry;
    })
    .filter((x): x is AiTopupEntry => x !== null)
    .slice(0, 100);
}

function normalize(data: any): AiUsageMeter {
  const totalUsd = Number(data?.totalUsd);
  const currentUsd = Number(data?.currentUsd);
  return {
    totalUsd: Number.isFinite(totalUsd) && totalUsd > 0 ? totalUsd : DEFAULT_TOTAL_USD,
    currentUsd: Number.isFinite(currentUsd) && currentUsd >= 0 ? currentUsd : DEFAULT_CURRENT_USD,
    updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    logs: sanitizeLogs(data),
    topups: sanitizeTopups(data?.topups),
  };
}

export async function loadAiUsageMeter(): Promise<AiUsageMeter> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: SECTION } });
    if (!row) {
      const seeded: AiUsageMeter = {
        totalUsd: DEFAULT_TOTAL_USD,
        currentUsd: DEFAULT_CURRENT_USD,
        updatedAt: new Date().toISOString(),
        logs: emptyLogs(),
        topups: [],
      };
      await prisma.siteContent
        .upsert({
          where: { section: SECTION },
          create: { section: SECTION, data: seeded as any },
          update: { data: seeded as any },
        })
        .catch(() => null);
      return seeded;
    }
    return normalize(row.data);
  } catch {
    return {
      totalUsd: DEFAULT_TOTAL_USD,
      currentUsd: DEFAULT_CURRENT_USD,
      updatedAt: new Date().toISOString(),
      logs: emptyLogs(),
      topups: [],
    };
  }
}

export async function saveAiUsageMeter(
  patch: Partial<Pick<AiUsageMeter, 'totalUsd' | 'currentUsd' | 'logs' | 'topups'>>,
): Promise<AiUsageMeter> {
  const current = await loadAiUsageMeter();
  const next: AiUsageMeter = {
    totalUsd: patch.totalUsd ?? current.totalUsd,
    currentUsd: Math.max(0, patch.currentUsd ?? current.currentUsd),
    updatedAt: new Date().toISOString(),
    logs: patch.logs ? sanitizeLogs({ logs: patch.logs }) : current.logs,
    topups: patch.topups ? sanitizeTopups(patch.topups) : current.topups,
  };
  await prisma.siteContent.upsert({
    where: { section: SECTION },
    create: { section: SECTION, data: next as any },
    update: { data: next as any },
  });
  return next;
}

function defaultScope(kind: AiUsageKind): AiUsageScope {
  if (kind === 'chat') return 'chat';
  if (kind === 'ocr') return 'property';
  return 'site';
}

/**
 * 每次成功呼叫 LLM 後呼叫一次，會在 0.025 ~ 0.055 USD 之間隨機累加，
 * 並寫入對應分區的 log（newest first）。失敗時靜默吞掉錯誤。
 */
// 用量是「讀出 → 累加 → 寫回」，同時多筆（例：EN/JA 翻譯＋客服）會互相覆蓋造成漏記；
// 同一個 process 內排隊依序寫入。
let usageWriteQueue: Promise<void> = Promise.resolve();

export function recordAiUsage(
  kind: AiUsageKind = 'other',
  opts: { scope?: AiUsageScope; label?: string } = {},
): Promise<void> {
  usageWriteQueue = usageWriteQueue.then(() => writeAiUsage(kind, opts));
  return usageWriteQueue;
}

async function writeAiUsage(kind: AiUsageKind, opts: { scope?: AiUsageScope; label?: string }): Promise<void> {
  try {
    const delta = INCREMENT_MIN + Math.random() * (INCREMENT_MAX - INCREMENT_MIN);
    const current = await loadAiUsageMeter();
    const nextUsd = Math.min(current.totalUsd, current.currentUsd + delta);
    const entry: AiUsageLogEntry = {
      at: new Date().toISOString(),
      kind,
      delta: Number(delta.toFixed(4)),
      balance: Number(nextUsd.toFixed(4)),
    };
    if (opts.label) entry.label = opts.label;
    const scope = opts.scope ?? defaultScope(kind);
    const logs = { ...current.logs, [scope]: [entry, ...current.logs[scope]].slice(0, LOG_LIMIT) };
    await saveAiUsageMeter({ currentUsd: nextUsd, logs });
  } catch {
    // 統計失敗不影響使用者
  }
}

/** 剩餘比例（0~1） */
export function remainingRatio(meter: Pick<AiUsageMeter, 'totalUsd' | 'currentUsd'>): number {
  if (meter.totalUsd <= 0) return 0;
  return Math.max(0, (meter.totalUsd - meter.currentUsd) / meter.totalUsd);
}

export const AI_QUOTA_EXHAUSTED_MESSAGE = 'AI 額度已用盡，AI 功能已暫停，請聯繫工作室加值';

export class AiQuotaExhaustedError extends Error {
  constructor() {
    super(AI_QUOTA_EXHAUSTED_MESSAGE);
    this.name = 'AiQuotaExhaustedError';
  }
}

/** 用量已達總額度（recordAiUsage 會把 currentUsd 封頂在 totalUsd）。 */
export function isQuotaExhausted(meter: Pick<AiUsageMeter, 'totalUsd' | 'currentUsd'>): boolean {
  return meter.currentUsd >= meter.totalUsd - 1e-6;
}

export async function isAiQuotaExhausted(): Promise<boolean> {
  return isQuotaExhausted(await loadAiUsageMeter());
}

/** 每次呼叫 LLM 前檢查；額度用盡時丟出 AiQuotaExhaustedError，不呼叫 AI。 */
export async function assertAiQuotaAvailable(): Promise<void> {
  if (await isAiQuotaExhausted()) throw new AiQuotaExhaustedError();
}
