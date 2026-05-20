import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { deleteUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const RETENTION_DAYS = 90;
const BATCH_SIZE = 100;

function isAuthorized(req: Request): boolean {
  const secret = (process.env.CRON_SECRET || '').trim();
  if (!secret) return false;
  const header = (req.headers.get('x-cron-secret') || '').trim();
  return header.length > 0 && header === secret;
}

function cutoffDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const cutoff = cutoffDate(RETENTION_DAYS);

  try {
    const targets = await prisma.property.findMany({
      where: {
        status: 'inactive',
        inactiveAt: { lte: cutoff },
        images: { some: {} },
      },
      select: {
        id: true,
        code: true,
        images: { select: { id: true, url: true } },
      },
      orderBy: { inactiveAt: 'asc' },
      take: BATCH_SIZE,
    });

    let deletedImages = 0;
    let cleanedProperties = 0;

    for (const p of targets) {
      for (const img of p.images) {
        await deleteUpload(img.url);
      }

      const deleted = await prisma.propertyImage.deleteMany({ where: { propertyId: p.id } });
      deletedImages += deleted.count;
      cleanedProperties += 1;
    }

    return NextResponse.json({
      ok: true,
      retentionDays: RETENTION_DAYS,
      cutoff: cutoff.toISOString(),
      batchSize: BATCH_SIZE,
      cleanedProperties,
      deletedImages,
      hasMore: targets.length === BATCH_SIZE,
      targetSample: targets.slice(0, 10).map((p) => ({ id: p.id, code: p.code, imageCount: p.images.length })),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'cleanup failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'method not allowed' }, { status: 405 });
}
