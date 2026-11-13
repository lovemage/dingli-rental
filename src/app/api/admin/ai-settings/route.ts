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
    // OCR
    ocrEnabled: Boolean(s.ocrEnabled),
    model: s.model,
    systemPrompt: s.systemPrompt,
    userPromptTemplate: s.userPromptTemplate,
    // Translation
    translationModel: s.translationModel,
    // Customer Service
    customerServiceModel: s.customerServiceModel,
    customerServiceSystemPrompt: s.customerServiceSystemPrompt,
    // API key (masked)
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
      ocrEnabled: typeof body.ocrEnabled === 'boolean' ? body.ocrEnabled : undefined,
      model: typeof body.model === 'string' ? body.model : undefined,
      systemPrompt: typeof body.systemPrompt === 'string' ? body.systemPrompt : undefined,
      userPromptTemplate: typeof body.userPromptTemplate === 'string' ? body.userPromptTemplate : undefined,
      translationModel:
        typeof body.translationModel === 'string' && body.translationModel.trim() ? body.translationModel.trim() : undefined,
      customerServiceModel: typeof body.customerServiceModel === 'string' ? body.customerServiceModel : undefined,
      customerServiceSystemPrompt:
        typeof body.customerServiceSystemPrompt === 'string' ? body.customerServiceSystemPrompt : undefined,
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
