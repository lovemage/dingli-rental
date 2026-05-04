// 通知設定（Telegram bot）
// 對應 SiteContent.section = 'notification_settings'

export type NotificationSettings = {
  telegramEnabled: boolean;
  telegramBotToken: string;  // 敏感，前台 GET 會被遮罩
  telegramChatId: string;    // 也遮罩以避免無謂洩漏
};

export const NOTIFICATION_DEFAULTS: NotificationSettings = {
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
};

/** 遮罩 bot token：保留 bot id 部分，token 主體用 *** */
export function maskTelegramToken(token: string): string {
  if (!token) return '';
  // Telegram token 格式：123456789:ABCdef...
  const m = token.match(/^(\d+):(.+)$/);
  if (!m) return '••••';
  const [, id, secret] = m;
  if (secret.length <= 8) return `${id}:••••`;
  return `${id}:${secret.slice(0, 4)}••••${secret.slice(-4)}`;
}

/** 遮罩 chat id：保留前後幾碼 */
export function maskTelegramChatId(id: string): string {
  if (!id) return '';
  if (id.length <= 4) return '••••';
  return `${id.slice(0, 3)}••••${id.slice(-3)}`;
}
