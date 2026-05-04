import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUS = new Set(['new', 'contacted', 'closed']);

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  try {
    const body = await req.json().catch(() => ({} as any));
    const data: { status?: string; notes?: string } = {};
    if (typeof body.status === 'string' && ALLOWED_STATUS.has(body.status)) {
      data.status = body.status;
    }
    if (typeof body.notes === 'string') {
      data.notes = body.notes.slice(0, 2000);
    }
    if (!Object.keys(data).length) {
      return NextResponse.json({ error: '沒有可更新的欄位' }, { status: 400 });
    }
    const updated = await prisma.contactInquiry.update({ where: { id }, data });
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

  try {
    await prisma.contactInquiry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '刪除失敗' }, { status: 500 });
  }
}
