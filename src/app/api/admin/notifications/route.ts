import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { loadNotificationSettings, saveNotificationSettings } from '@/lib/notifications';
import { maskTelegramToken, maskTelegramChatId } from '@/data/notification-defaults';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const s = await loadNotificationSettings();
  return NextResponse.json({
    telegramEnabled: s.telegramEnabled,
    telegramTokenMasked: maskTelegramToken(s.telegramBotToken),
    telegramTokenConfigured: Boolean(s.telegramBotToken),
    telegramChatIdMasked: maskTelegramChatId(s.telegramChatId),
    telegramChatIdConfigured: Boolean(s.telegramChatId),
  });
}

export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const body = await req.json();
    const saved = await saveNotificationSettings({
      telegramEnabled: typeof body.telegramEnabled === 'boolean' ? body.telegramEnabled : undefined,
      telegramBotToken: typeof body.telegramBotToken === 'string' ? body.telegramBotToken : '',
      telegramChatId: typeof body.telegramChatId === 'string' ? body.telegramChatId : '',
    });
    return NextResponse.json({
      ok: true,
      telegramEnabled: saved.telegramEnabled,
      telegramTokenMasked: maskTelegramToken(saved.telegramBotToken),
      telegramTokenConfigured: Boolean(saved.telegramBotToken),
      telegramChatIdMasked: maskTelegramChatId(saved.telegramChatId),
      telegramChatIdConfigured: Boolean(saved.telegramChatId),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '儲存失敗' }, { status: 500 });
  }
}
