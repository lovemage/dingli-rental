import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { translateProperty } from '@/lib/property-translate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/** POST /api/properties/[id]/translate — 強制重譯單一物件 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) return NextResponse.json({ error: 'invalid id' }, { status: 400 });

  try {
    const result = await translateProperty(id, { skipUpToDate: false });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '翻譯失敗' }, { status: 500 });
  }
}
