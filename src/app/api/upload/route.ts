import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { saveImageAsWebp, saveVideoAsMp4 } from '@/lib/storage';

export const runtime = 'nodejs';

const MAX_UPLOAD_FILES = 20;
const MAX_TOTAL_UPLOAD_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;

function formatMb(bytes: number): string {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const url = new URL(req.url);
  const subdir = url.searchParams.get('subdir') || 'properties';

  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  if (!files.length) return NextResponse.json({ error: '沒有檔案' }, { status: 400 });
  if (files.length > MAX_UPLOAD_FILES) {
    return NextResponse.json({ error: `一次最多上傳 ${MAX_UPLOAD_FILES} 個檔案` }, { status: 413 });
  }

  const totalBytes = files.reduce((sum, file) => sum + (file instanceof File ? file.size : 0), 0);
  if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `單次上傳總大小不可超過 ${formatMb(MAX_TOTAL_UPLOAD_BYTES)}` },
      { status: 413 },
    );
  }

  const results: {
    url: string;
    sizeBytes: number;
    width: number;
    height: number;
    name: string;
    mediaType: 'image' | 'video';
  }[] = [];
  for (const file of files) {
    if (!(file instanceof File)) continue;
    try {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isImage && !isVideo) {
        throw new Error('只支援圖片或影片檔案');
      }
      const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > maxBytes) {
        throw new Error(`${isVideo ? '影片' : '圖片'}不可超過 ${formatMb(maxBytes)}`);
      }

      const buf = Buffer.from(await file.arrayBuffer());
      if (buf.length === 0) continue;
      if (isVideo) {
        const r = await saveVideoAsMp4(buf, { subdir });
        results.push({ ...r, name: file.name, mediaType: 'video' });
      } else {
        const r = await saveImageAsWebp(buf, { subdir, maxWidth: 1920, quality: 82 });
        results.push({ ...r, name: file.name, mediaType: 'image' });
      }
    } catch (e: any) {
      // 忽略單檔錯誤，繼續處理其他
      console.error('upload failed', file.name, e?.message);
    }
  }

  return NextResponse.json({ files: results });
}
