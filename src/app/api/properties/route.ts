import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { translateProperty } from '@/lib/property-translate';
import { isVideoUrl, normalizePropertyMediaOrder } from '@/lib/property-media';

export const dynamic = 'force-dynamic';

// GET /api/properties — 公開搜尋介面
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim() || '';
  const region = url.searchParams.get('region') || '';
  const typeMid = url.searchParams.get('type') || '';
  const buildingType = url.searchParams.get('building') || '';
  const minRent = Number(url.searchParams.get('minRent') || 0);
  const maxRent = Number(url.searchParams.get('maxRent') || 0);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get('pageSize') || 12)));

  const where: any = { status: 'active' };
  if (region) where.region = region;
  if (typeMid) where.typeMid = typeMid;
  if (buildingType) where.buildingType = buildingType;
  if (minRent > 0 || maxRent > 0) {
    where.rent = {};
    if (minRent > 0) where.rent.gte = minRent;
    if (maxRent > 0) where.rent.lte = maxRent;
  }
  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { community: { contains: q, mode: 'insensitive' } },
      { district: { contains: q, mode: 'insensitive' } },
    ];
  }

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

  return NextResponse.json({ items, total, page, pageSize });
}

// POST /api/properties — 建立物件（admin only）
export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      images = [],
      ...data
    } = body;
    const rawMedia = Array.isArray(images) ? images : [];
    const orderedMedia = normalizePropertyMediaOrder(rawMedia);
    if (rawMedia.length > 0 && orderedMedia.length === 0) {
      return NextResponse.json({ error: '請至少上傳 1 張圖片作為封面，影片不可單獨上架' }, { status: 400 });
    }
    const videoCount = orderedMedia.filter(isVideoUrl).length;
    if (videoCount > 2) {
      return NextResponse.json({ error: '單一物件最多只能上傳 2 支影片' }, { status: 400 });
    }
    if (orderedMedia.length > 0 && isVideoUrl(orderedMedia[0])) {
      return NextResponse.json({ error: '影片不可作為封面，請至少上傳 1 張圖片作為封面' }, { status: 400 });
    }

    const created = await prisma.property.create({
      data: {
        ...data,
        rent: Number(data.rent || 0),
        rooms: Number(data.rooms || 0),
        livingRooms: Number(data.livingRooms || 0),
        bathrooms: Number(data.bathrooms || 0),
        balconies: Number(data.balconies || 0),
        usableArea: Number(data.usableArea || 0),
        registeredArea: data.registeredArea ? Number(data.registeredArea) : null,
        managementFee: data.managementFee ? Number(data.managementFee) : null,
        buildingAge: data.buildingAge ? Number(data.buildingAge) : null,
        moveInDate: data.moveInDate ? new Date(data.moveInDate) : null,
        images: {
          create: orderedMedia.map((url: string, idx: number) => ({ url, order: idx })),
        },
      },
      include: { images: true },
    });

    // 在 response 後執行翻譯，避免 serverless request 結束就中斷
    after(async () => {
      await translateProperty(created.id).catch((e) => {
        console.error(`[after translateProperty:create] ${created.id}`, (e as Error).message);
      });
    });

    return NextResponse.json(created);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '建立失敗' }, { status: 500 });
  }
}
