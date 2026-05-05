import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { invalidateCmsTranslations } from '@/lib/cms-translate';

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

  // 內容變更後清掉該 section 的 EN/JA 翻譯 cache，下次訪客觸發重譯
  invalidateCmsTranslations(section).catch(() => {});
  if (section === 'about') {
    invalidateCmsTranslations('home_testimonials').catch(() => {});
  }

  return NextResponse.json(saved);
}
