import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { saveImageAsWebp } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const url = new URL(req.url);
  const subdir = url.searchParams.get('subdir') || 'properties';

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  if (!files.length) return NextResponse.json({ error: '沒有檔案' }, { status: 400 });

  const results: { url: string; sizeBytes: number; width: number; height: number; name: string }[] = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    const buf = Buffer.from(await file.arrayBuffer());
    if (buf.length === 0) continue;
    try {
      const r = await saveImageAsWebp(buf, { subdir, maxWidth: 1920, quality: 82 });
      results.push({ ...r, name: file.name });
    } catch (e: any) {
      // 忽略單檔錯誤，繼續處理其他
      console.error('upload failed', file.name, e?.message);
    }
  }

  return NextResponse.json({ files: results });
}
