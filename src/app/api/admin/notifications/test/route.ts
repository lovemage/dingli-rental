import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { sendTelegram } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 測試送出。可帶 { telegramBotToken, telegramChatId } 直接驗證未儲存的值；
 * 不帶就用 DB 已存的設定。
 */
export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({} as any));
    const token = typeof body?.telegramBotToken === 'string' ? body.telegramBotToken : '';
    const chatId = typeof body?.telegramChatId === 'string' ? body.telegramChatId : '';

    const text = [
      '🧪 <b>測試通知</b>',
      '',
      '這是來自鼎立租售管理後台的測試訊息。',
      '若你看到這則訊息，代表 Telegram 通知設定成功 ✓',
      '',
      `時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}`,
    ].join('\n');

    await sendTelegram({
      text,
      override: token || chatId ? { token, chatId } : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '送出失敗' }, { status: 500 });
  }
}
