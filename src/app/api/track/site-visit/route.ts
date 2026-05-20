import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dayStartUtc, getClientIp, hashIp } from '@/lib/tracking';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 記錄一次首頁訪客。同 IP + 同一天只計 1 次。
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipHash = hashIp(ip);
    if (!ipHash) return NextResponse.json({ ok: true, skipped: 'no-ip' });

    const day = dayStartUtc();
    await prisma.siteVisit.upsert({
      where: { ipHash_day: { ipHash, day } },
      update: {},
      create: { ipHash, day },
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'track failed' }, { status: 500 });
  }
}
