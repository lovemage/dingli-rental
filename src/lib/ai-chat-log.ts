import { prisma } from '@/lib/prisma';

/** AI 客服對話保留天數；超過即自動刪除 */
export const AI_CHAT_RETENTION_DAYS = 90;
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

let lastCleanupAt = 0;

export type ChatLogMessage = { role: 'user' | 'assistant'; content: string };

export function isValidChatSessionId(v: unknown): v is string {
  return typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);
}

/** 刪除超過保留期限的對話（每個 process 每小時最多執行一次） */
export async function cleanupExpiredChatLogs(force = false): Promise<number> {
  const now = Date.now();
  if (!force && now - lastCleanupAt < CLEANUP_INTERVAL_MS) return 0;
  lastCleanupAt = now;
  const cutoff = new Date(now - AI_CHAT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  try {
    const r = await prisma.aiChatLog.deleteMany({ where: { updatedAt: { lt: cutoff } } });
    return r.count;
  } catch (e) {
    console.error('[ai-chat-log] cleanup failed', (e as Error).message);
    return 0;
  }
}

/** 以整段對話覆寫該 session 的紀錄（前台每次送出都帶完整歷史） */
export async function saveChatLog(input: {
  sessionId: string;
  language: string;
  messages: ChatLogMessage[];
  inquiryId?: number | null;
}): Promise<void> {
  const messages = input.messages.slice(-60).map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  const data = {
    language: input.language,
    messages: messages as any,
    messageCount: messages.length,
    ...(input.inquiryId ? { inquiryId: input.inquiryId } : {}),
  };
  try {
    await prisma.aiChatLog.upsert({
      where: { sessionId: input.sessionId },
      create: { sessionId: input.sessionId, ...data },
      update: data,
    });
  } catch (e) {
    console.error('[ai-chat-log] save failed', (e as Error).message);
  }
  void cleanupExpiredChatLogs();
}

export async function getChatLogInquiryId(sessionId: string): Promise<number | null> {
  try {
    const row = await prisma.aiChatLog.findUnique({ where: { sessionId }, select: { inquiryId: true } });
    return row?.inquiryId ?? null;
  } catch {
    return null;
  }
}
