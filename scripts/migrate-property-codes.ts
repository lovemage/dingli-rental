/**
 * 一次性 migration：
 * 1. 把舊的 typeMid 值 map 到新的 5+1 分類（套房/整層住家/別墅/店面/辦公室/其他）。
 * 2. 為所有沒有 code 的物件產生 code（依 typeMid + createdAt）。
 * 3. 警告：列出 region 不在新清單（台北/新北/桃園）的物件，由 admin 手動處理。
 *
 *   npm run migrate:property-codes
 *
 * Idempotent — 跑第二次只會處理新加入的物件 / 新型 mismatch。
 */

import { prisma } from '../src/lib/prisma';
import { reserveUniqueCodeForMigration } from '../src/lib/property-code';
import { TYPE_MID_LETTERS } from '../src/data/taiwan-addresses';

const TYPE_MID_REMAP: Record<string, string> = {
  獨立套房: '套房',
  分租套房: '套房',
  雅房: '套房',
  車位: '其他',
  // 整層住家 / 其他 不變
};

const ALLOWED_REGIONS = new Set(['台北市', '新北市', '桃園市']);

// 不在 TYPE_MID_LETTERS（admin 加新類型後可能出現）也不在 remap 表的 typeMid，
// 編號會 fallback 為 X 前綴，列出來讓 admin 知道
const KNOWN_TYPES = new Set([
  ...Object.keys(TYPE_MID_LETTERS),
  ...Object.keys(TYPE_MID_REMAP),
]);

async function run() {
  const all = await prisma.property.findMany({
    select: { id: true, code: true, typeMid: true, region: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  let typeRemapped = 0;
  let codeGenerated = 0;
  const deprecatedRegions: Array<{ id: number; region: string }> = [];
  const unknownTypes: Array<{ id: number; typeMid: string }> = [];

  for (const p of all) {
    const updates: { typeMid?: string; code?: string } = {};

    // 1. typeMid remap
    const newType = TYPE_MID_REMAP[p.typeMid];
    if (newType && newType !== p.typeMid) {
      updates.typeMid = newType;
      typeRemapped++;
    }

    // 2. code 補產生（用 update 後的 typeMid 決定字母）
    if (!p.code) {
      const typeForLetter = updates.typeMid ?? p.typeMid;

      // 偵測未知 typeMid：不在 mapping 也不在 letters 表，會 fallback 為 X 前綴
      if (!KNOWN_TYPES.has(typeForLetter)) {
        unknownTypes.push({ id: p.id, typeMid: typeForLetter });
      }

      updates.code = await reserveUniqueCodeForMigration(typeForLetter, p.createdAt);
      codeGenerated++;
    }

    if (Object.keys(updates).length > 0) {
      await prisma.property.update({ where: { id: p.id }, data: updates });
      console.log(
        `  #${p.id}: ${updates.typeMid ? `typeMid=${updates.typeMid}` : ''}${
          updates.code ? ` code=${updates.code}` : ''
        }`
      );
    }

    // 3. region 警告
    if (!ALLOWED_REGIONS.has(p.region)) {
      deprecatedRegions.push({ id: p.id, region: p.region });
    }
  }

  console.log('---');
  console.log(`total scanned: ${all.length}`);
  console.log(`typeMid remapped: ${typeRemapped}`);
  console.log(`code generated:   ${codeGenerated}`);
  if (unknownTypes.length > 0) {
    console.log(
      `\n⚠️  ${unknownTypes.length} 筆物件的 typeMid 不在已知清單，編號用 X 前綴：`
    );
    for (const u of unknownTypes) {
      console.log(`   - id=${u.id} typeMid=${u.typeMid}`);
    }
    console.log(
      '   要矯正可在 /admin/taxonomy 加入該類型並補進 src/data/taiwan-addresses.ts 的 TYPE_MID_LETTERS。'
    );
  }
  if (deprecatedRegions.length > 0) {
    console.log(
      `\n⚠️  ${deprecatedRegions.length} 筆物件的 region 已不在新清單（台北/新北/桃園），請手動處理：`
    );
    for (const d of deprecatedRegions) {
      console.log(`   - id=${d.id} region=${d.region}`);
    }
  } else {
    console.log('region 全部都在新清單內 ✓');
  }
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
