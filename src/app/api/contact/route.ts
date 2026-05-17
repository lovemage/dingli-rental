import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewInquiry } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ContactPayload = {
  name?: string;
  phone?: string;
  userRole?: string;
  messengerType?: string;
  messengerHandle?: string;
  region?: string;
  propertyType?: string;
  budget?: string;
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

export async function POST(req: Request) {
  try {
    const body: ContactPayload = await req.json().catch(() => ({} as any));
    const name = (body.name || '').trim();
    const phone = (body.phone || '').trim();
    const userRoleRaw = (body.userRole || '').trim();
    const messengerTypeRaw = (body.messengerType || '').trim();
    const messengerHandle = (body.messengerHandle || '').trim();
    const region = (body.region || '').trim();
    const propertyType = (body.propertyType || '').trim();
    const budgetStr = (body.budget || '').trim();
    const message = (body.message || '').trim();

    if (!name || name.length > 50) {
      return NextResponse.json({ error: '請填寫姓名（50 字以內）' }, { status: 400 });
    }
    if (!phone || phone.length > 30) {
      return NextResponse.json({ error: '請填寫聯絡電話' }, { status: 400 });
    }
    if (!VALID_USER_ROLES.has(userRoleRaw)) {
      return NextResponse.json({ error: '請選擇承租方或出租方' }, { status: 400 });
    }
    // messengerType 預設給 'line'；若填了 handle 但 type 不合法就擋下
    const messengerType = VALID_MESSENGERS.has(messengerTypeRaw) ? messengerTypeRaw : 'line';
    if (messengerHandle.length > 80) {
      return NextResponse.json({ error: '聯絡 ID / 號碼過長' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: '需求描述過長（請於 2000 字內）' }, { status: 400 });
    }

    const budgetNum = budgetStr ? Math.max(0, Math.round(Number(budgetStr))) : null;

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        phone,
        userRole: userRoleRaw,
        // 新版表單不再收 email；email 欄沿用為 messenger handle 儲存欄位
        messengerType: messengerHandle ? messengerType : null,
        email: messengerHandle || null,
        region: region || null,
        propertyType: propertyType || null,
        budget: budgetNum,
        message: message || null,
      },
    });

    // 背景觸發 Telegram 通知（失敗不影響使用者體驗）
    void notifyNewInquiry(inquiry);
    // 背景寄送需求表單通知 Email（失敗不影響使用者體驗）
    void sendInquiryEmail({
      name,
      phone,
      userRole: userRoleRaw,
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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[/api/contact] failed', e?.message);
    return NextResponse.json({ error: e?.message || '送出失敗' }, { status: 500 });
  }
}
