import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dayStartUtc, getClientIp, hashIp } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 記錄一次物件瀏覽。同 IP + 同 propertyId + 同一天只計 1 次（DB unique）。
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const propertyId = Number(body?.propertyId);
    if (!Number.isFinite(propertyId) || propertyId <= 0) {
      return NextResponse.json({ ok: false, error: 'invalid propertyId' }, { status: 400 });
    }

    // 驗證物件存在後才寫入，避免被灌任意 ID 製造 view 資料
    // （schema FK 也會擋下 P2003，但這裡先擋一拍，回傳訊息更清楚、減少 DB 重試）
    const exists = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ ok: false, error: 'property not found' }, { status: 404 });
    }

    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    if (!ipHash) {
      // 拿不到 IP 的請求一律忽略，避免空字串撞 unique 互相覆蓋
      return NextResponse.json({ ok: true, skipped: 'no-ip' });
    }

    const day = dayStartUtc();
    try {
      await prisma.propertyView.create({
        data: { propertyId, ipHash, day },
      });
      return NextResponse.json({ ok: true, counted: true });
    } catch (e: any) {
      // P2002 = 已經計過，視為成功
      if (e?.code === 'P2002') return NextResponse.json({ ok: true, counted: false });
      // P2003 = FK violation（物件在 existence check 後被刪掉的 race window）→ 視為靜默失敗
      if (e?.code === 'P2003') return NextResponse.json({ ok: false, error: 'property gone' }, { status: 404 });
      throw e;
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'track failed' }, { status: 500 });
  }
}
