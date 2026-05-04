/**
 * 透過 Resend 發送 transactional email。
 *
 * 環境變數：
 * - RESEND_API_KEY  Resend API key (https://resend.com/api-keys)
 * - CONTACT_EMAIL_FROM  寄件者，需於 Resend 驗證過的網域。
 *                       測試階段可用 'Dingli Rental <onboarding@resend.dev>'
 * - CONTACT_EMAIL_TO  收件者；預設 service@dingli-rental.com
 */

const RESEND_URL = 'https://api.resend.com/emails';

export type SendEmailInput = {
  from?: string;
  to?: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ id: string } | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Email 服務未設定：缺少 RESEND_API_KEY 環境變數');
  }

  const from = input.from || process.env.CONTACT_EMAIL_FROM || 'Dingli Rental <onboarding@resend.dev>';
  const to = input.to ?? process.env.CONTACT_EMAIL_TO ?? 'service@dingli-rental.com';

  const body: Record<string, unknown> = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject: input.subject,
    html: input.html,
  };
  if (input.replyTo) body.reply_to = input.replyTo;

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${errText.slice(0, 300)}`);
  }
  const json = await res.json().catch(() => ({} as any));
  return json && typeof json.id === 'string' ? { id: json.id } : null;
}

export function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
