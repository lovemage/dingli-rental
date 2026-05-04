import { NextResponse } from 'next/server';
import { sendEmail, escapeHtml } from '@/lib/email';

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
    const budget = (body.budget || '').trim();
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

    const subject = `【鼎立租售】客戶詢問：${name}（${phone}）`;

    const rows: Array<[string, string]> = [
      ['姓名', name],
      ['電話', phone],
      ['Email', email || '—'],
      ['希望地區', region || '不限'],
      ['物件類型', propertyType || '不限'],
      ['預算', budget ? `NT$ ${budget} / 月` : '—'],
    ];

    const html = `
<!DOCTYPE html>
<html lang="zh-TW">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#faf9f7;font-family:'Noto Sans TC',-apple-system,sans-serif;color:#1a1a1a;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <div style="background:#fff;border:1px solid #e5e1d6;border-radius:14px;overflow:hidden;">
      <div style="background:#5C7B6F;color:#fff;padding:20px 28px;">
        <p style="margin:0;font-size:12px;opacity:.85;letter-spacing:.1em;">DINGLI RENTAL · 客戶詢問</p>
        <h1 style="margin:6px 0 0;font-size:20px;font-weight:900;">客戶詢問來信</h1>
      </div>
      <div style="padding:24px 28px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          ${rows.map(([k, v]) => `
            <tr>
              <td style="padding:8px 0;width:90px;color:#737373;vertical-align:top;">${escapeHtml(k)}</td>
              <td style="padding:8px 0;color:#1a1a1a;font-weight:500;">${escapeHtml(v)}</td>
            </tr>
          `).join('')}
        </table>
        ${message ? `
          <div style="margin-top:20px;padding-top:18px;border-top:1px solid #e5e1d6;">
            <p style="margin:0 0 8px;font-size:13px;color:#737373;">需求描述</p>
            <div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#1a1a1a;background:#faf9f7;padding:14px 16px;border-radius:10px;">${escapeHtml(message)}</div>
          </div>
        ` : ''}
        <p style="margin:20px 0 0;font-size:12px;color:#a6a6a6;">
          送出時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })}
        </p>
      </div>
    </div>
  </div>
</body>
</html>`.trim();

    await sendEmail({
      subject,
      html,
      replyTo: email || undefined,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[/api/contact] failed', e?.message);
    return NextResponse.json({ error: e?.message || '送出失敗' }, { status: 500 });
  }
}
