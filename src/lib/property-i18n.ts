/**
 * 物件固定選項的多語對照表。
 *
 * 後台下拉／勾選產生的固定值（押金、車位、建物類型、行政區、設備……）
 * 直接查表顯示英文／日文，不依賴 AI 翻譯：
 *   - AI 翻譯可能失敗或過期，固定選項不該因此在 en/ja 頁面露出中文。
 *   - 查不到的值（admin 在 taxonomy 自訂的新選項、自由輸入）才退回 AI 翻譯結果。
 *
 * 純函式、無 server 依賴，server / client component 都可 import。
 */

export type PropertyLocale = 'zh' | 'en' | 'ja';

type Dict = Record<string, { en: string; ja: string }>;

export function normalizeLocale(locale: string | null | undefined): PropertyLocale {
  if (locale === 'en') return 'en';
  if (locale === 'ja' || locale === 'jp') return 'ja';
  return 'zh';
}

const REGION: Dict = {
  台北市: { en: 'Taipei City', ja: '台北市' },
  臺北市: { en: 'Taipei City', ja: '台北市' },
  新北市: { en: 'New Taipei City', ja: '新北市' },
  桃園市: { en: 'Taoyuan City', ja: '桃園市' },
  基隆市: { en: 'Keelung City', ja: '基隆市' },
  新竹市: { en: 'Hsinchu City', ja: '新竹市' },
  新竹縣: { en: 'Hsinchu County', ja: '新竹県' },
};

const DISTRICT_EN: Record<string, string> = {
  // 台北市
  中正區: 'Zhongzheng', 大同區: 'Datong', 中山區: 'Zhongshan', 松山區: 'Songshan',
  大安區: "Da'an", 萬華區: 'Wanhua', 信義區: 'Xinyi', 士林區: 'Shilin',
  北投區: 'Beitou', 內湖區: 'Neihu', 南港區: 'Nangang', 文山區: 'Wenshan',
  // 新北市
  板橋區: 'Banqiao', 三重區: 'Sanchong', 中和區: 'Zhonghe', 永和區: 'Yonghe',
  新莊區: 'Xinzhuang', 新店區: 'Xindian', 土城區: 'Tucheng', 蘆洲區: 'Luzhou',
  汐止區: 'Xizhi', 樹林區: 'Shulin', 鶯歌區: 'Yingge', 三峽區: 'Sanxia',
  淡水區: 'Tamsui', 瑞芳區: 'Ruifang', 五股區: 'Wugu', 泰山區: 'Taishan',
  林口區: 'Linkou', 深坑區: 'Shenkeng', 石碇區: 'Shiding', 坪林區: 'Pinglin',
  三芝區: 'Sanzhi', 石門區: 'Shimen', 八里區: 'Bali', 平溪區: 'Pingxi',
  雙溪區: 'Shuangxi', 貢寮區: 'Gongliao', 金山區: 'Jinshan', 萬里區: 'Wanli',
  烏來區: 'Wulai',
  // 桃園市
  桃園區: 'Taoyuan', 中壢區: 'Zhongli', 平鎮區: 'Pingzhen', 八德區: 'Bade',
  楊梅區: 'Yangmei', 蘆竹區: 'Luzhu', 大溪區: 'Daxi', 龍潭區: 'Longtan',
  龜山區: 'Guishan', 大園區: 'Dayuan', 觀音區: 'Guanyin', 新屋區: 'Xinwu',
  復興區: 'Fuxing',
};

const TYPE_MID: Dict = {
  雅房: { en: 'Room (Shared Bath)', ja: 'シェアルーム（共用バス）' },
  分租套房: { en: 'Room with Private Bath', ja: 'バス付き個室' },
  獨立套房: { en: 'Studio', ja: 'ワンルーム' },
  套房: { en: 'Studio', ja: 'ワンルーム' },
  整層住家: { en: 'Whole-Floor Residence', ja: 'フロア貸し住宅' },
  別墅: { en: 'Villa', ja: '一戸建て' },
  辦公: { en: 'Office', ja: 'オフィス' },
  辦公室: { en: 'Office', ja: 'オフィス' },
  住辦: { en: 'Residential / Office', ja: '住居兼オフィス' },
  店面: { en: 'Shop', ja: '店舗' },
  其他: { en: 'Other', ja: 'その他' },
};

const BUILDING_TYPE: Dict = {
  公寓: { en: 'Walk-up Apartment', ja: 'アパート' },
  透天厝: { en: 'Townhouse', ja: '戸建て' },
  電梯大樓: { en: 'Elevator Building', ja: 'エレベーター付きマンション' },
  華廈: { en: 'Mid-rise Building', ja: '中層マンション' },
};

