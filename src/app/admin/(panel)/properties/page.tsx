import { redirect } from 'next/navigation';
import { prisma, OWNER_FIELDS_INCLUDE } from '@/lib/prisma';
import { isPropertyCode, normalizePropertyCode } from '@/lib/property-code';
import { buildAdminPropertyWhere } from '@/lib/property-search';
import { availableMonths, parseMonthRange } from '@/lib/tracking';
import PropertiesManager from '@/components/admin/PropertiesManager';

export const dynamic = 'force-dynamic';

type SearchParams = { q?: string; month?: string; minRent?: string; maxRent?: string };

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
  const minRent = (sp.minRent || '').trim();
  const maxRent = (sp.maxRent || '').trim();
  const monthStr = (sp.month || '').trim() || currentMonthStr();
  const monthRange = parseMonthRange(monthStr);
  void availableMonths();

  if (q && isPropertyCode(q)) {
    const hit = await prisma.property
      .findUnique({ where: { code: normalizePropertyCode(q) }, select: { id: true } })
      .catch(() => null);
    if (hit) redirect(`/admin/properties/${hit.id}/edit`);
  }

  const where = buildAdminPropertyWhere(q, { minRent, maxRent });

  const items = await prisma.property.findMany({
    where,
    include: { images: { orderBy: { order: 'asc' }, take: 1 } },
    omit: OWNER_FIELDS_INCLUDE,
    // 精選永遠在前；其餘按最近一次更新時間倒序（更新後自動置頂）
    orderBy: [{ featured: 'desc' }, { updatedAt: 'desc' }],
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
    rooms: p.rooms,
    livingRooms: p.livingRooms,
    openLayout: p.openLayout,
    floorType: p.floorType,
    floor: p.floor,
    floorSub: p.floorSub,
    totalFloor: p.totalFloor,
    parkingType: p.parkingType,
    managementFee: p.managementFee,
    noManagementFee: p.noManagementFee,
    status: p.status,
    listingStatus: p.listingStatus,
    featured: p.featured,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    inactiveAt: p.inactiveAt ? p.inactiveAt.toISOString() : null,
    relistedAt: p.relistedAt ? p.relistedAt.toISOString() : null,
    imageUrl: p.images[0]?.url || null,
    owners: [
      { name: p.ownerName, phone: p.ownerPhone },
      { name: p.ownerName2, phone: p.ownerPhone2 },
      { name: p.ownerName3, phone: p.ownerPhone3 },
      { name: p.ownerName4, phone: p.ownerPhone4 },
      { name: p.ownerName5, phone: p.ownerPhone5 },
    ]
      .map((o) => ({ name: (o.name || '').trim(), phone: (o.phone || '').trim() }))
      .filter((o) => o.name || o.phone),
    monthViews: viewMonthByProperty.get(p.id) ?? 0,
    totalViews: viewTotalByProperty.get(p.id) ?? 0,
  }));

  return (
    <PropertiesManager
      initialItems={normalizedItems}
      monthStr={monthStr}
      q={q}
      minRent={minRent}
      maxRent={maxRent}
    />
  );
}
