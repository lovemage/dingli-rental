import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { loadAiSettings, saveAiSettings } from '@/lib/ai-extract';
import { maskApiKey } from '@/data/ai-extract-defaults';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  const s = await loadAiSettings();
  return NextResponse.json({
    model: s.model,
    systemPrompt: s.systemPrompt,
    userPromptTemplate: s.userPromptTemplate,
    apiKeyMasked: maskApiKey(s.openrouterApiKey),
    apiKeyConfigured: Boolean(s.openrouterApiKey),
  });
}

export async function PUT(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });
  try {
    const body = await req.json();
    const saved = await saveAiSettings({
      openrouterApiKey: typeof body.openrouterApiKey === 'string' ? body.openrouterApiKey : '',
      model: typeof body.model === 'string' ? body.model : undefined,
      systemPrompt: typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined,
      userPromptTemplate: typeof body.userPromptTemplate === 'string' ? body.userPromptTemplate : undefined,
    });
    return NextResponse.json({
      ok: true,
      apiKeyMasked: maskApiKey(saved.openrouterApiKey),
      apiKeyConfigured: Boolean(saved.openrouterApiKey),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '儲存失敗' }, { status: 500 });
  }
}
