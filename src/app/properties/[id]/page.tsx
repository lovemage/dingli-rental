import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PropertyDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) notFound();

  const p = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  }).catch(() => null);

  if (!p || p.status !== 'active') notFound();

  const equipment = (p.equipment as string[]) || [];
  const furniture = (p.furniture as string[]) || [];
  const tenantTypes = (p.tenantTypes as string[]) || [];
  const rentIncludes = (p.rentIncludes as string[]) || [];
  const featureTags = (p.featureTags as string[]) || [];

  const addressDisplay = p.hideAddress
    ? `${p.region}・${p.district}${p.street ? `・${p.street}` : ''}`
    : `${p.region}・${p.district}${p.street ? `・${p.street}` : ''}${p.lane ? `${p.lane}巷` : ''}${p.alley ? `${p.alley}弄` : ''}${p.number ? `${p.number}號` : ''}${p.numberSub ? `之${p.numberSub}` : ''}`;

  return (
    <>
      <Header />
      <main className="bg-paper-2 py-10">
        <div className="container-page">
          <Link href="/properties" className="text-sm text-ink-500 hover:text-brand-green-700 mb-4 inline-flex items-center gap-1">← 返回物件列表</Link>

          <div className="bg-white rounded-xl shadow-md border border-line overflow-hidden">
            {/* 圖片 */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-1 bg-paper-2">
              <div className="aspect-[16/10] overflow-hidden">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-ink-300">暫無圖片</div>
                )}
              </div>
              <div className="hidden lg:grid grid-rows-2 gap-1">
                {p.images.slice(1, 3).map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={img.id} src={img.url} alt="" className="w-full h-full object-cover" />
                ))}
              </div>
            </div>

            <div className="p-6 sm:p-10 grid lg:grid-cols-[1fr_320px] gap-8">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-brand-green-50 text-brand-green-900 text-xs font-bold px-2.5 py-1 rounded-full">{p.region}</span>
                  <span className="bg-brand-orange-50 text-brand-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">{p.typeMid}</span>
                  {p.buildingType && <span className="bg-paper-2 text-ink-700 text-xs font-bold px-2.5 py-1 rounded-full">{p.buildingType}</span>}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black mb-2">{p.title}</h1>
                <p className="text-ink-500 mb-6">📍 {addressDisplay}</p>

                <h2 className="font-bold text-lg mb-3">基礎資料</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <Info label="格局" value={`${p.rooms} 房 ${p.livingRooms} 廳 ${p.bathrooms} 衛 ${p.balconies} 陽台`} />
                  <Info label="可使用坪數" value={`${p.usableArea} 坪`} />
                  <Info label="樓層" value={`${p.floor || '-'}${p.totalFloor ? `/${p.totalFloor}` : ''} 樓`} />
                  <Info label="屋齡" value={p.ageUnknown ? '不詳' : (p.buildingAge ? `${p.buildingAge} 年` : '-')} />
                  <Info label="朝向" value={p.direction || '-'} />
                  <Info label="社區" value={p.community || '-'} />
                  <Info label="電梯" value={p.hasElevator ? '有' : '無'} />
                  <Info label="開放式" value={p.openLayout ? '是' : '否'} />
                </div>

                {equipment.length > 0 && (
                  <Tags label="提供設備" items={equipment} />
                )}
                {furniture.length > 0 && (
                  <Tags label="提供家具" items={furniture} />
                )}

                <h2 className="font-bold text-lg mb-3 mt-6">租屋條件</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Info label="開伙" value={p.cookingAllowed ? '可' : '不可'} />
                  <Info label="養寵物" value={p.petsAllowed ? '可' : '不可'} />
                  <Info label="最短租期" value={p.minLease} />
                  <Info label="可遷入" value={p.anytimeMoveIn ? '隨時可入住' : (p.moveInDate ? new Date(p.moveInDate).toLocaleDateString('zh-TW') : '-')} />
                </div>
                {tenantTypes.length > 0 && <Tags label="身份要求" items={tenantTypes} />}

                {p.description && (
                  <>
                    <h2 className="font-bold text-lg mb-3 mt-6">特色描述</h2>
                    <div className="prose max-w-none text-ink-700 whitespace-pre-wrap">{p.description}</div>
                  </>
                )}

                {featureTags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {featureTags.map((t) => (
                      <span key={t} className="bg-brand-orange-50 text-brand-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* 側欄價格區 */}
              <aside className="bg-paper-2 rounded-xl p-6 h-fit lg:sticky lg:top-24">
                <p className="text-sm text-ink-500">租金</p>
                <p className="text-3xl font-black text-brand-green-900 mb-1">NT$ {p.rent.toLocaleString()}</p>
                <p className="text-sm text-ink-500 mb-4">/ 月</p>

                <div className="border-t border-line pt-4 space-y-2 text-sm">
                  <Row label="押金" value={p.deposit} />
                  <Row label="管理費" value={p.noManagementFee ? '無' : (p.managementFee ? `NT$ ${p.managementFee.toLocaleString()} / 月` : '-')} />
                  {rentIncludes.length > 0 && (
                    <div>
                      <p className="text-ink-500 mb-1">租金包含</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rentIncludes.map((r) => (
                          <span key={r} className="bg-white text-ink-700 text-xs px-2 py-0.5 rounded-full border border-line">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Link href="/contact" className="btn btn-primary w-full mt-6">聯絡業務專員 →</Link>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper-2 rounded-lg p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="font-bold text-ink-900 text-sm">{value}</p>
    </div>
  );
}

function Tags({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-bold text-ink-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span key={it} className="bg-brand-green-50 text-brand-green-900 text-xs px-2.5 py-1 rounded-full font-medium">{it}</span>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
