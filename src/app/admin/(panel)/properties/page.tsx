import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isPropertyCode, normalizePropertyCode } from '@/lib/property-code';
import { buildAdminPropertyWhere } from '@/lib/property-search';
import { availableMonths, parseMonthRange } from '@/lib/tracking';
import PropertiesManager from '@/components/admin/PropertiesManager';

export const dynamic = 'force-dynamic';

type SearchParams = { q?: string; month?: string };

function currentMonthStr(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function AdminPropertiesList({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = (sp.q || '').trim();
  const monthStr = (sp.month || '').trim() || currentMonthStr();
  const monthRange = parseMonthRange(monthStr);
  void availableMonths();

  if (q && isPropertyCode(q)) {
    const hit = await prisma.property
      .findUnique({ where: { code: normalizePropertyCode(q) }, select: { id: true } })
      .catch(() => null);
    if (hit) redirect(`/admin/properties/${hit.id}/edit`);
  }

  const where = buildAdminPropertyWhere(q);

  const items = await prisma.property.findMany({
    where,
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });

  const viewMonthByProperty = new Map<number, number>();
  const viewTotalByProperty = new Map<number, number>();

  try {
    if (monthRange) {
      const monthRows = await prisma.propertyView.groupBy({
        by: ['propertyId'],
        where: { day: { gte: monthRange.start, lt: monthRange.end } },
        _count: { _all: true },
      });
      for (const r of monthRows) viewMonthByProperty.set(r.propertyId, r._count._all);
    }
    const totalRows = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      _count: { _all: true },
    });
    for (const r of totalRows) viewTotalByProperty.set(r.propertyId, r._count._all);
  } catch {
    // ignore
  }

  const normalizedItems = items.map((p) => ({
    id: p.id,
    code: p.code,
    title: p.title,
    region: p.region,
    district: p.district,
    street: p.street,
    lane: p.lane,
    alley: p.alley,
    number: p.number,
    numberSub: p.numberSub,
    typeMid: p.typeMid,
    rent: p.rent,
    usableArea: p.usableArea,
    status: p.status,
    listingStatus: p.listingStatus,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
    inactiveAt: p.inactiveAt ? p.inactiveAt.toISOString() : null,
    imageUrl: p.images[0]?.url || null,
    monthViews: viewMonthByProperty.get(p.id) ?? 0,
    totalViews: viewTotalByProperty.get(p.id) ?? 0,
  }));

  return <PropertiesManager initialItems={normalizedItems} monthStr={monthStr} q={q} />;
}
