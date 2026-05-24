/**
 * 一次性把 AI / LLM 用量錶歸位的小工具。
 *
 *   npx tsx scripts/set-ai-usage.ts 5.23
 *
 * 第一個參數為要寫入的「目前用量 (currentUsd)」。可選第二個參數覆寫總額度 totalUsd。
 * 使用 saveAiUsageMeter 直接寫入 siteContent.ai_usage_meter，與後台用量錶共用同一份資料。
 */

import 'dotenv/config'; // tsx 直跑時也要能讀到 .env 的 DATABASE_URL
import { loadAiUsageMeter, saveAiUsageMeter } from '../src/lib/ai-usage';

async function main() {
  const currentArg = Number(process.argv[2]);
  const totalArg = process.argv[3] !== undefined ? Number(process.argv[3]) : undefined;

  if (!Number.isFinite(currentArg) || currentArg < 0) {
    console.error('用法：npx tsx scripts/set-ai-usage.ts <currentUsd> [totalUsd]');
    process.exit(1);
  }

  const before = await loadAiUsageMeter();
  console.log('before:', { currentUsd: before.currentUsd, totalUsd: before.totalUsd });

  const after = await saveAiUsageMeter({
    currentUsd: currentArg,
    ...(totalArg !== undefined && Number.isFinite(totalArg) && totalArg > 0
      ? { totalUsd: totalArg }
      : {}),
  });
  console.log('after :', { currentUsd: after.currentUsd, totalUsd: after.totalUsd });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // 確保 Prisma 連線關閉
    const { prisma } = await import('../src/lib/prisma');
    await prisma.$disconnect();
  });
