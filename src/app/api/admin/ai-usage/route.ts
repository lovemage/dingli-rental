import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import {
  AI_LOW_BALANCE_RATIO,
  AI_USAGE_SCOPES,
  isQuotaExhausted,
  loadAiUsageMeter,
  remainingRatio,
  saveAiUsageMeter,
  type AiUsageScope,
} from '@/lib/ai-usage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/ai-usage
 *   無參數：只回額度摘要（後台紅點提醒用，不帶紀錄）
 *   ?scope=chat|property|site&page=1&pageSize=10：另回該分區的分頁紀錄
 */
export async function GET(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const meter = await loadAiUsageMeter();
  const ratio = remainingRatio(meter);
  const summary = {
    totalUsd: meter.totalUsd,
    currentUsd: meter.currentUsd,
    updatedAt: meter.updatedAt,
    remainingRatio: ratio,
    lowBalance: ratio <= AI_LOW_BALANCE_RATIO,
    exhausted: isQuotaExhausted(meter),
    counts: Object.fromEntries(AI_USAGE_SCOPES.map((s) => [s, meter.logs[s].length])),
    topups: meter.topups,
  };

  const url = new URL(req.url);
  const scope = url.searchParams.get('scope');
  if (scope !== 'all' && !AI_USAGE_SCOPES.includes(scope as AiUsageScope)) return NextResponse.json(summary);

  // scope=all：物件、客服、網站內容合併成一張表（新到舊）
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize')) || 100));
  const scopes: AiUsageScope[] = scope === 'all' ? AI_USAGE_SCOPES : [scope as AiUsageScope];
  const entries = scopes
    .flatMap((s) => meter.logs[s].map((e) => ({ ...e, scope: s })))
    .sort((x, y) => (x.at < y.at ? 1 : x.at > y.at ? -1 : 0));
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  const page = Math.min(totalPages, Math.max(1, Number(url.searchParams.get('page')) || 1));
  return NextResponse.json({
    ...summary,
    scope,
    page,
    pageSize,
    totalPages,
    totalEntries: entries.length,
    entries: entries.slice((page - 1) * pageSize, page * pageSize),
  });
}

export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const body = await req.json();
    const patch: { totalUsd?: number; currentUsd?: number } = {};
    if (typeof body.totalUsd === 'number' && body.totalUsd > 0) {
      patch.totalUsd = body.totalUsd;
    }
    if (typeof body.currentUsd === 'number' && body.currentUsd >= 0) {
      patch.currentUsd = body.currentUsd;
    }
    const meter = await saveAiUsageMeter(patch);
    return NextResponse.json({ totalUsd: meter.totalUsd, currentUsd: meter.currentUsd, updatedAt: meter.updatedAt });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '儲存失敗' }, { status: 500 });
  }
}
