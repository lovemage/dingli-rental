import { NextResponse } from 'next/server';
import { createInquiry, InquiryValidationError, type ContactPayload } from '@/lib/inquiry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body: ContactPayload = await req.json().catch(() => ({} as any));
    await createInquiry(body, { source: 'form' });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e instanceof InquiryValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    console.error('[/api/contact] failed', e?.message);
    return NextResponse.json({ error: e?.message || '送出失敗' }, { status: 500 });
  }
}
