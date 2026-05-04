import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { deleteUpload } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET — 公開讀取（admin 用 ?all=1 取得全部含未啟用的圖）
export async function GET(req: Request) {
  const url = new URL(req.url);
  const all = url.searchParams.get('all') === '1';
  let me = null;
  if (all) {
    me = await getCurrentAdmin();
  }
  const where = all && me ? {} : { active: true };
  const [slides, settings] = await Promise.all([
    prisma.heroSlide.findMany({ where, orderBy: { order: 'asc' }, take: 3 }),
    prisma.heroSettings.findUnique({ where: { id: 1 } }),
  ]);
  return NextResponse.json({
    slides,
    intervalSec: settings?.intervalSec ?? 5,
  });
}

// PUT — 後台儲存（一次儲存所有 slides + interval）
export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const body = await req.json();
  const incoming: { id?: number; imageUrl: string; title?: string; subtitle?: string; ctaText?: string; ctaLink?: string; active?: boolean }[] = body.slides || [];
  const intervalSec = Math.max(2, Math.min(60, Number(body.intervalSec || 5)));

  const slides = incoming.slice(0, 3); // 最多 3 張

  // 取得舊的 slides，刪除被移除的圖片
  const old = await prisma.heroSlide.findMany();
  const incomingUrls = new Set(slides.map((s) => s.imageUrl));
  for (const o of old) {
    if (!incomingUrls.has(o.imageUrl)) {
      await deleteUpload(o.imageUrl);
    }
  }

  await prisma.heroSlide.deleteMany();
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    await prisma.heroSlide.create({
      data: {
        imageUrl: s.imageUrl,
        title: s.title || null,
        subtitle: s.subtitle || null,
        ctaText: s.ctaText || null,
        ctaLink: s.ctaLink || null,
        order: i,
        active: s.active ?? true,
      },
    });
  }

  await prisma.heroSettings.upsert({
    where: { id: 1 },
    create: { id: 1, intervalSec },
    update: { intervalSec },
  });

  return NextResponse.json({ ok: true });
}
