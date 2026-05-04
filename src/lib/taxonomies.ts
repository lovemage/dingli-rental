import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  SECTION_PREFIX,
  TAXONOMY_KEYS,
  getDefaults,
  sectionFor,
  type Taxonomies,
} from '@/lib/taxonomies-shared';

export type { TaxonomyKey, Taxonomies } from '@/lib/taxonomies-shared';
export {
  SECTION_PREFIX,
  TAXONOMY_KEYS,
  TAXONOMY_LABELS,
  defaultFor,
  getDefaults,
  sectionFor,
} from '@/lib/taxonomies-shared';

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
