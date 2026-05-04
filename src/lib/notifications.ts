import { prisma } from '@/lib/prisma';
import {
  NOTIFICATION_DEFAULTS,
  type NotificationSettings,
} from '@/data/notification-defaults';

const TELEGRAM_API = 'https://api.telegram.org';

/** 從 DB 載入通知設定，缺值用預設 */
export async function loadNotificationSettings(): Promise<NotificationSettings> {
  let dbSettings: Partial<NotificationSettings> = {};
  try {
    const row = await prisma.siteContent.findUnique({
      where: { section: 'notification_settings' },
    });
    if (row?.data && typeof row.data === 'object') {
      dbSettings = row.data as Partial<NotificationSettings>;
    }
  } catch {
    // ignore
  }
  return { ...NOTIFICATION_DEFAULTS, ...dbSettings };
}

/** 寫回 DB；空字串會保留原值（避免遮罩過的回傳值寫回去清空 token） */
export async function saveNotificationSettings(
  patch: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  const current = await loadNotificationSettings();
  const next: NotificationSettings = {
    telegramEnabled: patch.telegramEnabled ?? current.telegramEnabled,
    telegramBotToken:
      typeof patch.telegramBotToken === 'string' && patch.telegramBotToken.trim()
        ? patch.telegramBotToken.trim()
        : current.telegramBotToken,
    telegramChatId:
      typeof patch.telegramChatId === 'string' && patch.telegramChatId.trim()
        ? patch.telegramChatId.trim()
        : current.telegramChatId,
  };
  await prisma.siteContent.upsert({
    where: { section: 'notification_settings' },
    create: { section: 'notification_settings', data: next as any },
    update: { data: next as any },
  });
  return next;
}

/** 把 HTML 特殊字元轉義（Telegram HTML mode） */
function tgEscape(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * 送一則 Telegram 訊息。可選用 override（測試用）。
 * 失敗會 throw，呼叫端決定要不要 catch。
 */
export async function sendTelegram(opts: {
  text: string;
  override?: { token?: string; chatId?: string };
}): Promise<void> {
  let token = opts.override?.token?.trim() || '';
  let chatId = opts.override?.chatId?.trim() || '';
  if (!token || !chatId) {
    const s = await loadNotificationSettings();
    if (!token) token = s.telegramBotToken;
    if (!chatId) chatId = s.telegramChatId;
  }
  if (!token || !chatId) {
    throw new Error('Telegram 設定不完整：缺少 bot token 或 chat ID');
  }

  const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: opts.text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Telegram ${res.status}: ${errBody.slice(0, 300)}`);
  }
}

/** 客戶詢問通知 — 不擋主流程，失敗只 log */
export async function notifyNewInquiry(inquiry: {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  region: string | null;
  propertyType: string | null;
  budget: number | null;
  message: string | null;
}): Promise<void> {
  try {
    const s = await loadNotificationSettings();
    if (!s.telegramEnabled || !s.telegramBotToken || !s.telegramChatId) return;

    const lines: string[] = [
      '🔔 <b>新客戶詢問</b>',
      '',
      `<b>姓名：</b>${tgEscape(inquiry.name)}`,
      `<b>電話：</b>${tgEscape(inquiry.phone)}`,
    ];
    if (inquiry.email) lines.push(`<b>Email：</b>${tgEscape(inquiry.email)}`);
    if (inquiry.region) lines.push(`<b>地區：</b>${tgEscape(inquiry.region)}`);
    if (inquiry.propertyType) lines.push(`<b>類型：</b>${tgEscape(inquiry.propertyType)}`);
    if (inquiry.budget && inquiry.budget > 0) {
      lines.push(`<b>預算：</b>NT$ ${inquiry.budget.toLocaleString()} / 月`);
    }
    if (inquiry.message) {
      lines.push('');
      lines.push('<b>訊息：</b>');
      lines.push(tgEscape(inquiry.message.slice(0, 1000)));
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com').replace(/\/$/, '');
    lines.push('');
    lines.push(`📋 <a href="${siteUrl}/admin/inquiries">查看詳情</a>`);

    await sendTelegram({ text: lines.join('\n') });
  } catch (e: any) {
    console.error('[notifyNewInquiry] failed', e?.message);
  }
}
