import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { translateJsonObject } from '@/lib/openrouter-translate';
import type { PropertyCardData } from '@/components/frontend/PropertyCard';
import type { Prisma } from '@/generated/prisma/client';

const TRANSLATION_LOCALES = ['en', 'ja'] as const;
export type TranslationLocale = (typeof TRANSLATION_LOCALES)[number];

type PropertySourceFields = {
  title: string;
  description: string | null;
  featureTags: unknown;
  equipment: unknown;
  furniture: unknown;
  rentIncludes: unknown;
  tenantTypes: unknown;
  region: string;
  district: string;
  street: string | null;
  community: string | null;
  typeMid: string;
  buildingType: string | null;
  deposit: string;
  minLease: string;
  direction: string | null;
};

export const PROPERTY_SOURCE_SELECT = {
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
} satisfies Prisma.PropertySelect;

function arr(v: unknown): string[] {
  return Array.isArray(v) ? (v as unknown[]).filter((x): x is string => typeof x === 'string') : [];
}

export function computePropertySourceHash(p: PropertySourceFields): string {
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
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

type RawTranslated = {
  title?: unknown;
  description?: unknown;
  featureTags?: unknown;
  equipment?: unknown;
  furniture?: unknown;
  rentIncludes?: unknown;
  tenantTypes?: unknown;
  region?: unknown;
  district?: unknown;
  street?: unknown;
  community?: unknown;
  typeMid?: unknown;
  buildingType?: unknown;
  deposit?: unknown;
  minLease?: unknown;
  direction?: unknown;
};

function pickString(v: unknown, fallback?: string): string | null {
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback ?? null;
}

export async function translateProperty(
  propertyId: number,
  options: { locales?: readonly TranslationLocale[]; skipUpToDate?: boolean } = {}
): Promise<{ ok: boolean; translated: TranslationLocale[]; skipped: TranslationLocale[]; errors: Record<string, string> }> {
  const locales = options.locales ?? TRANSLATION_LOCALES;
  const skipUpToDate = options.skipUpToDate ?? true;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: { translations: true },
  });
  if (!property) {
    return { ok: false, translated: [], skipped: [], errors: { _root: 'Property not found' } };
  }

  const sourceHash = computePropertySourceHash(property as any);
  const translated: TranslationLocale[] = [];
  const skipped: TranslationLocale[] = [];
  const errors: Record<string, string> = {};

  for (const locale of locales) {
    const existing = property.translations.find((t) => t.locale === locale);
    if (skipUpToDate && existing && existing.sourceHash === sourceHash) {
      skipped.push(locale);
      continue;
    }
    try {
      const payload = {
        title: property.title,
        description: property.description ?? '',
        featureTags: arr(property.featureTags),
        equipment: arr(property.equipment),
        furniture: arr(property.furniture),
        rentIncludes: arr(property.rentIncludes),
        tenantTypes: arr(property.tenantTypes),
        region: property.region,
        district: property.district,
        street: property.street ?? '',
        community: property.community ?? '',
        typeMid: property.typeMid,
        buildingType: property.buildingType ?? '',
        deposit: property.deposit,
        minLease: property.minLease,
        direction: property.direction ?? '',
      };
      const out = (await translateJsonObject(payload, locale)) as RawTranslated;
      const dataPatch = {
        title: pickString(out.title, property.title) || property.title,
        description: pickString(out.description, property.description ?? '') ?? null,
        featureTags: arr(out.featureTags) as any,
        equipment: arr(out.equipment) as any,
        furniture: arr(out.furniture) as any,
        rentIncludes: arr(out.rentIncludes) as any,
        tenantTypes: arr(out.tenantTypes) as any,
        region: pickString(out.region, property.region),
        district: pickString(out.district, property.district),
        street: pickString(out.street, property.street ?? ''),
        community: pickString(out.community, property.community ?? ''),
        typeMid: pickString(out.typeMid, property.typeMid),
        buildingType: pickString(out.buildingType, property.buildingType ?? ''),
        deposit: pickString(out.deposit, property.deposit),
        minLease: pickString(out.minLease, property.minLease),
        direction: pickString(out.direction, property.direction ?? ''),
        sourceHash,
      };
      await prisma.propertyTranslation.upsert({
        where: { propertyId_locale: { propertyId, locale } },
        create: { propertyId, locale, ...dataPatch },
        update: dataPatch,
      });
      translated.push(locale);
    } catch (e) {
      const msg = (e as Error).message || 'unknown error';
      console.error(`[translateProperty] ${propertyId}/${locale} failed:`, msg);
      errors[locale] = msg;
    }
  }

  return { ok: Object.keys(errors).length === 0, translated, skipped, errors };
}

