import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { deleteUpload } from '@/lib/storage';
import { isVideoUrl, normalizePropertyMediaOrder } from '@/lib/property-media';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  const property = await prisma.property.findUnique({
    where: { id },
    include: { images: { orderBy: { order: 'asc' } } },
  });
  if (!property) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(property);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  try {
    const body = await req.json();
    // 從 update payload 剝除以下兩類欄位：
    //   1. immutable / 系統管理：id / code / createdAt / updatedAt / inactiveAt
    //      —— 特別是 updatedAt，編輯表單載入時會帶入 DB 既有值，若不剝掉
    //      Prisma 會把舊字串寫回去，壓掉 @updatedAt 的自動 bump，導致
    //      orderBy [featured DESC, updatedAt DESC] 認不出這筆剛被更新。
    //   2. images 另外走 deleteMany + create 流程
    const {
      images = [],
      id: _droppedId,
      code: _droppedCode,
      createdAt: _droppedCreatedAt,
      updatedAt: _droppedUpdatedAt,
      inactiveAt: _droppedInactiveAt,
      ...data
    } = body;
    void _droppedId;
    void _droppedCode;
    void _droppedCreatedAt;
    void _droppedUpdatedAt;
    void _droppedInactiveAt;
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

    const existing = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // 替換圖片：刪除舊的不在新清單的圖
    const newUrlSet = new Set<string>(orderedMedia);
    for (const img of existing.images) {
      if (!newUrlSet.has(img.url)) {
        await deleteUpload(img.url);
      }
    }

    const updated = await prisma.property.update({
      where: { id },
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
          deleteMany: {},
          create: orderedMedia.map((url: string, idx: number) => ({ url, order: idx })),
        },
      },
      include: { images: true },
    });

    // 翻譯只在首次建立 (POST /api/properties) 時自動執行；
    // 後續更新一律不重打翻譯 API，避免每次小修改都耗用配額。
    // 若需要重譯，請走 POST /api/properties/:id/translate（強制重譯）
    // 或 POST /api/properties/translate-pending（補譯缺漏語系）。

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '更新失敗' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  const property = await prisma.property.findUnique({ where: { id }, include: { images: true } });
  if (!property) return NextResponse.json({ error: 'not found' }, { status: 404 });

  for (const img of property.images) {
    await deleteUpload(img.url);
  }
  await prisma.property.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
