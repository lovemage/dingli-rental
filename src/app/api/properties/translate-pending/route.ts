import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { translateProperty, computePropertySourceHash } from '@/lib/property-translate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * POST /api/properties/translate-pending
 * 找出所有「缺英文翻譯」、「缺日文翻譯」或「翻譯 sourceHash 過期」的物件，依序翻譯。
 * Admin 後台「批次翻譯」按鈕呼叫此端點。
 */
export async function POST() {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const properties = await prisma.property.findMany({
    where: { status: 'active' },
    select: {
      id: true,
      title: true,
      description: true,
      featureTags: true,
      region: true,
      district: true,
      street: true,
      community: true,
      translations: {
        select: { locale: true, sourceHash: true },
      },
    },
    orderBy: [{ updatedAt: 'desc' }],
  });

  const TARGETS = ['en', 'ja'] as const;
  const pending = properties.filter((p) => {
    const hash = computePropertySourceHash(p as any);
    return TARGETS.some((loc) => {
      const tr = p.translations.find((t) => t.locale === loc);
      return !tr || tr.sourceHash !== hash;
    });
  });

  if (pending.length === 0) {
    return NextResponse.json({
      ok: true,
      total: properties.length,
      translated: 0,
      skipped: properties.length,
      results: [],
    });
  }

  let translated = 0;
  let failed = 0;
  const results: Array<{ id: number; ok: boolean; error?: string }> = [];

  for (const p of pending) {
    const r = await translateProperty(p.id, { skipUpToDate: true });
    if (r.translated.length > 0) translated++;
    if (Object.keys(r.errors).length > 0) {
      failed++;
      results.push({ id: p.id, ok: false, error: Object.values(r.errors).join('; ') });
    } else {
      results.push({ id: p.id, ok: true });
    }
  }

  return NextResponse.json({
    ok: failed === 0,
    total: properties.length,
    pending: pending.length,
    translated,
    failed,
    results,
  });
}
