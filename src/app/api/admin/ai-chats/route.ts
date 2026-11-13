import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { cleanupExpiredChatLogs } from '@/lib/ai-chat-log';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const PAGE_SIZE = 20;

function firstUserMessage(messages: unknown): string {
  if (!Array.isArray(messages)) return '';
  const m = messages.find((x: any) => x?.role === 'user' && typeof x?.content === 'string');
  return m ? String((m as any).content).slice(0, 120) : '';
}

/** GET /api/admin/ai-chats?page=1 — AI 客服對話列表（新到舊） */
export async function GET(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    await cleanupExpiredChatLogs(true);
    const url = new URL(req.url);
    const total = await prisma.aiChatLog.count();
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(totalPages, Math.max(1, Number(url.searchParams.get('page')) || 1));
    const rows = await prisma.aiChatLog.findMany({
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    const items = rows.map((r) => ({
      id: r.id,
      language: r.language,
      messageCount: r.messageCount,
      inquiryId: r.inquiryId,
      preview: firstUserMessage(r.messages),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
    return NextResponse.json({ items, total, page, totalPages });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '讀取對話紀錄失敗' }, { status: 500 });
  }
}
