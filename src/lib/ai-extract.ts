import { prisma } from '@/lib/prisma';
import {
  AI_SETTINGS_DEFAULTS,
  type AiExtractedFields,
  type AiSettings,
} from '@/data/ai-extract-defaults';
import {
  EQUIPMENT_OPTIONS,
  FURNITURE_OPTIONS,
  BUILDING_TYPES,
  PROPERTY_TYPES,
  DIRECTION_OPTIONS,
} from '@/data/taiwan-addresses';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

/** 從 DB 載入 AI 設定，缺值用預設；apiKey fallback 到 env */
export async function loadAiSettings(): Promise<AiSettings> {
  let dbSettings: Partial<AiSettings> = {};
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'ai_settings' } });
    if (row?.data && typeof row.data === 'object') {
      dbSettings = row.data as Partial<AiSettings>;
    }
  } catch {
    // ignore
  }
  return {
    ...AI_SETTINGS_DEFAULTS,
    ...dbSettings,
    openrouterApiKey:
      (dbSettings.openrouterApiKey && dbSettings.openrouterApiKey.trim()) ||
      process.env.OPENROUTER_API_KEY ||
      '',
  };
}

/** 寫回 DB；apiKey 為空字串時保留原值 */
export async function saveAiSettings(patch: Partial<AiSettings>): Promise<AiSettings> {
  const current = await loadAiSettings();
  const next: AiSettings = {
    model: patch.model ?? current.model,
    systemPrompt: patch.systemPrompt ?? current.systemPrompt,
    userPromptTemplate: patch.userPromptTemplate ?? current.userPromptTemplate,
    openrouterApiKey:
      patch.openrouterApiKey && patch.openrouterApiKey.trim()
        ? patch.openrouterApiKey.trim()
        : current.openrouterApiKey,
  };
  await prisma.siteContent.upsert({
    where: { section: 'ai_settings' },
    create: { section: 'ai_settings', data: next as any },
    update: { data: next as any },
  });
  return next;
}

/** 把 prompt 範本中的 {photoCount}/{equipment}/{furniture}/... 替換 */
function renderPrompt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? String(vars[key]) : m,
  );
}

/** 從 LLM 文字回應抽出 JSON（容錯處理 ```json fences） */
function parseJsonResponse(text: string): Record<string, unknown> {
  if (!text) return {};
  const stripped = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(stripped);
  } catch {
    // 嘗試找第一個 {…} 區塊
    const m = stripped.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* fallthrough */ }
    }
    throw new Error('AI 回應不是合法 JSON：' + text.slice(0, 300));
  }
}

/** 過濾 / 驗證萃取結果，去除不在白名單的選項，避免污染表單 */
function sanitize(raw: Record<string, unknown>): AiExtractedFields {
  const out: AiExtractedFields = {};
  const intField = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.round(v)) : undefined);
  const boolField = (v: unknown) => (typeof v === 'boolean' ? v : undefined);
  const strField = (v: unknown, max = 500) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : undefined);
  const enumField = <T extends readonly string[]>(v: unknown, options: T) =>
    typeof v === 'string' && (options as readonly string[]).includes(v) ? (v as T[number]) : undefined;
  const arrField = <T extends readonly string[]>(v: unknown, options: T) =>
    Array.isArray(v) ? Array.from(new Set(v.filter((x): x is string => typeof x === 'string' && (options as readonly string[]).includes(x)))) : undefined;
  const tagArr = (v: unknown) =>
    Array.isArray(v) ? Array.from(new Set(v
      .filter((x): x is string => typeof x === 'string')
      .map((x) => x.trim())
      .filter((x) => x.length >= 2 && x.length <= 12)
    )) : undefined;

  const r = (k: keyof AiExtractedFields, v: unknown) => { if (v !== undefined) (out as any)[k] = v; };

  // ALLOWED
  r('rooms',           intField(raw.rooms));
  r('livingRooms',     intField(raw.livingRooms));
  r('bathrooms',       intField(raw.bathrooms));
  r('balconies',       intField(raw.balconies));
  r('openLayout',      boolField(raw.openLayout));
  r('hasElevator',     boolField(raw.hasElevator));
  r('buildingType',    enumField(raw.buildingType, BUILDING_TYPES));
  r('typeMid',         enumField(raw.typeMid, PROPERTY_TYPES));
  r('equipment',       arrField(raw.equipment, EQUIPMENT_OPTIONS));
  r('furniture',       arrField(raw.furniture, FURNITURE_OPTIONS));
  r('featureTags',     tagArr(raw.featureTags));
  r('title',           strField(raw.title, 30));
  r('description',     strField(raw.description, 2500));
  // SUGGESTABLE
  r('direction',       enumField(raw.direction, DIRECTION_OPTIONS));
  r('cookingAllowed',  boolField(raw.cookingAllowed));
  r('noManagementFee', boolField(raw.noManagementFee));

  return out;
}

/** 主入口：吃 image URL 陣列，回傳 sanitize 過的欄位 */
export async function extractFromPhotos(imageUrls: string[]): Promise<AiExtractedFields> {
  if (!imageUrls.length) throw new Error('至少需要一張照片');
  const settings = await loadAiSettings();
  if (!settings.openrouterApiKey) {
    throw new Error('尚未設定 OpenRouter API key — 請至「後台 → AI 設定」填入');
  }

  const userPrompt = renderPrompt(settings.userPromptTemplate, {
    photoCount: imageUrls.length,
    equipment: EQUIPMENT_OPTIONS.join(', '),
    furniture: FURNITURE_OPTIONS.join(', '),
    buildingTypes: BUILDING_TYPES.join(' | '),
    propertyTypes: PROPERTY_TYPES.join(' | '),
  });

  const messages = [
    { role: 'system', content: settings.systemPrompt },
    {
      role: 'user',
      content: [
        { type: 'text', text: userPrompt },
        ...imageUrls.map((url) => ({ type: 'image_url', image_url: { url } })),
      ],
    },
  ];

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com',
      'X-Title': '鼎立租售管理 - AI 物件辨識',
    },
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 300)}`);
  }
  const json = await res.json();
  const text: string =
    json?.choices?.[0]?.message?.content ??
    json?.choices?.[0]?.message?.reasoning ??
    '';
  if (!text) throw new Error('AI 沒有回傳內容');

  const parsed = parseJsonResponse(text);
  return sanitize(parsed);
}
