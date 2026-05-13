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

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[/api/contact] failed', e?.message);
    return NextResponse.json({ error: e?.message || '送出失敗' }, { status: 500 });
  }
}
