import Link from 'next/link';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import { prisma } from '@/lib/prisma';
import { REGIONS, PROPERTY_TYPES, BUILDING_TYPES } from '@/data/taiwan-addresses';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string;
  region?: string;
  type?: string;
  building?: string;
  minRent?: string;
  maxRent?: string;
  page?: string;
};

async function search(params: SearchParams) {
  const where: any = { status: 'active' };
  if (params.region) where.region = params.region;
  if (params.type) where.typeMid = params.type;
  if (params.building) where.buildingType = params.building;
  if (params.minRent || params.maxRent) {
    where.rent = {};
    if (params.minRent) where.rent.gte = Number(params.minRent);
    if (params.maxRent) where.rent.lte = Number(params.maxRent);
  }
  if (params.q) {
    where.OR = [
      { title: { contains: params.q, mode: 'insensitive' } },
      { description: { contains: params.q, mode: 'insensitive' } },
      { community: { contains: params.q, mode: 'insensitive' } },
      { district: { contains: params.q, mode: 'insensitive' } },
    ];
  }

  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 12;

  try {
    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: { images: { orderBy: { order: 'asc' }, take: 1 } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
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

export default async function PropertiesPage({ searchParams }: { searchParams: SearchParams }) {
  const { items, total, page, pageSize } = await search(searchParams);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-b from-paper to-paper-2 py-12 sm:py-16">
          <div className="container-page">
            <div className="text-center mb-10">
              <span className="eyebrow"><span className="dot" />PROPERTIES</span>
              <h1 className="text-3xl sm:text-4xl font-black mt-3 mb-2">物件搜尋</h1>
              <p className="text-ink-500">深耕北北基桃竹，嚴選真實在地物件</p>
            </div>

            <form action="/properties" method="get" className="bg-white rounded-xl shadow-md border border-line p-4 sm:p-5 max-w-5xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
                <div className="col-span-2 lg:col-span-2">
                  <label className="label-base">關鍵字</label>
                  <input name="q" defaultValue={searchParams.q || ''} placeholder="路名、社區、物件名" className="input-base" />
                </div>
                <div>
                  <label className="label-base">縣市</label>
                  <select name="region" defaultValue={searchParams.region || ''} className="input-base">
                    <option value="">全部</option>
                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-base">類型</label>
                  <select name="type" defaultValue={searchParams.type || ''} className="input-base">
                    <option value="">全部</option>
                    {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-base">建物</label>
                  <select name="building" defaultValue={searchParams.building || ''} className="input-base">
                    <option value="">全部</option>
                    {BUILDING_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label-base">最低租金</label>
                  <input name="minRent" type="number" min={0} defaultValue={searchParams.minRent || ''} placeholder="0" className="input-base" />
                </div>
                <div>
                  <label className="label-base">最高租金</label>
                  <input name="maxRent" type="number" min={0} defaultValue={searchParams.maxRent || ''} placeholder="不限" className="input-base" />
                </div>
                <button type="submit" className="btn btn-orange col-span-2 sm:col-span-1 sm:col-start-3 lg:col-auto">🔍 搜尋</button>
              </div>
            </form>
          </div>
        </section>

        <section className="py-14">
          <div className="container-page">
            <div className="flex items-center justify-between mb-6">
              <p className="text-ink-500">共 <span className="font-bold text-ink-900">{total}</span> 筆物件</p>
            </div>

            {items.length === 0 ? (
              <div className="bg-paper-2 rounded-xl border border-line p-12 text-center text-ink-500">
                <p className="text-lg mb-2">目前沒有符合條件的物件</p>
                <p className="text-sm">請調整搜尋條件或聯繫業務專員：<Link href="/contact" className="text-brand-green-700 underline">聯絡我們</Link></p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {items.map((p: any) => (
                  <Link key={p.id} href={`/properties/${p.id}`} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition flex flex-col border border-line">
                    <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
                      {p.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-ink-300">暫無圖片</div>
                      )}
                      <span className="absolute top-3 left-3 bg-brand-green-700 text-white text-xs font-bold px-3 py-1 rounded-full">出租</span>
                      <span className="absolute top-3 right-3 bg-white/90 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full">{p.typeMid}</span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-2xl font-black text-brand-green-900 mb-1">NT$ {p.rent.toLocaleString()} <span className="text-sm text-ink-500 font-medium">/ 月</span></h3>
                      <h4 className="text-base font-bold mb-1.5 line-clamp-1">{p.title}</h4>
                      <p className="text-sm text-ink-500 mb-4 flex items-center gap-1">📍 {p.region}・{p.district}{p.hideAddress ? '' : (p.street ? `・${p.street}` : '')}</p>
                      <div className="flex gap-4 pt-4 border-t border-line text-xs text-ink-700 mt-auto">
                        <span>🛏 {p.rooms} 房</span>
                        <span>🚿 {p.bathrooms} 衛</span>
                        <span>📐 {p.usableArea} 坪</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const n = i + 1;
                  const params = new URLSearchParams(searchParams as any);
                  params.set('page', String(n));
                  return (
                    <Link key={n} href={`/properties?${params.toString()}`} className={`w-10 h-10 grid place-items-center rounded-full text-sm font-medium transition ${n === page ? 'bg-brand-green-700 text-white' : 'bg-white border border-line text-ink-700 hover:border-brand-green-500'}`}>
                      {n}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
