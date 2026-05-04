import Link from 'next/link';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import PropertyCard, { type PropertyCardData } from '@/components/frontend/PropertyCard';
import PropertyFilters from '@/components/frontend/PropertyFilters';
import { prisma } from '@/lib/prisma';
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
      // null 屋齡放最後
      return [{ buildingAge: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }];
    default:
      return [{ featured: 'desc' }, { createdAt: 'desc' }];
  }
}

async function search(params: SearchParams) {
  const where: Prisma.PropertyWhereInput = { status: 'active' };

  if (params.region) where.region = params.region;
  if (params.district) where.district = params.district;
  if (params.type) where.typeMid = params.type;
  if (params.building) where.buildingType = params.building;

  // 租金 / 坪數區間
  const rentRange: Prisma.IntFilter = {};
  if (params.minRent) rentRange.gte = Number(params.minRent);
  if (params.maxRent) rentRange.lte = Number(params.maxRent);
  if (Object.keys(rentRange).length) where.rent = rentRange;

  const areaRange: Prisma.FloatFilter = {};
  if (params.minArea) areaRange.gte = Number(params.minArea);
  if (params.maxArea) areaRange.lte = Number(params.maxArea);
  if (Object.keys(areaRange).length) where.usableArea = areaRange;

  // 房型最少
  if (params.rooms) where.rooms = { gte: Number(params.rooms) };

  // 屋齡上限
  if (params.ageMax) where.buildingAge = { lte: Number(params.ageMax) };

  // 必備條件
  if (params.elevator === '1') where.hasElevator = true;
  if (params.pets === '1') where.petsAllowed = true;
  if (params.cooking === '1') where.cookingAllowed = true;

  const andClauses: Prisma.PropertyWhereInput[] = [];

  // 多選 tags（任一即可）
  if (params.tags) {
    const tagsList = params.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (tagsList.length) {
      andClauses.push({
        OR: tagsList.map((t) => ({ featureTags: { array_contains: t } as any })),
      });
    }
  }

  // 多選 equipment（任一）
  if (params.equipment) {
    const eqList = params.equipment.split(',').map((t) => t.trim()).filter(Boolean);
    if (eqList.length) {
      andClauses.push({
        OR: eqList.map((eq) => ({ equipment: { array_contains: eq } as any })),
      });
    }
  }

  // 關鍵字
  if (params.q) {
    andClauses.push({
      OR: [
        { title: { contains: params.q, mode: 'insensitive' } },
        { description: { contains: params.q, mode: 'insensitive' } },
        { community: { contains: params.q, mode: 'insensitive' } },
        { district: { contains: params.q, mode: 'insensitive' } },
        { street: { contains: params.q, mode: 'insensitive' } },
      ],
    });
  }

  if (andClauses.length) where.AND = andClauses;

  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 12;

  try {
    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' }, take: 1 } },
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
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { items, total, page, pageSize } = await search(sp);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const cards: PropertyCardData[] = items.map((p: any) => ({
    id: p.id,
    title: p.title,
    region: p.region,
    district: p.district,
    street: p.street,
    community: p.community,
    typeMid: p.typeMid,
    rooms: p.rooms,
    bathrooms: p.bathrooms,
    livingRooms: p.livingRooms,
    usableArea: p.usableArea,
    rent: p.rent,
    imageUrl: p.images[0]?.url ?? null,
    featureTags: Array.isArray(p.featureTags) ? p.featureTags : [],
    buildingAge: p.buildingAge,
    hasElevator: p.hasElevator,
    petsAllowed: p.petsAllowed,
    cookingAllowed: p.cookingAllowed,
    description: p.description,
    hideAddress: p.hideAddress,
    featured: p.featured,
    listingStatus: p.listingStatus,
  }));

  return (
    <>
      <Header />
      <main>
        <section className="bg-white border-b border-line">
          <div className="container-page py-10 sm:py-14">
            <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 lg:gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />PROPERTIES</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 mb-3 leading-tight">
                  找一個讓家人<br className="sm:hidden" />安心入住的好物件
                </h1>
                <p className="text-ink-700 text-base sm:text-lg leading-relaxed">
                  深耕北北基桃竹，嚴選真實在地物件，每一筆都由業務親自確認屋況。
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/properties-hero.webp"
                  alt="家庭一起瀏覽物件"
                  className="w-full h-auto object-cover aspect-[16/9]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container-page">
            <PropertyFilters total={total} />

            {cards.length === 0 ? (
              <div className="bg-paper-2 rounded-xl border border-line p-12 text-center text-ink-500 mt-8">
                <p className="text-lg mb-2">目前沒有符合條件的物件</p>
                <p className="text-sm">
                  請調整搜尋條件，或聯繫業務專員：
                  <Link href="/contact" className="text-brand-green-700 underline">
                    聯絡我們
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
              <Pagination total={totalPages} current={page} sp={sp} />
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
}: {
  total: number;
  current: number;
  sp: SearchParams;
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
            href={`/properties?${params.toString()}`}
            className={`w-10 h-10 grid place-items-center rounded-full text-sm font-medium transition ${n === current ? 'bg-brand-green-700 text-white' : 'bg-white border border-line text-ink-700 hover:border-brand-green-500'}`}
          >
            {n}
          </Link>
        );
      })}
    </div>
  );
}
