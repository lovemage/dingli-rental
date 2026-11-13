/**
 * 樓層字串格式化工具。
 * 純函式、不依賴 React，可同時被 server component 與 client component 使用。
 *
 * 規則：
 *   -1 → B1（地下樓）
 *   +1 → 頂樓加蓋
 *   N  → N（不附「樓」字，組裝時再加）
 */
type FloorLocale = 'zh' | 'en' | 'ja';

const FLOOR_WORDS: Record<FloorLocale, { rooftop: string; whole: string; floorSuffix: string }> = {
  zh: { rooftop: '頂樓加蓋', whole: '整棟', floorSuffix: '樓' },
  en: { rooftop: 'Rooftop addition', whole: 'Entire building', floorSuffix: 'F' },
  ja: { rooftop: '屋上増築', whole: '一棟', floorSuffix: '階' },
};

function toFloorLocale(locale?: string | null): FloorLocale {
  if (locale === 'en') return 'en';
  if (locale === 'ja' || locale === 'jp') return 'ja';
  return 'zh';
}

function formatFloorTokenCompact(raw: string | null | undefined, loc: FloorLocale): string {
  if (raw === null || raw === undefined) return '';
  const trimmed = String(raw).trim();
  if (!trimmed) return '';
  const words = FLOOR_WORDS[loc];
  if (trimmed.startsWith('+')) {
    const n = Number(trimmed.slice(1));
    return Number.isFinite(n) && n > 0 ? words.rooftop : trimmed;
  }
  const num = Number(trimmed);
  if (Number.isFinite(num)) {
    if (num < 0) return `B${Math.abs(num)}`;
    if (num === 0) return words.whole;
    // en/ja 的單層樓號直接帶單位（5F / 5階）；zh 維持原本不帶「樓」的緊湊寫法
    return loc === 'zh' ? String(num) : `${num}${words.floorSuffix}`;
  }
  return trimmed;
}

/**
 * 將儲存格式（如 "5-7"、"-1-1"、"4-+1"）拆成 [from, to]。
 * 若無法解析，回傳 [floor, '']。
 */
export function splitMultiFloor(floor: string): [string, string] {
  const m = floor.match(/^([+-]?\d+)-([+-]?\d+)$/);
  if (m) return [m[1], m[2]];
  const idx = floor.indexOf('-', 1);
  if (idx < 0) return [floor, ''];
  return [floor.slice(0, idx), floor.slice(idx + 1)];
}

export function formatFloorLine(
  floorType?: string | null,
  floor?: string | null,
  totalFloor?: string | null,
  locale?: string | null,
) {
  const loc = toFloorLocale(locale);
  const words = FLOOR_WORDS[loc];
  const totalTrim = String(totalFloor ?? '').trim();
  const totalNum = Number(totalTrim);
  const totalDisplay = totalTrim
    ? (Number.isFinite(totalNum) ? `${totalNum}${words.floorSuffix}` : totalTrim)
    : '';
  const totalSuffix = totalDisplay ? `/${totalDisplay}` : '';
  if (floorType === '全棟出租') {
    return totalDisplay ? `${words.whole}/${totalDisplay}` : words.whole;
  }
  if (!floor) return '';
  if (floorType === '多層出租' && floor.length > 1 && floor.indexOf('-', 1) > 0) {
    const [from, to] = splitMultiFloor(floor);
    return `${formatFloorTokenCompact(from, loc)}-${formatFloorTokenCompact(to, loc)}${totalSuffix}`;
  }
  return `${formatFloorTokenCompact(floor, loc)}${totalSuffix}`;
}
