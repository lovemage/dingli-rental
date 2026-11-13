import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** GET /api/admin/ai-chats/:id — 單一對話完整內容 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const id = Number((await params).id);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  const row = await prisma.aiChatLog.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({
    id: row.id,
    language: row.language,
    inquiryId: row.inquiryId,
    messages: Array.isArray(row.messages) ? row.messages : [],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const id = Number((await params).id);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });
  await prisma.aiChatLog.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
