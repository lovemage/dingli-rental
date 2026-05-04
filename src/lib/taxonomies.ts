import { prisma } from '@/lib/prisma';
import {
  PROPERTY_TYPES,
  BUILDING_TYPES,
  EQUIPMENT_OPTIONS,
  FURNITURE_OPTIONS,
  TENANT_TYPES,
  RENT_INCLUDES_OPTIONS,
  FEATURE_TAGS,
  CUSTOM_TAG_SUGGESTIONS,
} from '@/data/taiwan-addresses';

export type TaxonomyKey =
  | 'propertyTypes'
  | 'buildingTypes'
  | 'equipment'
  | 'furniture'
  | 'tenantTypes'
  | 'rentIncludes'
  | 'policyTags'
  | 'customTagSuggestions';

export type Taxonomies = Record<TaxonomyKey, string[]>;

export const TAXONOMY_LABELS: Record<TaxonomyKey, { title: string; hint: string }> = {
  propertyTypes:        { title: '物件類型（中分類）', hint: '整層住家 / 獨立套房 / 雅房 等' },
  buildingTypes:        { title: '建物類型（小分類）', hint: '公寓 / 透天厝 / 電梯大樓 等' },
  equipment:            { title: '設備選項',           hint: '冷氣 / 洗衣機 / 網路 等' },
  furniture:            { title: '家具選項',           hint: '床 / 衣櫃 / 沙發 等' },
  tenantTypes:          { title: '租客身份',           hint: '學生 / 上班族 / 家庭 等' },
  rentIncludes:         { title: '租金包含項目',       hint: '管理費 / 水費 / 網路 等' },
  policyTags:           { title: '制度型標籤（綠色）', hint: '社會住宅 / 租金補貼 等具公信力標籤' },
  customTagSuggestions: { title: '自由特色標籤建議',   hint: '近捷運 / 採光佳 / 邊間 等行銷標籤' },
};

export const TAXONOMY_KEYS: TaxonomyKey[] = [
  'propertyTypes', 'buildingTypes', 'equipment', 'furniture',
  'tenantTypes', 'rentIncludes', 'policyTags', 'customTagSuggestions',
];

const DEFAULTS: Taxonomies = {
  propertyTypes: [...PROPERTY_TYPES],
  buildingTypes: [...BUILDING_TYPES],
  equipment: [...EQUIPMENT_OPTIONS],
  furniture: [...FURNITURE_OPTIONS],
  tenantTypes: [...TENANT_TYPES],
  rentIncludes: [...RENT_INCLUDES_OPTIONS],
  policyTags: [...FEATURE_TAGS],
  customTagSuggestions: [...CUSTOM_TAG_SUGGESTIONS],
};

const SECTION_PREFIX = 'taxonomy_';

export function sectionFor(key: TaxonomyKey): string {
  return `${SECTION_PREFIX}${key}`;
}

export function defaultFor(key: TaxonomyKey): string[] {
  return [...DEFAULTS[key]];
}

export function getDefaults(): Taxonomies {
  return JSON.parse(JSON.stringify(DEFAULTS));
}

export async function getTaxonomies(): Promise<Taxonomies> {
  try {
    const items = await prisma.siteContent.findMany({
      where: { section: { startsWith: SECTION_PREFIX } },
    });
    const map = new Map(items.map((i) => [i.section, i.data]));
    const out: Taxonomies = getDefaults();
    for (const key of TAXONOMY_KEYS) {
      const raw = map.get(sectionFor(key)) as { items?: unknown } | undefined;
      if (raw && Array.isArray(raw.items)) {
        const arr = raw.items.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
        if (arr.length) out[key] = arr;
      }
    }
    return out;
  } catch {
    return getDefaults();
  }
}
