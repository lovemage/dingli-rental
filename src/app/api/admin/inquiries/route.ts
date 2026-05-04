import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUS = new Set(['new', 'contacted', 'closed']);

export async function GET(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const where = status && ALLOWED_STATUS.has(status) ? { status } : {};

  const [items, counts] = await Promise.all([
    prisma.contactInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.contactInquiry.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ]);

  const byStatus: Record<string, number> = { new: 0, contacted: 0, closed: 0 };
  for (const c of counts) byStatus[c.status] = c._count._all;
  byStatus.all = byStatus.new + byStatus.contacted + byStatus.closed;

  return NextResponse.json({ items, counts: byStatus });
}
