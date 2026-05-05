/**
 * 批次翻譯所有物件腳本
 *
 *   npm run translate:all
 *
 * 對所有 status=active 的物件，檢查 EN/JA 翻譯是否存在且 sourceHash 與當前內容一致；
 * 缺失或過期者會呼叫 OpenRouter 重新翻譯並寫入 PropertyTranslation 表。
 *
 * 環境變數需求：
 * - DATABASE_URL（Prisma 連線）
 * - OPENROUTER_API_KEY 或 admin 後台已設定 ai_settings.openrouterApiKey
 * - NEXT_PUBLIC_SITE_URL（可選，預設 dingli-rental.com）
 */

import { prisma } from '../src/lib/prisma';
import {
  translateProperty,
  computePropertySourceHash,
} from '../src/lib/property-translate';

async function main() {
  console.log('▶ 載入所有物件...');
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      title: true,
      description: true,
      featureTags: true,
      equipment: true,
      furniture: true,
      rentIncludes: true,
      tenantTypes: true,
      region: true,
      district: true,
      street: true,
      community: true,
      typeMid: true,
      buildingType: true,
      deposit: true,
      minLease: true,
      direction: true,
      translations: {
        select: { locale: true, sourceHash: true },
      },
    },
    orderBy: { id: 'asc' },
  });

  console.log(`  共 ${properties.length} 筆物件`);

  const targets: { id: number; title: string; missing: string[] }[] = [];
  for (const p of properties) {
    const hash = computePropertySourceHash(p as any);
    const missing: string[] = [];
    for (const loc of ['en', 'ja']) {
      const tr = p.translations.find((t) => t.locale === loc);
      if (!tr || tr.sourceHash !== hash) missing.push(loc);
    }
    if (missing.length) {
      targets.push({ id: p.id, title: p.title, missing });
    }
  }

  if (!targets.length) {
    console.log('✓ 所有物件均已翻譯且為最新版本，無需動作');
    process.exit(0);
  }

  console.log(`▶ 需要翻譯 ${targets.length} 筆物件：`);
  for (const t of targets) {
    console.log(`  - [${t.id}] ${t.title} (缺：${t.missing.join('+')})`);
  }

  let ok = 0;
  let failed = 0;
  for (const t of targets) {
    process.stdout.write(`\n▶ 翻譯 ID=${t.id} ${t.title} ... `);
    const r = await translateProperty(t.id, { skipUpToDate: true });
    if (Object.keys(r.errors).length === 0) {
      ok++;
      console.log(`✓ ${r.translated.join('+')}`);
    } else {
      failed++;
      console.log(`✗ 失敗：${Object.entries(r.errors).map(([k, v]) => `${k}=${v}`).join('; ')}`);
    }
  }

  console.log(`\n=== 完成：成功 ${ok} 筆，失敗 ${failed} 筆 ===`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('腳本執行失敗:', e);
  process.exit(1);
});
