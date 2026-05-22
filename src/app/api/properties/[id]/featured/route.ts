import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { validateActiveFeaturedLimit } from '@/lib/featured-limit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  try {
    const body = await req.json().catch(() => ({}));
    const featured = typeof body?.featured === 'boolean' ? body.featured : true;
    const limitError = await validateActiveFeaturedLimit({ propertyId: id, nextFeatured: featured });
    if (limitError) {
      const status = limitError === 'not found' ? 404 : 400;
      return NextResponse.json({ error: limitError }, { status });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: { featured },
      select: { id: true, featured: true },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '更新精選狀態失敗' }, { status: 500 });
  }
}
