import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminPropertiesList() {
  let items: any[] = [];
  try {
    items = await prisma.property.findMany({
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: { createdAt: 'desc' },
    });
  } catch {}

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black mb-1">物件管理</h1>
          <p className="text-ink-500 text-sm">共 {items.length} 筆</p>
        </div>
        <Link href="/admin/properties/new" className="btn btn-primary">+ 新增物件</Link>
      </div>

      {items.length === 0 ? (
        <div className="admin-card text-center text-ink-500 py-14">
          <p className="mb-3">尚未建立任何物件</p>
          <Link href="/admin/properties/new" className="btn btn-primary">建立第一筆物件</Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((p) => (
            <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-line">
              <div className="aspect-[4/3] bg-paper-2 overflow-hidden">
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full grid place-items-center text-ink-300">暫無圖片</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.status === 'active' ? 'bg-brand-green-50 text-brand-green-700' : 'bg-paper-2 text-ink-500'}`}>
                    {p.status === 'active' ? '上架中' : '已下架'}
                  </span>
                  <span className="text-xs text-ink-500">{p.typeMid}</span>
                </div>
                <h3 className="font-bold text-base line-clamp-1 mb-1">{p.title}</h3>
                <p className="text-sm text-ink-500 mb-2">{p.region}・{p.district}</p>
                <p className="text-brand-green-900 font-black text-lg mb-3">NT$ {p.rent.toLocaleString()}<span className="text-xs text-ink-500 font-medium"> /月</span></p>
                <div className="flex gap-2">
                  <Link href={`/admin/properties/${p.id}/edit`} className="flex-1 text-center text-sm font-medium border border-line rounded-lg py-2 hover:border-brand-green-500 hover:text-brand-green-700">編輯</Link>
                  <Link href={`/properties/${p.id}`} target="_blank" className="flex-1 text-center text-sm font-medium border border-line rounded-lg py-2 hover:border-brand-orange-500 hover:text-brand-orange-700">預覽</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
