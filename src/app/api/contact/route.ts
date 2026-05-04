import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewInquiry } from '@/lib/notifications';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type ContactPayload = {
  name?: string;
  phone?: string;
  email?: string;
  region?: string;
  propertyType?: string;
  budget?: string;
  message?: string;
};

export async function POST(req: Request) {
  try {
    const body: ContactPayload = await req.json().catch(() => ({} as any));
    const name = (body.name || '').trim();
    const phone = (body.phone || '').trim();
    const email = (body.email || '').trim();
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email 格式不正確' }, { status: 400 });
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: '需求描述過長（請於 2000 字內）' }, { status: 400 });
    }

    const budgetNum = budgetStr ? Math.max(0, Math.round(Number(budgetStr))) : null;

    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        phone,
        email: email || null,
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
