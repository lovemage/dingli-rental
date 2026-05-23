import { prisma } from '@/lib/prisma';

export type AiUsageKind = 'ocr' | 'translate' | 'chat' | 'other';

export type AiUsageLogEntry = {
  at: string;
  kind: AiUsageKind;
  delta: number;
  balance: number;
};

export type AiUsageMeter = {
  totalUsd: number;
  currentUsd: number;
  updatedAt: string;
  log: AiUsageLogEntry[];
};

const SECTION = 'ai_usage_meter';
const DEFAULT_TOTAL_USD = 10;
const DEFAULT_CURRENT_USD = 0.52;
const INCREMENT_MIN = 0.025;
const INCREMENT_MAX = 0.055;
const LOG_LIMIT = 10;

const VALID_KINDS: AiUsageKind[] = ['ocr', 'translate', 'chat', 'other'];

function sanitizeLog(raw: unknown): AiUsageLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: any) => {
      const at = typeof item?.at === 'string' ? item.at : '';
      const kind: AiUsageKind = VALID_KINDS.includes(item?.kind) ? item.kind : 'other';
      const delta = Number(item?.delta);
      const balance = Number(item?.balance);
      if (!at || !Number.isFinite(delta) || !Number.isFinite(balance)) return null;
      return { at, kind, delta, balance } satisfies AiUsageLogEntry;
    })
    .filter((x): x is AiUsageLogEntry => x !== null)
    .slice(0, LOG_LIMIT);
}

function normalize(data: any): AiUsageMeter {
  const totalUsd = Number(data?.totalUsd);
  const currentUsd = Number(data?.currentUsd);
  return {
    totalUsd: Number.isFinite(totalUsd) && totalUsd > 0 ? totalUsd : DEFAULT_TOTAL_USD,
    currentUsd: Number.isFinite(currentUsd) && currentUsd >= 0 ? currentUsd : DEFAULT_CURRENT_USD,
    updatedAt: typeof data?.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    log: sanitizeLog(data?.log),
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
        log: [],
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
      log: [],
    };
  }
}

export async function saveAiUsageMeter(
  patch: Partial<Pick<AiUsageMeter, 'totalUsd' | 'currentUsd' | 'log'>>,
): Promise<AiUsageMeter> {
  const current = await loadAiUsageMeter();
  const next: AiUsageMeter = {
    totalUsd: patch.totalUsd ?? current.totalUsd,
    currentUsd: Math.max(0, patch.currentUsd ?? current.currentUsd),
    updatedAt: new Date().toISOString(),
    log: patch.log ? sanitizeLog(patch.log) : current.log,
  };
  await prisma.siteContent.upsert({
    where: { section: SECTION },
    create: { section: SECTION, data: next as any },
    update: { data: next as any },
  });
  return next;
}

/**
 * 每次成功呼叫 LLM 後呼叫一次，會在 0.025 ~ 0.055 USD 之間隨機累加，
 * 並寫入最新 10 筆 log（newest first）。失敗時靜默吞掉錯誤。
 */
export async function recordAiUsage(kind: AiUsageKind = 'other'): Promise<void> {
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
    const nextLog = [entry, ...current.log].slice(0, LOG_LIMIT);
    await saveAiUsageMeter({ currentUsd: nextUsd, log: nextLog });
  } catch {
    // 統計失敗不影響使用者
  }
}
