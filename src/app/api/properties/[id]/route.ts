import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { deleteUpload } from '@/lib/storage';
import { translateProperty } from '@/lib/property-translate';
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
    // 編號 (code) 建立後 immutable，從 update payload 移除避免 admin 表單誤覆寫
    const { images = [], code: _droppedCode, ...data } = body;
    void _droppedCode;
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

    const existing = await prisma.property.findUnique({ where: { id }, include: { images: true } });
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

    // 在 response 後執行翻譯，避免 serverless request 結束就中斷
    after(async () => {
      await translateProperty(updated.id).catch((e) => {
        console.error(`[after translateProperty:update] ${updated.id}`, (e as Error).message);
      });
    });

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
