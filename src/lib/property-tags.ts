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

// 從 Property 欄位推導的標籤（不存 DB，列表渲染時計算）
export function getDerivedTags(p: Source): Tag[] {
  const tags: Tag[] = [];

  if (p.buildingAge != null) {
    if (p.buildingAge <= 3) tags.push({ label: '新成屋', tone: 'green' });
    else if (p.buildingAge <= 10) tags.push({ label: '屋齡 10 年內', tone: 'green' });
  }
  if (p.hasElevator) tags.push({ label: '電梯', tone: 'blue' });
  if (p.petsAllowed) tags.push({ label: '寵物友善', tone: 'orange' });
  if (p.cookingAllowed) tags.push({ label: '可開伙', tone: 'orange' });

  const text = `${p.description ?? ''} ${p.street ?? ''} ${p.community ?? ''}`;
  if (/捷運|車站|高鐵/.test(text)) tags.push({ label: '近捷運/車站', tone: 'purple' });
  if (/學區|學校/.test(text)) tags.push({ label: '優質學區', tone: 'purple' });
  if (/邊間/.test(text)) tags.push({ label: '邊間', tone: 'purple' });
  if (/採光/.test(text)) tags.push({ label: '採光佳', tone: 'purple' });

  return tags;
}

// 將後台輸入的 featureTags 拆成兩種顯示色調
export function classifyFeatureTags(tags: string[] | undefined | null): Tag[] {
  if (!Array.isArray(tags)) return [];
  return tags.map((t) => ({
    label: t,
    tone: POLICY_TAGS.has(t) ? 'green' : 'orange',
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
