import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import {
  translateProperty,
  PROPERTY_SOURCE_SELECT,
} from '@/lib/property-translate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

function isMissingTranslationTableError(e: unknown): boolean {
  const err = e as any;
  const msg = String(err?.message || '');
  return err?.code === 'P2021' && msg.includes('PropertyTranslation');
}

/**
 * POST /api/properties/translate-pending
 * 找出所有「缺英文翻譯」、「缺日文翻譯」的物件，依序翻譯。
 * Admin 後台「批次翻譯」按鈕呼叫此端點。
 */
export async function POST() {
  try {
    const me = await getCurrentAdmin();
    if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

    const BATCH_SIZE = 20;

    const properties = await prisma.property.findMany({
      where: { status: 'active' },
      select: {
        id: true,
        ...PROPERTY_SOURCE_SELECT,
        translations: {
          select: { locale: true, sourceHash: true },
        },
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    const TARGETS = ['en', 'ja'] as const;
    const pending = properties.filter((p) =>
      TARGETS.some((loc) => !p.translations.find((t) => t.locale === loc))
    );

    if (pending.length === 0) {
      return NextResponse.json({
        ok: true,
        total: properties.length,
        translated: 0,
        skipped: properties.length,
        results: [],
      });
    }

    const jobs = pending.slice(0, BATCH_SIZE);

    let translated = 0;
    let failed = 0;
    const results: Array<{ id: number; ok: boolean; error?: string }> = [];

    for (const p of jobs) {
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
      processed: jobs.length,
      remaining: Math.max(0, pending.length - jobs.length),
      translated,
      failed,
      results,
    });
  } catch (e: any) {
    if (isMissingTranslationTableError(e)) {
      return NextResponse.json(
        {
          error:
            '資料庫缺少 PropertyTranslation 資料表。請先在 production 執行 Prisma schema 同步（prisma db push / migrate deploy）後再批次翻譯。',
        },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: e?.message || '批次翻譯失敗' }, { status: 500 });
  }
}
