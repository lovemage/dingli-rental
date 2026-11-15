/**
 * 一次性：把既有譯文的 sourceHash 從舊算法（所有欄位）換成新算法（只看需要 AI 翻譯的內容）。
 *
 *   npx tsx scripts/migrate-translation-hash.ts          # dry-run，只列筆數
 *   npx tsx scripts/migrate-translation-hash.ts --apply  # 實際寫入
 *
 * 只更新「原本就是最新」的譯文（sourceHash 等於舊算法），換算後仍是最新，不會觸發重譯、不耗 AI 額度；
 * 原本就過期的譯文維持過期，之後照常重譯。不更動 updatedAt 以外的任何內容。
 */
import { prisma } from '../src/lib/prisma';
import {
  computeLegacyPropertySourceHash,
  computePropertySourceHash,
  PROPERTY_SOURCE_SELECT,
} from '../src/lib/property-translate';

const APPLY = process.argv.includes('--apply');

async function main() {
  const properties = await prisma.property.findMany({
    select: { id: true, ...PROPERTY_SOURCE_SELECT, translations: { select: { id: true, sourceHash: true } } },
  });

  let upToDate = 0;
  let stale = 0;
  let updated = 0;
  for (const p of properties) {
    const legacy = computeLegacyPropertySourceHash(p as any);
    const next = computePropertySourceHash(p as any);
    for (const t of p.translations) {
      if (t.sourceHash === next) {
        upToDate++;
        continue;
      }
      if (t.sourceHash !== legacy) {
        stale++;
        continue;
      }
      updated++;
      if (APPLY) {
        await prisma.propertyTranslation.update({ where: { id: t.id }, data: { sourceHash: next } });
      }
    }
  }
  console.log(`${APPLY ? 'APPLIED' : 'DRY-RUN'}  物件 ${properties.length} 筆`);
  console.log(`換成新比對值 ${updated} 筆，已是新比對值 ${upToDate} 筆，原本就過期 ${stale} 筆（維持）`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
