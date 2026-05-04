import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth';
import { loadAiSettings } from '@/lib/ai-extract';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RawModel = {
  id?: string;
  name?: string;
  context_length?: number;
  architecture?: { input_modalities?: string[]; modality?: string };
  pricing?: { prompt?: string; completion?: string };
  top_provider?: { context_length?: number };
};

type ModelInfo = {
  id: string;
  name: string;
  contextLength: number;
  pricePromptPerM: number;   // USD per 1M tokens
  priceCompletionPerM: number;
  supportsVision: boolean;
};

function modelSupportsVision(m: RawModel): boolean {
  const mods = m.architecture?.input_modalities;
  if (Array.isArray(mods)) return mods.includes('image');
  // 退路：modality 字串包含 image
  const modStr = m.architecture?.modality || '';
  return /image/i.test(modStr);
}

function normalize(m: RawModel): ModelInfo | null {
  if (!m.id) return null;
  return {
    id: m.id,
    name: m.name || m.id,
    contextLength: m.context_length || m.top_provider?.context_length || 0,
    pricePromptPerM: m.pricing?.prompt ? Number(m.pricing.prompt) * 1_000_000 : 0,
    priceCompletionPerM: m.pricing?.completion ? Number(m.pricing.completion) * 1_000_000 : 0,
    supportsVision: modelSupportsVision(m),
  };
}

/**
 * POST { apiKey?: string }
 * 用提供的 key（若空則用 DB 已存的）查詢可用模型。回傳只篩選 vision 支援的模型。
 */
export async function POST(req: Request) {
  const me = await getCurrentAdmin();
  if (!me) return NextResponse.json({ error: '未授權' }, { status: 401 });

  let apiKey = '';
  try {
    const body = await req.json().catch(() => ({}));
    apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : '';
  } catch {
    /* ignore */
  }
  if (!apiKey) {
    const saved = await loadAiSettings();
    apiKey = saved.openrouterApiKey;
  }

  const headers: Record<string, string> = {};
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models', { headers, cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `載入模型失敗 (${res.status})`, detail: text.slice(0, 300) },
        { status: 502 },
      );
    }
    const json = await res.json();
    const all: RawModel[] = Array.isArray(json?.data) ? json.data : [];
    // 不在 server 端先濾，回傳完整清單 + supportsVision 旗標；frontend 依用途自行 filter
    const allModels = all
      .map(normalize)
      .filter((m): m is ModelInfo => m !== null)
      .sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json({
      ok: true,
      total: all.length,
      visionCount: allModels.filter((m) => m.supportsVision).length,
      models: allModels,
      authenticated: Boolean(apiKey),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '無法連線' }, { status: 500 });
  }
}