const DEPOSIT: Dict = {
  面議: { en: 'Negotiable', ja: '応相談' },
  一個月: { en: '1 month', ja: '1ヶ月分' },
  一個半月: { en: '1.5 months', ja: '1.5ヶ月分' },
  兩個月: { en: '2 months', ja: '2ヶ月分' },
  二個月: { en: '2 months', ja: '2ヶ月分' },
  三個月: { en: '3 months', ja: '3ヶ月分' },
  無: { en: 'None', ja: 'なし' },
};

const PARKING: Dict = {
  '平面式,已含租金內': { en: 'Flat parking (included in rent)', ja: '平置き駐車場（家賃込み）' },
  '平面式,費用另計': { en: 'Flat parking (extra fee)', ja: '平置き駐車場（別途料金）' },
  '機械式,已含租金內': { en: 'Mechanical parking (included in rent)', ja: '機械式駐車場（家賃込み）' },
  '機械式,費用另計': { en: 'Mechanical parking (extra fee)', ja: '機械式駐車場（別途料金）' },
  '機械+平面,已含租金內': { en: 'Mechanical + flat parking (included in rent)', ja: '機械式＋平置き駐車場（家賃込み）' },
  '機械+平面,費用另計': { en: 'Mechanical + flat parking (extra fee)', ja: '機械式＋平置き駐車場（別途料金）' },
};

const DIRECTION: Dict = {
  朝北: { en: 'North-facing', ja: '北向き' },
  朝南: { en: 'South-facing', ja: '南向き' },
  朝東: { en: 'East-facing', ja: '東向き' },
  朝西: { en: 'West-facing', ja: '西向き' },
  朝東北: { en: 'Northeast-facing', ja: '北東向き' },
  朝東南: { en: 'Southeast-facing', ja: '南東向き' },
  朝西北: { en: 'Northwest-facing', ja: '北西向き' },
  朝西南: { en: 'Southwest-facing', ja: '南西向き' },
};

const MIN_LEASE: Dict = {
  一年: { en: '1 year', ja: '1年' },
  半年: { en: '6 months', ja: '6ヶ月' },
  三個月: { en: '3 months', ja: '3ヶ月' },
  不限: { en: 'No minimum', ja: '制限なし' },
};

// 設備、家具、身份、租金包含、制度型標籤：同一張表即可，key 不會衝突
const LIST_ITEMS: Dict = {
  // 設備 / 家具
  洗衣機: { en: 'Washing machine', ja: '洗濯機' },
  冰箱: { en: 'Refrigerator', ja: '冷蔵庫' },
  電視: { en: 'TV', ja: 'テレビ' },
  冷氣: { en: 'Air conditioner', ja: 'エアコン' },
  熱水器: { en: 'Water heater', ja: '給湯器' },
  天然瓦斯: { en: 'Natural gas', ja: '都市ガス' },
  床: { en: 'Bed', ja: 'ベッド' },
  衣櫃: { en: 'Wardrobe', ja: 'クローゼット' },
  沙發: { en: 'Sofa', ja: 'ソファ' },
  網路: { en: 'Internet', ja: 'インターネット' },
  第四台: { en: 'Cable TV', ja: 'ケーブルテレビ' },
  桌子: { en: 'Table', ja: 'テーブル' },
  椅子: { en: 'Chair', ja: '椅子' },
  // 身份
  學生: { en: 'Students', ja: '学生' },
  上班族: { en: 'Professionals', ja: '会社員' },
  家庭: { en: 'Families', ja: 'ファミリー' },
  // 租金包含
  管理費: { en: 'Management fee', ja: '管理費' },
  清潔費: { en: 'Cleaning fee', ja: '清掃費' },
  水費: { en: 'Water', ja: '水道代' },
  電費: { en: 'Electricity', ja: '電気代' },
  瓦斯費: { en: 'Gas', ja: 'ガス代' },
  // 制度型標籤
  社會住宅: { en: 'Social housing', ja: '社会住宅' },
  租金補貼: { en: 'Rent subsidy eligible', ja: '家賃補助対象' },
  高齡友善: { en: 'Senior-friendly', ja: '高齢者にやさしい' },
  可報稅: { en: 'Rent tax-deductible', ja: '家賃の税控除可' },
  可入籍: { en: 'Household registration OK', ja: '住民登録可' },
  可租補: { en: 'Rent subsidy OK', ja: '家賃補助可' },
  // 公設
  交誼廳: { en: 'Lounge', ja: 'ラウンジ' },
  健身房: { en: 'Gym', ja: 'フィットネスジム' },
  泳池: { en: 'Swimming pool', ja: 'プール' },
  餐廳: { en: 'Restaurant', ja: 'レストラン' },
  閱覽室: { en: 'Reading room', ja: '読書室' },
  瑜伽教室: { en: 'Yoga room', ja: 'ヨガルーム' },
};

