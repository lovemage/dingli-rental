/* eslint-disable @typescript-eslint/no-require-imports -- 純 node CommonJS 腳本 */
/**
 * 一次性清理：移除物件描述（中文原文＋EN/JA 譯文）中的 591 留言提醒、個人 LINE / 手機、個人宣傳句。
 * 規則與 src/lib/property-description-clean.ts 相同，修改時兩邊一起改。
 *
 *   node scripts/clean-property-descriptions.cjs          # dry-run，只列出會變更的筆數與範例
 *   node scripts/clean-property-descriptions.cjs --apply  # 實際寫入
 *
 * 只用 pg + node 內建模組，可直接在線上容器（railway ssh）執行。
 * 譯文的 sourceHash 若原本與中文內容一致，清理後改成新 hash，避免整批被判定過期而重新翻譯。
 */
const crypto = require('crypto');
const { Client } = require('pg');

const APPLY = process.argv.includes('--apply');

const REMOVE_LINE_RULES = [
  /591.*(留言|訊息|message|メッセージ)|(留言|message|メッセージ).*591/i,
  /^\s*(line|賴)\s*(id)?\s*[:：]\s*@?[\w.-]+\s*$/i,
  /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
  /ho[\s-]*yuan/i,
  /best real estate agent/i,
];

function clean(text) {
  if (typeof text !== 'string' || !text) return text;
  return text
    .split('\n')
    .filter((line) => !REMOVE_LINE_RULES.some((re) => re.test(line)))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const arr = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

/** 與 computePropertySourceHash 相同 */
function sourceHash(p) {
  const payload = JSON.stringify({
    title: p.title,
    description: p.description ?? '',
    featureTags: arr(p.featureTags),
    equipment: arr(p.equipment),
    furniture: arr(p.furniture),
    rentIncludes: arr(p.rentIncludes),
    tenantTypes: arr(p.tenantTypes),
    region: p.region,
    district: p.district,
    street: p.street ?? '',
    community: p.community ?? '',
    typeMid: p.typeMid,
    buildingType: p.buildingType ?? '',
    deposit: p.deposit,
    minLease: p.minLease,
    direction: p.direction ?? '',
    parkingType: p.parkingType ?? '',
    ...(p.facilitiesOther?.trim() ? { facilitiesOther: p.facilitiesOther.trim() } : {}),
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

(async () => {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const props = (await c.query(`SELECT * FROM "Property" ORDER BY id`)).rows;
  const trs = (await c.query(`SELECT id, "propertyId", locale, description, "sourceHash" FROM "PropertyTranslation"`)).rows;
  const trByProp = new Map();
  for (const t of trs) {
    if (!trByProp.has(t.propertyId)) trByProp.set(t.propertyId, []);
    trByProp.get(t.propertyId).push(t);
  }

  let zhChanged = 0, trChanged = 0, hashKept = 0, hashStale = 0;
  const samples = [];
  if (APPLY) await c.query('BEGIN');
  try {
    for (const p of props) {
      const oldHash = sourceHash(p);
      const newDesc = clean(p.description);
      const zhDirty = newDesc !== p.description;
      const newHash = zhDirty ? sourceHash({ ...p, description: newDesc }) : oldHash;
      if (zhDirty) {
        zhChanged++;
        if (samples.length < 2) samples.push({ id: p.id, before: p.description, after: newDesc });
        // 不動 updatedAt：保留排序與「重新上架」等以時間判斷的邏輯
        if (APPLY) await c.query(`UPDATE "Property" SET description = $1 WHERE id = $2`, [newDesc, p.id]);
      }
      for (const t of trByProp.get(p.id) || []) {
        const tDesc = clean(t.description);
        const tDirty = tDesc !== t.description;
        // 原本是最新譯文 → 一起換成新 hash；原本就過期的維持過期，之後照常重譯
        const upToDate = t.sourceHash === oldHash;
        const nextHash = zhDirty && upToDate ? newHash : t.sourceHash;
        if (zhDirty && upToDate) hashKept++;
        else if (zhDirty) hashStale++;
        if (tDirty) trChanged++;
        if ((tDirty || nextHash !== t.sourceHash) && APPLY) {
          await c.query(`UPDATE "PropertyTranslation" SET description = $1, "sourceHash" = $2 WHERE id = $3`, [tDesc, nextHash, t.id]);
        }
      }
    }
    if (APPLY) await c.query('COMMIT');
  } catch (e) {
    if (APPLY) await c.query('ROLLBACK');
    throw e;
  }

  console.log(`${APPLY ? 'APPLIED' : 'DRY-RUN'}  物件總數 ${props.length}`);
  console.log(`中文描述變更 ${zhChanged} 筆，譯文描述變更 ${trChanged} 筆`);
  console.log(`譯文 hash：同步更新 ${hashKept} 筆，原本已過期維持 ${hashStale} 筆`);
  for (const s of samples) console.log(`\n--- #${s.id} BEFORE ---\n${s.before}\n--- #${s.id} AFTER ---\n${s.after}`);
  await c.end();
})().catch((e) => { console.error(e); process.exit(1); });
