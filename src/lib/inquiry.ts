import { prisma } from '@/lib/prisma';
import { notifyNewInquiry } from '@/lib/notifications';

export type ContactPayload = {
  name?: string;
  phone?: string;
  userRole?: string;
  messengerType?: string;
  messengerHandle?: string;
  region?: string;
  propertyType?: string;
  budget?: string | number;
  message?: string;
};

const VALID_USER_ROLES = new Set(['renter', 'landlord']);
const VALID_MESSENGERS = new Set(['line', 'whatsapp', 'wechat']);
const INQUIRY_EMAIL_TO = 'service@dingli-rental.com';

function messengerLabel(v: string | null): string {
  if (v === 'line') return 'LINE ID';
  if (v === 'whatsapp') return 'WhatsApp';
  if (v === 'wechat') return 'WeChat';
  return '聯絡方式';
}

async function sendInquiryEmail(input: {
  name: string;
  phone: string;
  userRole: string;
  messengerType: string | null;
  messengerHandle: string | null;
  region: string | null;
  propertyType: string | null;
  budget: number | null;
  message: string | null;
  inquiryId: number;
}) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM_EMAIL || 'Dingli Rental <noreply@dingli-rental.com>').trim();
  if (!apiKey) {
    console.warn('[contact-email] RESEND_API_KEY is not set, skip sending inquiry email');
    return;
  }

  const roleLabel = input.userRole === 'landlord' ? '出租方' : '承租方';
  const budgetText = input.budget && input.budget > 0 ? `NT$ ${input.budget.toLocaleString()} / 月` : '未填寫';
  const messengerText = input.messengerHandle
    ? `${messengerLabel(input.messengerType)}：${input.messengerHandle}`
    : '未填寫';

  const lines = [
    `新需求表單通知 #${input.inquiryId}`,
    '',
    `姓名：${input.name}`,
    `身份：${roleLabel}`,
    `電話：${input.phone}`,
    messengerText,
    `地區：${input.region || '未填寫'}`,
    `類型：${input.propertyType || '未填寫'}`,
    `預算：${budgetText}`,
    '',
    '需求描述：',
    input.message || '（無）',
  ];

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [INQUIRY_EMAIL_TO],
      subject: `【鼎立需求表單】${input.name} / ${input.region || '未填地區'}`,
      text: lines.join('\n'),
    }),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Resend ${resp.status}: ${err.slice(0, 300)}`);
  }
}


export type InquirySource = 'form' | 'ai_chat';

export class InquiryValidationError extends Error {}

/**
 * 建立需求單（網站表單與 AI 客服共用）：驗證 → 寫入 → 背景通知（Telegram / Email）。
 * - form：手機須為 09 開頭 10 碼
 * - ai_chat：外籍客戶可能留國際號碼，接受 + 與 8~15 位數字
 */
export async function createInquiry(
  body: ContactPayload,
  opts: { source: InquirySource; chatSessionId?: string } = { source: 'form' },
) {
  const name = (body.name || '').trim();
  const phone = (body.phone || '').trim();
  const userRoleRaw = (body.userRole || '').trim();
  const messengerTypeRaw = (body.messengerType || '').trim();
  const messengerHandle = (body.messengerHandle || '').trim();
  const region = (body.region || '').trim().slice(0, 50);
  const propertyType = (body.propertyType || '').trim().slice(0, 50);
  const budgetStr = String(body.budget ?? '').trim();
  const message = (body.message || '').trim();

  if (!name || name.length > 50) throw new InquiryValidationError('請填寫姓名（50 字以內）');
  if (opts.source === 'ai_chat') {
    const digits = phone.replace(/[\s()-]/g, '');
    if (!/^\+?\d{8,15}$/.test(digits)) throw new InquiryValidationError('請提供正確的電話號碼');
  } else if (!/^09\d{8}$/.test(phone)) {
    throw new InquiryValidationError('請填寫 09 開頭的 10 碼手機號碼');
  }
  // AI 客服未明確取得身份時，預設承租方
  const userRole = VALID_USER_ROLES.has(userRoleRaw)
    ? userRoleRaw
    : opts.source === 'ai_chat'
      ? 'renter'
      : '';
  if (!userRole) throw new InquiryValidationError('請選擇承租方或出租方');
  const messengerType = VALID_MESSENGERS.has(messengerTypeRaw) ? messengerTypeRaw : 'line';
  if (messengerHandle.length > 80) throw new InquiryValidationError('聯絡 ID / 號碼過長');
  if (message.length > 2000) throw new InquiryValidationError('需求描述過長（請於 2000 字內）');

  const budgetDigits = budgetStr.replace(/[^\d.]/g, '');
  const budgetNum = budgetDigits ? Math.max(0, Math.round(Number(budgetDigits))) || null : null;

  const inquiry = await prisma.contactInquiry.create({
    data: {
      name,
      phone,
      userRole,
      // 新版表單不再收 email；email 欄沿用為 messenger handle 儲存欄位
      messengerType: messengerHandle ? messengerType : null,
      email: messengerHandle || null,
      region: region || null,
      propertyType: propertyType || null,
      budget: budgetNum,
      message: message || null,
      source: opts.source,
      chatSessionId: opts.chatSessionId ?? null,
    },
  });

  // 背景觸發 Telegram 通知（失敗不影響使用者體驗）
  void notifyNewInquiry(inquiry);
  // 背景寄送需求表單通知 Email（失敗不影響使用者體驗）
  void sendInquiryEmail({
    name,
    phone,
    userRole,
    messengerType: messengerHandle ? messengerType : null,
    messengerHandle: messengerHandle || null,
    region: region || null,
    propertyType: propertyType || null,
    budget: budgetNum,
    message: message || null,
    inquiryId: inquiry.id,
  }).catch((e) => {
    console.error('[contact-email] failed', (e as Error).message);
  });

  return inquiry;
}