const RENT_TAX: Dict = {
  含稅: { en: 'Tax included', ja: '税込' },
  不含稅: { en: 'Tax excluded', ja: '税別' },
};

export type FixedField =
  | 'region'
  | 'typeMid'
  | 'buildingType'
  | 'deposit'
  | 'parkingType'
  | 'direction'
  | 'rentTax'
  | 'minLease';

const FIELD_DICT: Record<Exclude<FixedField, 'minLease'>, Dict> = {
  region: REGION,
  typeMid: TYPE_MID,
  buildingType: BUILDING_TYPE,
  deposit: DEPOSIT,
  parkingType: PARKING,
  direction: DIRECTION,
  rentTax: RENT_TAX,
};

function formatLeaseMonths(months: number, locale: 'en' | 'ja'): string {
  if (!Number.isFinite(months) || months <= 0) return '';
  const m = Math.floor(months);
  const years = Math.floor(m / 12);
  const rest = m % 12;
  if (locale === 'ja') {
    if (years === 0) return `${rest}ヶ月`;
    return rest ? `${years}年${rest}ヶ月` : `${years}年`;
  }
  const y = years ? `${years} year${years > 1 ? 's' : ''}` : '';
  const mo = rest ? `${rest} month${rest > 1 ? 's' : ''}` : '';
  return [y, mo].filter(Boolean).join(' ');
}

/** 固定選項查表；查不到回傳 null（呼叫端再退回 AI 翻譯或原值）。 */
export function lookupFixed(field: FixedField, value: string | null | undefined, locale: string): string | null {
  const loc = normalizeLocale(locale);
  if (loc === 'zh' || !value) return null;
  const v = value.trim();
  if (field === 'minLease') {
    if (v.startsWith('自訂:')) return formatLeaseMonths(Number(v.slice(3)), loc) || null;
    return MIN_LEASE[v]?.[loc] ?? null;
  }
  if (field === 'parkingType') {
    // 容錯：全形逗號 / 多餘空白
    const key = v.replace(/，/g, ',').replace(/\s+/g, '');
    return PARKING[key]?.[loc] ?? null;
  }
  return FIELD_DICT[field][v]?.[loc] ?? null;
}

/**
 * 固定選項是否在對照表內（英、日文都查得到）。
 * 查得到的值前台直接查表顯示，不需要 AI 翻譯，也不列入「需重新翻譯」的比對。
 */
export function isKnownFixed(field: FixedField, value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true; // 空值不需要翻譯
  return lookupFixed(field, value, 'en') !== null && lookupFixed(field, value, 'ja') !== null;
}

export function isKnownDistrict(value: string | null | undefined): boolean {
  if (!value || !value.trim()) return true;
  return lookupDistrict(value, 'en') !== null;
}

/** 陣列（設備、家具、標籤…）是否每一項都在對照表內 */
export function isAllKnownListItems(items: readonly string[]): boolean {
  return items.every((item) => Boolean(LIST_ITEMS[item.trim()]));
}

/** 行政區：en 用拼音 + District；ja 保留漢字（日文讀者看得懂）。 */
export function lookupDistrict(value: string | null | undefined, locale: string): string | null {
  const loc = normalizeLocale(locale);
  if (loc === 'zh' || !value) return null;
  const v = value.trim();
  if (loc === 'ja') return v.endsWith('區') ? `${v.slice(0, -1)}区` : v;
  const name = DISTRICT_EN[v];
  return name ? `${name} District` : null;
}

/**
 * 陣列欄位（設備、家具、身份、租金包含、特色標籤）在地化：
 * 每個項目先查固定表；查不到時，若 AI 翻譯陣列長度與原陣列相同，取同位置的翻譯；
 * 再不行才顯示原值。
 */
export function localizeList(source: unknown, translated: unknown, locale: string): string[] {
  const src = Array.isArray(source) ? source.filter((x): x is string => typeof x === 'string') : [];
  const loc = normalizeLocale(locale);
  if (loc === 'zh') return src;
  const tr = Array.isArray(translated) ? translated.filter((x): x is string => typeof x === 'string') : [];
  const aligned = tr.length === src.length;
  return src.map((item, i) => LIST_ITEMS[item.trim()]?.[loc] ?? (aligned ? tr[i] : null) ?? item);
}

/** 制度型標籤（含已翻譯的英日文）判斷，給卡片決定綠色色調。 */
// 與 property-tags.ts 的 POLICY_TAGS 一致（不含「可租補」，維持既有色調）
const POLICY_KEYS = ['社會住宅', '租金補貼', '高齡友善', '可報稅', '可入籍'];
const POLICY_LABELS = new Set<string>(
  POLICY_KEYS.flatMap((k) => [k, LIST_ITEMS[k].en, LIST_ITEMS[k].ja]),
);
export function isPolicyLabel(label: string): boolean {
  return POLICY_LABELS.has(label);
}
