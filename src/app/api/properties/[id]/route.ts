import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { deleteUpload } from '@/lib/storage';
import { triggerTranslateInBackground } from '@/lib/property-translate';

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
    const { images = [], ...data } = body;

    const existing = await prisma.property.findUnique({ where: { id }, include: { images: true } });
    if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // 替換圖片：刪除舊的不在新清單的圖
    const newUrlSet = new Set<string>(images);
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
          create: images.map((url: string, idx: number) => ({ url, order: idx })),
        },
      },
      include: { images: true },
    });

    // fire-and-forget 重新翻譯（內容變更時 sourceHash 不同會觸發重譯）
    triggerTranslateInBackground(updated.id);

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
