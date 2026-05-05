import Link from 'next/link';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import PropertyCard from '@/components/frontend/PropertyCard';
import PropertyFilters from '@/components/frontend/PropertyFilters';
import { prisma } from '@/lib/prisma';
import { getLocalizedPropertyCards } from '@/lib/property-translate';
import type { Prisma } from '@/generated/prisma/client';

export const dynamic = 'force-dynamic';

type SearchParams = {
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
  ageMax?: string;
  elevator?: string;
  pets?: string;
  cooking?: string;
  tags?: string;
  equipment?: string;
  sort?: string;
  page?: string;
};

function parseSort(sort?: string): Prisma.PropertyOrderByWithRelationInput[] {
  switch (sort) {
    case 'newest': return [{ createdAt: 'desc' }];
    case 'rent_asc': return [{ rent: 'asc' }];
    case 'rent_desc': return [{ rent: 'desc' }];
    case 'area_desc': return [{ usableArea: 'desc' }];
    case 'age_asc':
      return [{ buildingAge: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }];
    default:
      return [{ featured: 'desc' }, { createdAt: 'desc' }];
  }
}

async function search(params: SearchParams, locale: string) {
  const where: Prisma.PropertyWhereInput = { status: 'active' };

  if (params.region) where.region = params.region;
  if (params.district) where.district = params.district;
  if (params.type) where.typeMid = params.type;
  if (params.building) where.buildingType = params.building;

  const rentRange: Prisma.IntFilter = {};
  if (params.minRent) rentRange.gte = Number(params.minRent);
  if (params.maxRent) rentRange.lte = Number(params.maxRent);
  if (Object.keys(rentRange).length) where.rent = rentRange;

  const areaRange: Prisma.FloatFilter = {};
  if (params.minArea) areaRange.gte = Number(params.minArea);
  if (params.maxArea) areaRange.lte = Number(params.maxArea);
  if (Object.keys(areaRange).length) where.usableArea = areaRange;

  if (params.rooms) where.rooms = { gte: Number(params.rooms) };
  if (params.ageMax) where.buildingAge = { lte: Number(params.ageMax) };
  if (params.elevator === '1') where.hasElevator = true;
  if (params.pets === '1') where.petsAllowed = true;
  if (params.cooking === '1') where.cookingAllowed = true;

  const andClauses: Prisma.PropertyWhereInput[] = [];

  if (params.tags) {
    const tagsList = params.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsList.length) {
      andClauses.push({
        OR: tagsList.map((t) => ({ featureTags: { array_contains: t } as any })),
      });
    }
  }

  if (params.equipment) {
    const eqList = params.equipment.split(',').map((t) => t.trim()).filter(Boolean);
    if (eqList.length) {
      andClauses.push({
        OR: eqList.map((eq) => ({ equipment: { array_contains: eq } as any })),
      });
    }
  }

  if (params.q) {
    const sourceOr: Prisma.PropertyWhereInput[] = [
      { title: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { community: { contains: params.q, mode: 'insensitive' } },
      { district: { contains: params.q, mode: 'insensitive' } },
      { street: { contains: params.q, mode: 'insensitive' } },
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
                locale,
                OR: [
                  { title: { contains: params.q, mode: 'insensitive' } },
                  { description: { contains: params.q, mode: 'insensitive' } },
                  { community: { contains: params.q, mode: 'insensitive' } },
                  { district: { contains: params.q, mode: 'insensitive' } },
                  { street: { contains: params.q, mode: 'insensitive' } },
                ],
              },
            },
          },
        ],
      });
    }
  }

  if (andClauses.length) where.AND = andClauses;

  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 12;

  try {
    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          translations: locale === 'zh' ? false : { where: { locale } },
        },
        orderBy: parseSort(params.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
    ]);
    return { items, total, page, pageSize };
  } catch {
    return { items: [], total: 0, page, pageSize };
  }
}

export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const { items, total, page, pageSize } = await search(sp, locale);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const t = await getTranslations('properties');
  const currentLocale = await getLocale();
  const lp = (p: string) => (currentLocale === 'zh' ? p : `/${currentLocale}${p}`);

  const heroImg = '/images/properties-hero.webp';
  const cards = getLocalizedPropertyCards(items as any, locale);

  return (
    <>
      <Header />
      <main>
        <section className="bg-white border-b border-line">
          <div className="container-page py-10 sm:py-14">
            <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 lg:gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />{t('pageEyebrow')}</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 mb-3 leading-tight">
                  {t('pageTitleLine1')}<br className="sm:hidden" />
                  {t('pageTitleLine2')}
                </h1>
                <p className="text-ink-700 text-base sm:text-lg leading-relaxed">
                  {t('pageSubtitle')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImg} alt="" className="w-full h-auto object-cover aspect-[16/9]" />
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container-page">
            <PropertyFilters total={total} />

            {cards.length === 0 ? (
              <div className="bg-paper-2 rounded-xl border border-line p-12 text-center text-ink-500 mt-8">
                <p className="text-lg mb-2">{t('noResultsTitle')}</p>
                <p className="text-sm">
                  {t('noResultsHint')}
                  <Link href={lp('/contact')} className="text-brand-green-700 underline">
                    {t('noResultsContactLink')}
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-7 mt-8">
                {cards.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <Pagination total={totalPages} current={page} sp={sp} basePath={lp('/properties')} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Pagination({
  total,
  current,
  sp,
  basePath,
}: {
  total: number;
  current: number;
  sp: SearchParams;
  basePath: string;
}) {
  return (
    <div className="flex justify-center gap-2 mt-12">
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const params = new URLSearchParams();
        Object.entries(sp).forEach(([k, val]) => {
          if (val) params.set(k, String(val));
        });
        params.set('page', String(n));
        return (
          <Link
            key={n}
            href={`${basePath}?${params.toString()}`}
            className={`w-10 h-10 grid place-items-center rounded-full text-sm font-medium transition ${n === current ? 'bg-brand-green-700 text-white' : 'bg-white border border-line text-ink-700 hover:border-brand-green-500'}`}
          >
            {n}
          </Link>
        );
      })}
    </div>
  );
}
