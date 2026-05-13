import { NextResponse, after } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { warmCmsTranslations } from '@/lib/cms-translate';

export const dynamic = 'force-dynamic';

// 含敏感資訊的 section（如 API key / token），禁止透過此 public 端點存取
const PROTECTED_SECTIONS = new Set(['ai_settings', 'notification_settings']);

// GET ?section=services|careers|contact|about
export async function GET(req: Request) {
  const url = new URL(req.url);
  const section = url.searchParams.get('section');
  if (!section) return NextResponse.json({ error: 'missing section' }, { status: 400 });
  if (PROTECTED_SECTIONS.has(section)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const item = await prisma.siteContent.findUnique({ where: { section } });
  return NextResponse.json(item || { section, data: null });
}

// PUT { section, data }
export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const { section, data } = await req.json();
  if (!section) return NextResponse.json({ error: 'missing section' }, { status: 400 });
  if (PROTECTED_SECTIONS.has(section)) {
    return NextResponse.json({ error: '此 section 請改用專屬 API 端點' }, { status: 400 });
  }
  const saved = await prisma.siteContent.upsert({
    where: { section },
    create: { section, data },
    update: { data },
  });

  // 內容變更後立即觸發 EN/JA 翻譯並寫入 cache，不阻塞回應。
  // 使用 Next.js 官方 `after()` 而非裸 `void`：
  // - 自託管 Node：行為等同 fire-and-forget 但 runtime 保證 promise 不被 GC。
  // - Vercel / 其他 serverless：runtime 會延長 function 生命直到 callback 結束，避免回應後被 kill。
  // 訪客在 warm 完成前看到的 EN/JA：translateCmsSection 會回傳舊翻譯（若 cache 存在）或中文 fallback，
  // 並且自己也會在 cache miss / hash mismatch 時補觸發背景刷新，提供 retry 路徑。
  //
  // 註：home_testimonials cache 自 commit 3671fb1 起已不再被讀寫（testimonials 改用原文），
  // 因此不需要做任何衍生 section 的 invalidate / warm。
  after(() => warmCmsTranslations(section, data));

  return NextResponse.json(saved);
}
