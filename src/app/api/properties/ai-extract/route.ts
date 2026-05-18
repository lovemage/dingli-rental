import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { extractFromPhotos } from '@/lib/ai-extract';

const OCR_MAX_PHOTOS = 3;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // vision 推論可能 5-30s，給寬鬆 timeout

export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  try {
    const body = await req.json();
    const imageUrls: string[] = Array.isArray(body?.imageUrls)
      ? body.imageUrls.filter((x: unknown): x is string => typeof x === 'string' && x.length > 0)
      : [];
    if (!imageUrls.length) {
      return NextResponse.json({ error: '請至少提供一張照片網址' }, { status: 400 });
    }
    if (imageUrls.length > OCR_MAX_PHOTOS) {
      // 控制成本與 timeout
      return NextResponse.json({ error: `AI 辨識最多支援 ${OCR_MAX_PHOTOS} 張圖片，請挑選代表性的截圖或傳單` }, { status: 400 });
    }

    const fields = await extractFromPhotos(imageUrls);
    return NextResponse.json({ ok: true, fields, photoCount: imageUrls.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'AI 辨識失敗' }, { status: 500 });
  }
}