export function triggerTranslateInBackground(propertyId: number) {
  translateProperty(propertyId).catch((e) => {
    console.error(`[triggerTranslateInBackground] ${propertyId}`, (e as Error).message);
  });
}

export type LocalizedProperty = PropertyCardData & {
  // 詳情頁需要的擴充欄位
  equipment?: string[];
  furniture?: string[];
  rentIncludes?: string[];
  tenantTypes?: string[];
  buildingType?: string | null;
  deposit?: string | null;
  minLease?: string | null;
  direction?: string | null;
};

export function getLocalizedPropertyCards(
  items: any[],
  locale: string
): PropertyCardData[] {
  const localeCandidates =
    locale === 'ja' ? ['ja', 'jp'] : [locale];
  return items.map((p) => {
    const tr =
      locale !== 'zh'
        ? p.translations?.find((t: any) => localeCandidates.includes(t.locale))
        : undefined;

    return {
      id: p.id,
      code: p.code ?? null,
      title: tr?.title || p.title,
      region: tr?.region || p.region,
      district: tr?.district || p.district,
      street: tr?.street ?? p.street,
      community: tr?.community ?? p.community,
      typeMid: tr?.typeMid || p.typeMid,
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      livingRooms: p.livingRooms,
      usableArea: p.usableArea,
      rent: p.rent,
      imageUrl: p.images?.[0]?.url ?? null,
      featureTags:
        tr && Array.isArray(tr.featureTags)
          ? (tr.featureTags as string[])
          : Array.isArray(p.featureTags)
            ? (p.featureTags as string[])
            : [],
      buildingAge: p.buildingAge,
      hasElevator: p.hasElevator,
      petsAllowed: p.petsAllowed,
      cookingAllowed: p.cookingAllowed,
      description: tr?.description ?? p.description,
      hideAddress: p.hideAddress,
      featured: p.featured,
      listingStatus: p.listingStatus as any,
    };
  });
}

/** 給詳情頁用：把所有翻譯欄位都套用 */
export function localizePropertyForDetail(p: any, locale: string) {
  const localeCandidates =
    locale === 'ja' ? ['ja', 'jp'] : [locale];
  const tr =
    locale !== 'zh'
      ? p.translations?.find((t: any) => localeCandidates.includes(t.locale))
      : undefined;
  return {
    ...p,
    title: tr?.title || p.title,
    description: tr?.description ?? p.description,
    region: tr?.region || p.region,
    district: tr?.district || p.district,
    street: tr?.street ?? p.street,
    community: tr?.community ?? p.community,
    typeMid: tr?.typeMid || p.typeMid,
    buildingType: tr?.buildingType ?? p.buildingType,
    deposit: tr?.deposit || p.deposit,
    minLease: tr?.minLease || p.minLease,
    direction: tr?.direction ?? p.direction,
    featureTags:
      tr && Array.isArray(tr.featureTags) ? (tr.featureTags as string[]) : (p.featureTags as string[]),
    equipment:
      tr && Array.isArray(tr.equipment) ? (tr.equipment as string[]) : (p.equipment as string[]),
    furniture:
      tr && Array.isArray(tr.furniture) ? (tr.furniture as string[]) : (p.furniture as string[]),
    rentIncludes:
      tr && Array.isArray(tr.rentIncludes) ? (tr.rentIncludes as string[]) : (p.rentIncludes as string[]),
    tenantTypes:
      tr && Array.isArray(tr.tenantTypes) ? (tr.tenantTypes as string[]) : (p.tenantTypes as string[]),
  };
}
