/**
 * 一次性：補登舊的 AI 翻譯調用紀錄。
 *
 * 舊版用量紀錄只保留最新 10 筆，更早的紀錄沒有存下來。能回推的只有「每筆物件第一次翻譯」：
 * 以 PropertyTranslation.createdAt 補回「物件 #id → EN／JA」，標記 estimated（補登）。
 *   - 用量依現行規則估算（每次 0.025～0.055 USD 隨機），只用來顯示，不計入目前用量、不動額度。
 *   - 累計／剩餘無法回推（舊估算總和與當時實際扣的額度對不上），後台顯示「—」。
 *   - 只補「最舊一筆現有紀錄」之前的時間，並跳過與現有紀錄相差 10 秒內的，避免重複。
 *   - 重複執行不會重複補登：已補登紀錄的時間就是譯文建立時間，會被「10 秒內」規則略過。
 *   - 2026-11-15 已執行；之後依舊版行為（累計封頂在儲值前總額度 $10）填上累計並移除 estimated 標記。
 *
 *   npx tsx scripts/backfill-ai-usage.ts          # dry-run
 *   npx tsx scripts/backfill-ai-usage.ts --apply  # 實際寫入
 */
import { prisma } from '../src/lib/prisma';
import { loadAiUsageMeter, saveAiUsageMeter, type AiUsageLogEntry } from '../src/lib/ai-usage';

const APPLY = process.argv.includes('--apply');

async function main() {
  const meter = await loadAiUsageMeter();
  const existing = [...meter.logs.property, ...meter.logs.chat, ...meter.logs.site];
  if (meter.logs.property.some((e) => e.estimated)) {
    console.log('已有補登紀錄，略過（不重複補登）');
    return;
  }
  const existingTimes = existing.map((e) => new Date(e.at).getTime()).filter(Number.isFinite);
  const cutoff = existingTimes.length ? Math.min(...existingTimes) : Date.now();

  const translations = await prisma.propertyTranslation.findMany({
    select: { propertyId: true, locale: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const backfill: AiUsageLogEntry[] = [];
  for (const t of translations) {
    const at = t.createdAt.getTime();
    if (at >= cutoff) continue;
    if (existingTimes.some((x) => Math.abs(x - at) < 10_000)) continue;
    backfill.push({
      at: t.createdAt.toISOString(),
      kind: 'translate',
      delta: Number((0.025 + Math.random() * 0.03).toFixed(4)),
      balance: 0,
      label: `物件 #${t.propertyId} → ${t.locale.toUpperCase()}`,
      estimated: true,
    });
  }

  const sum = backfill.reduce((a, e) => a + e.delta, 0);
  console.log(`${APPLY ? 'APPLY' : 'DRY-RUN'}  補登 ${backfill.length} 筆（${backfill.at(-1)?.at ?? '-'} ～ ${backfill[0]?.at ?? '-'}）`);
  console.log(`估算用量合計 $${sum.toFixed(2)}（僅顯示，不計入目前用量 $${meter.currentUsd.toFixed(4)}）`);
  console.log(`現有紀錄：物件 ${meter.logs.property.length}、客服 ${meter.logs.chat.length}、網站 ${meter.logs.site.length}，最舊 ${new Date(cutoff).toISOString()}`);

  if (APPLY && backfill.length) {
    // 現有紀錄（新）在前、補登（舊）在後，維持新到舊
    await saveAiUsageMeter({ logs: { ...meter.logs, property: [...meter.logs.property, ...backfill] } });
    const after = await loadAiUsageMeter();
    console.log(`寫入完成：物件紀錄 ${after.logs.property.length} 筆，目前用量 $${after.currentUsd.toFixed(4)}（不變）`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
