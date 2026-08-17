import type { Prisma } from '@/generated/prisma/client';

export type PublicPropertySearchParams = {
  q?: string;
  region?: string;
  district?: string;
  type?: string;
  building?: string;
  minRent?: string;
  maxRent?: string;
  minArea?: string;
  maxArea?: string;
  rooms?: string;
  minAge?: string;
  ageMax?: string;
  elevator?: string;
  pets?: string;
  cooking?: string;
  parking?: string;
  tags?: string;
  equipment?: string;
};

function splitCsv(value?: string): string[] {
  return value ? value.split(',').map((x) => x.trim()).filter(Boolean) : [];
}

function exactOrIn(values: string[]): string | Prisma.StringFilter | undefined {
  if (values.length === 1) return values[0];
  if (values.length > 1) return { in: values };
  return undefined;
}

/**
 * 房間數篩選的「以上」門檻：小於此值 = 精確房數，大於等於此值 = N 房以上。
 * 前台選項（PropertyFilters 的 ROOMS_PRESETS）最後一項必須用同一個數字，
 * 否則會出現「選 5 房以上卻查到 4 房」這種對不上的結果。
 */
const ROOMS_OPEN_ENDED_FROM = 5;

export function buildPublicPropertyWhere(
  params: PublicPropertySearchParams,
  locale: string
): Prisma.PropertyWhereInput {
  const localeCandidates = locale === 'ja' ? ['ja', 'jp'] : [locale];
  const where: Prisma.PropertyWhereInput = { status: 'active' };

  // 地區預設為台北市；客戶端若主動選「不限」會送 region=all，這時才略過地區過濾。
  const regionParam = (params.region ?? '').trim();
  if (regionParam !== 'all') {
    where.region = regionParam || '台北市';
  }
  if (params.district) where.district = params.district;

  const typeFilter = exactOrIn(splitCsv(params.type));
  if (typeFilter) where.typeMid = typeFilter;

  const buildingFilter = exactOrIn(splitCsv(params.building));
  if (buildingFilter) where.buildingType = buildingFilter;

  const rentRange: Prisma.IntFilter = {};
  if (params.minRent) rentRange.gte = Number(params.minRent);
  if (params.maxRent) rentRange.lte = Number(params.maxRent);
  if (Object.keys(rentRange).length) where.rent = rentRange;

  const areaRange: Prisma.FloatFilter = {};
  if (params.minArea) areaRange.gte = Number(params.minArea);
  if (params.maxArea) areaRange.lte = Number(params.maxArea);
  if (Object.keys(areaRange).length) where.usableArea = areaRange;

  if (params.rooms) {
    const rooms = Number(params.rooms);
    if (Number.isFinite(rooms) && rooms > 0) {
      where.rooms = rooms >= ROOMS_OPEN_ENDED_FROM ? { gte: ROOMS_OPEN_ENDED_FROM } : rooms;
    }
  }

  const andClauses: Prisma.PropertyWhereInput[] = [];

  const ageRange: Prisma.IntFilter = {};
  if (params.minAge) ageRange.gte = Number(params.minAge);
  if (params.ageMax) ageRange.lte = Number(params.ageMax);
  if (Object.keys(ageRange).length) {
    const ageMax = params.ageMax ? Number(params.ageMax) : null;
    if (!params.minAge && ageMax !== null && Number.isFinite(ageMax) && ageMax >= 3) {
      andClauses.push({
        OR: [
          { buildingAge: ageRange },
          { featureTags: { array_contains: '新成屋' } as any },
        ],
      });
    } else {
      where.buildingAge = ageRange;
    }
  }

  if (params.elevator === '1') where.hasElevator = true;
  if (params.pets === '1') where.petsAllowed = true;
  if (params.cooking === '1') where.cookingAllowed = true;
  if (params.parking === '1') where.parkingType = { not: null };

  const tagsList = splitCsv(params.tags);
  if (tagsList.length) {
    andClauses.push({
      OR: tagsList.map((t) => ({ featureTags: { array_contains: t } as any })),
    });
  }

  const eqList = splitCsv(params.equipment);
  if (eqList.length) {
    andClauses.push({
      OR: eqList.map((eq) => ({ equipment: { array_contains: eq } as any })),
    });
  }

  if (params.q) {
    const q = params.q.trim();
    const sourceOr: Prisma.PropertyWhereInput[] = [
      { code: { contains: q, mode: 'insensitive' } },
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { community: { contains: q, mode: 'insensitive' } },
      { district: { contains: q, mode: 'insensitive' } },
      { street: { contains: q, mode: 'insensitive' } },
      { lane: { contains: q, mode: 'insensitive' } },
      { alley: { contains: q, mode: 'insensitive' } },
      { number: { contains: q, mode: 'insensitive' } },
      { numberSub: { contains: q, mode: 'insensitive' } },
    ];

    if (locale === 'zh') {
      andClauses.push({ OR: sourceOr });
    } else {
      andClauses.push({
        OR: [
          ...sourceOr,
          {
            translations: {
              some: {
                locale: { in: localeCandidates },
                OR: [
                  { title: { contains: q, mode: 'insensitive' } },
                  { description: { contains: q, mode: 'insensitive' } },
                  { community: { contains: q, mode: 'insensitive' } },
                  { district: { contains: q, mode: 'insensitive' } },
                  { street: { contains: q, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }
  }

  if (andClauses.length) where.AND = andClauses;
  return where;
}

export function buildAdminPropertyWhere(
  q: string,
  opts?: { minRent?: string; maxRent?: string },
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  const keyword = q.trim();
  if (keyword) {
    where.OR = [
      { title: { contains: keyword, mode: 'insensitive' } },
      { community: { contains: keyword, mode: 'insensitive' } },
      { region: { contains: keyword, mode: 'insensitive' } },
      { district: { contains: keyword, mode: 'insensitive' } },
      { street: { contains: keyword, mode: 'insensitive' } },
      { lane: { contains: keyword, mode: 'insensitive' } },
      { alley: { contains: keyword, mode: 'insensitive' } },
      { number: { contains: keyword, mode: 'insensitive' } },
      { numberSub: { contains: keyword, mode: 'insensitive' } },
      { code: { contains: keyword.toUpperCase(), mode: 'insensitive' } },
    ];
  }

  const rentRange: Prisma.IntFilter = {};
  const min = Number((opts?.minRent || '').trim());
  const max = Number((opts?.maxRent || '').trim());
  if ((opts?.minRent || '').trim() && Number.isFinite(min)) rentRange.gte = min;
  if ((opts?.maxRent || '').trim() && Number.isFinite(max)) rentRange.lte = max;
  if (Object.keys(rentRange).length) where.rent = rentRange;

  return where;
}
