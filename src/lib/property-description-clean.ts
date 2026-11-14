/**
 * 物件描述清理：移除從 591 等平台複製過來、不適合放在官網的整行文字
 * （平台留言提醒、個人 LINE / 手機聯絡方式、個人業務宣傳句），中文原文與 EN / JA 譯文共用。
 *
 * 注意：scripts/clean-property-descriptions.cjs 內有同一份規則（給線上容器直接用 node 執行），修改時兩邊一起改。
 */
const REMOVE_LINE_RULES: RegExp[] = [
  // 「請勿在591留言，易漏訊息，加line速回」及其譯文
  /591.*(留言|訊息|message|メッセージ)|(留言|message|メッセージ).*591/i,
  // 「Line：@810adwvn」「LINE ID: xxx」這類單獨一行的 LINE 帳號
  /^\s*(line|賴)\s*(id)?\s*[:：]\s*@?[\w.-]+\s*$/i,
  // 業務個人手機（例：紫晴 0983-994-269( Line ID )( 沒接電話請加賴聯繫 )）
  /09\d{2}[-\s]?\d{3}[-\s]?\d{3}/,
  // 「If you're looking for houses, Ho Yuan is your best real estate agent.」等個人宣傳句
  /ho[\s-]*yuan/i,
  /best real estate agent/i,
];

export function cleanPropertyDescription(text: string): string;
export function cleanPropertyDescription(text: string | null | undefined): string | null | undefined;
export function cleanPropertyDescription(text: string | null | undefined): string | null | undefined {
  if (typeof text !== 'string' || !text) return text;
  const kept = text.split('\n').filter((line) => !REMOVE_LINE_RULES.some((re) => re.test(line)));
  return kept
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // 移除後留下的連續空行收斂成一個段落間距
    .trim();
}
