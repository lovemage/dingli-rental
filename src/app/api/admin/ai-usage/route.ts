import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { loadAiUsageMeter, saveAiUsageMeter } from '@/lib/ai-usage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const meter = await loadAiUsageMeter();
  return NextResponse.json(meter);
}

export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const body = await req.json();
    const patch: { totalUsd?: number; currentUsd?: number } = {};
    if (typeof body.totalUsd === 'number' && body.totalUsd > 0) {
      patch.totalUsd = body.totalUsd;
    }
    if (typeof body.currentUsd === 'number' && body.currentUsd >= 0) {
      patch.currentUsd = body.currentUsd;
    }
    const meter = await saveAiUsageMeter(patch);
    return NextResponse.json(meter);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '儲存失敗' }, { status: 500 });
  }
}
