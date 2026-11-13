import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { translateJsonObject } from '@/lib/openrouter-translate';
import type { PropertyCardData } from '@/components/frontend/PropertyCard';
import type { Prisma } from '@/generated/prisma/client';
import { localizeList, lookupDistrict, lookupFixed } from '@/lib/property-i18n';

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
  parkingType: string | null;
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
  parkingType: true,
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
    parkingType: p.parkingType ?? '',
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
  parkingType?: unknown;
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
        parkingType: property.parkingType ?? '',
      };
      const out = (await translateJsonObject(payload, locale)) as RawTranslated;
      const dataPatch = {
        title: pickString(out.title, property.title) || property.title,
        description: pickString(out.description) ?? pickString(property.description) ?? null,
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
        parkingType: pickString(out.parkingType, property.parkingType ?? ''),
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
  return items.map((p) => {
    const tr = findTranslation(p, locale);
    const l = localizeCommon(p, tr, locale);

    return {
      id: p.id,
      code: p.code ?? null,
      title: l.title,
      region: l.region,
      district: l.district,
      street: l.street,
      community: l.community,
      typeMid: l.typeMid,
      buildingType: l.buildingType,
      rooms: p.rooms,
      bathrooms: p.bathrooms,
      livingRooms: p.livingRooms,
      openLayout: p.openLayout ?? false,
      usableArea: p.usableArea,
      rent: p.rent,
      imageUrl: p.images?.[0]?.url ?? null,
      featureTags: localizeList(p.featureTags, tr?.featureTags, locale),
      buildingAge: p.buildingAge,
      hasElevator: p.hasElevator,
      petsAllowed: p.petsAllowed,
      cookingAllowed: p.cookingAllowed,
      description: l.description,
      hideAddress: p.hideAddress,
      featured: p.featured,
      status: p.status,
      listingStatus: p.listingStatus as any,
      parkingType: p.parkingType,
      floorType: p.floorType,
      floor: p.floor,
      totalFloor: p.totalFloor,
    };
  });
}

function findTranslation(p: any, locale: string): any | undefined {
  if (locale === 'zh') return undefined;
  const localeCandidates = locale === 'ja' ? ['ja', 'jp'] : [locale];
  return p.translations?.find((t: any) => localeCandidates.includes(t.locale));
}

/** 非空字串才採用，否則退回下一個候選值（避免翻譯存成 "" 蓋掉原文）。 */
function firstText(...values: unknown[]): string | null {
  for (const v of values) {
    if (typeof v === 'string' && v.trim()) return v;
  }
  return null;
}

/**
 * 卡片與詳情頁共用的欄位在地化。
 * 優先序：固定選項對照表 → AI 翻譯 → 中文原值。
 */
function localizeCommon(p: any, tr: any, locale: string) {
  return {
    title: firstText(tr?.title, p.title) ?? '',
    description: firstText(tr?.description, p.description),
    region: lookupFixed('region', p.region, locale) ?? firstText(tr?.region, p.region) ?? '',
    district: lookupDistrict(p.district, locale) ?? firstText(tr?.district, p.district) ?? '',
    street: firstText(tr?.street, p.street),
    community: firstText(tr?.community, p.community),
    typeMid: lookupFixed('typeMid', p.typeMid, locale) ?? firstText(tr?.typeMid, p.typeMid) ?? '',
    buildingType:
      lookupFixed('buildingType', p.buildingType, locale) ?? firstText(tr?.buildingType, p.buildingType),
  };
}

/** 給詳情頁用：把所有翻譯欄位都套用 */
export function localizePropertyForDetail(p: any, locale: string) {
  const tr = findTranslation(p, locale);
  return {
    ...p,
    ...localizeCommon(p, tr, locale),
    deposit: lookupFixed('deposit', p.deposit, locale) ?? firstText(tr?.deposit, p.deposit) ?? '',
    minLease: lookupFixed('minLease', p.minLease, locale) ?? firstText(tr?.minLease, p.minLease),
    direction: lookupFixed('direction', p.direction, locale) ?? firstText(tr?.direction, p.direction),
    parkingType:
      lookupFixed('parkingType', p.parkingType, locale) ?? firstText(tr?.parkingType, p.parkingType),
    featureTags: localizeList(p.featureTags, tr?.featureTags, locale),
    equipment: localizeList(p.equipment, tr?.equipment, locale),
    furniture: localizeList(p.furniture, tr?.furniture, locale),
    rentIncludes: localizeList(p.rentIncludes, tr?.rentIncludes, locale),
    tenantTypes: localizeList(p.tenantTypes, tr?.tenantTypes, locale),
  };
}
