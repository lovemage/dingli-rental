import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUS = new Set(['active', 'inactive', 'pending']);
const ALLOWED_LISTING_STATUS = new Set(['active', 'rented', 'sold', 'closed']);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  try {
    const body = await req.json();
    const nextStatus = typeof body?.status === 'string' ? body.status : '';
    const nextListingStatus = typeof body?.listingStatus === 'string' ? body.listingStatus : undefined;

    if (!ALLOWED_STATUS.has(nextStatus)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    if (nextListingStatus && !ALLOWED_LISTING_STATUS.has(nextListingStatus)) {
      return NextResponse.json({ error: 'invalid listingStatus' }, { status: 400 });
    }

    const existing = await prisma.property.findUnique({
      where: { id },
      select: { id: true, status: true, inactiveAt: true },
    });
    if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });

    // 從下架 / pending 轉回上架，視為「重新上架」
    const isRelisting = nextStatus === 'active' && existing.status !== 'active';

    const updated = await prisma.property.update({
      where: { id },
      data: {
        status: nextStatus,
        // 下架：記錄下架時間（沿用既有值避免覆蓋），並清掉精選旗標 —— 物件移出展示就自動轉為一般。
        // 重新上架 / 轉 pending：清掉下架時間。
        inactiveAt: nextStatus === 'inactive' ? (existing.inactiveAt ?? new Date()) : null,
        ...(nextStatus === 'inactive' ? { featured: false } : {}),
        // 重新上架：記錄重新上架時間（後台據此把重新上架物件排在精選/一般之前），
        // 並重置 createdAt 讓前台視為新上架。
        ...(isRelisting ? { relistedAt: new Date(), createdAt: new Date() } : {}),
        ...(nextListingStatus ? { listingStatus: nextListingStatus } : {}),
      },
      select: { id: true, status: true, inactiveAt: true, relistedAt: true, listingStatus: true, createdAt: true, featured: true, updatedAt: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '更新狀態失敗' }, { status: 500 });
  }
}
