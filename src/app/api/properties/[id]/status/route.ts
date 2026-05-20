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

    const updated = await prisma.property.update({
      where: { id },
      data: {
        status: nextStatus,
        ...(nextListingStatus ? { listingStatus: nextListingStatus } : {}),
      },
      select: { id: true, status: true, listingStatus: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '更新狀態失敗' }, { status: 500 });
  }
}
