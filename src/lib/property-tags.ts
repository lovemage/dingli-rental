import { isPolicyLabel } from '@/lib/property-i18n';

export type TagTone = 'green' | 'orange' | 'blue' | 'purple' | 'gray';

export type Tag = { label: string; tone: TagTone };

type Source = {
  buildingAge?: number | null;
  hasElevator?: boolean | null;
  petsAllowed?: boolean | null;
  cookingAllowed?: boolean | null;
  description?: string | null;
  street?: string | null;
  community?: string | null;
};

// 制度型固定標籤（綠色，可信賴）
const POLICY_TAGS = new Set([
  '社會住宅', '租金補貼', '高齡友善', '可報稅', '可入籍',
]);

const DERIVED_LABELS = {
  newBuild:   { zh: '新成屋',       en: 'New build',            ja: '新築' },
  under10:    { zh: '屋齡 10 年內', en: 'Under 10 yrs old',     ja: '築10年以内' },
  elevator:   { zh: '電梯',         en: 'Elevator',             ja: 'エレベーター' },
  pets:       { zh: '寵物友善',     en: 'Pet-friendly',         ja: 'ペット可' },
  cooking:    { zh: '可開伙',       en: 'Cooking OK',           ja: '自炊可' },
  nearMetro:  { zh: '近捷運/車站',  en: 'Near MRT / station',   ja: '駅近' },
  school:     { zh: '優質學區',     en: 'Good school district', ja: '学区良好' },
  corner:     { zh: '邊間',         en: 'Corner unit',          ja: '角部屋' },
  bright:     { zh: '採光佳',       en: 'Bright',               ja: '日当たり良好' },
} as const;

type DerivedLocale = 'zh' | 'en' | 'ja';

// 從 Property 欄位推導的標籤（不存 DB，列表渲染時計算）
export function getDerivedTags(p: Source, locale: string = 'zh'): Tag[] {
  const loc: DerivedLocale = locale === 'en' ? 'en' : locale === 'ja' || locale === 'jp' ? 'ja' : 'zh';
  const L = (k: keyof typeof DERIVED_LABELS) => DERIVED_LABELS[k][loc];
  const tags: Tag[] = [];

  if (p.buildingAge != null) {
    if (p.buildingAge <= 3) tags.push({ label: L('newBuild'), tone: 'green' });
    else if (p.buildingAge <= 10) tags.push({ label: L('under10'), tone: 'green' });
  }
  if (p.hasElevator) tags.push({ label: L('elevator'), tone: 'blue' });
  if (p.petsAllowed) tags.push({ label: L('pets'), tone: 'orange' });
  if (p.cookingAllowed) tags.push({ label: L('cooking'), tone: 'orange' });

  const text = `${p.description ?? ''} ${p.street ?? ''} ${p.community ?? ''}`;
  if (/捷運|車站|高鐵/.test(text)) tags.push({ label: L('nearMetro'), tone: 'purple' });
  if (/學區|學校/.test(text)) tags.push({ label: L('school'), tone: 'purple' });
  if (/邊間/.test(text)) tags.push({ label: L('corner'), tone: 'purple' });
  if (/採光/.test(text)) tags.push({ label: L('bright'), tone: 'purple' });

  return tags;
}

// 將後台輸入的 featureTags 拆成兩種顯示色調
export function classifyFeatureTags(tags: string[] | undefined | null): Tag[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => ({
    label: t,
    tone: POLICY_TAGS.has(t) || isPolicyLabel(t) ? 'green' : 'orange',
  }));
}

export function isPolicyTag(label: string): boolean {
  return POLICY_TAGS.has(label);
}

// 合併並去除重複、限制最多 N 個
export function mergeTags(...lists: Tag[][]): Tag[] {
  const seen = new Set<string>();
  const out: Tag[] = [];
  for (const list of lists) {
    for (const t of list) {
      if (seen.has(t.label)) continue;
      seen.add(t.label);
      out.push(t);
    }
  }
  return out;
}

// Tone -> Tailwind classes
export const TONE_CLASS: Record<TagTone, string> = {
  green:  'bg-brand-green-50 text-brand-green-900 border-brand-green-500/30',
  orange: 'bg-brand-orange-50 text-brand-orange-700 border-brand-orange-300/40',
  blue:   'bg-blue-50 text-blue-700 border-blue-200/60',
  purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
  gray:   'bg-paper-2 text-ink-700 border-line',
};
