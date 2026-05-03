import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET ?section=services|careers|contact|about
export async function GET(req: Request) {
  const url = new URL(req.url);
  const section = url.searchParams.get('section');
  if (!section) return NextResponse.json({ error: 'missing section' }, { status: 400 });
  const item = await prisma.siteContent.findUnique({ where: { section } });
  return NextResponse.json(item || { section, data: null });
}

// PUT { section, data }
export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const { section, data } = await req.json();
  if (!section) return NextResponse.json({ error: 'missing section' }, { status: 400 });
  const saved = await prisma.siteContent.upsert({
    where: { section },
    create: { section, data },
    update: { data },
  });
  return NextResponse.json(saved);
}
