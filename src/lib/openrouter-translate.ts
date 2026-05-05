import { loadAiSettings } from '@/lib/ai-extract';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

const LOCALE_NAME: Record<string, string> = {
  en: 'English (US)',
  ja: '日本語 (Japanese)',
  vi: 'Tiếng Việt (Vietnamese)',
  th: 'ภาษาไทย (Thai)',
  id: 'Bahasa Indonesia',
};

function parseJson(text: string): unknown {
  if (!text) return null;
  const stripped = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const m = stripped.match(/[\{\[][\s\S]*[\}\]]/);
    if (m) {
      try { return JSON.parse(m[0]); } catch { /* fallthrough */ }
    }
    return null;
  }
}

export type TranslateOptions = {
  /** 對於專有名詞 (社區名、人名) 是否保留中文 */
  preserveChineseProperNouns?: boolean;
  /** 額外指示 */
  extraInstructions?: string;
};

/**
 * 把任意 JSON 物件以「結構保留」的方式翻譯成目標語言。
 * - 只翻譯字串值；保留所有 keys、null、boolean、number。
 * - 對地址會轉成羅馬拼音/標準格式。
 */
export async function translateJsonObject(
  data: unknown,
  targetLocale: string,
  opts: TranslateOptions = {}
): Promise<unknown> {
  if (!data || targetLocale === 'zh') return data;
  const targetName = LOCALE_NAME[targetLocale] ?? targetLocale;
  const settings = await loadAiSettings();
  if (!settings.openrouterApiKey) {
    throw new Error('OpenRouter API key 未設定，無法執行翻譯');
  }
  const model = settings.customerServiceModel || settings.model || 'google/gemini-2.5-flash';

  const systemPrompt = `You are a professional translator for a Taiwanese real estate rental website (鼎立租售管理 / Dingli Rental).

Translate the JSON payload's STRING VALUES from Traditional Chinese (zh-TW) to ${targetName}.

CRITICAL RULES:
1. **Preserve the JSON structure exactly.** All keys must remain unchanged.
2. Only translate string values; never invent new keys, never remove keys.
3. Numbers, booleans, null values pass through unchanged.
4. URLs (starting with http://, https://, /, mailto:, tel:) pass through unchanged.
5. Email addresses pass through unchanged.
6. Phone numbers pass through unchanged.
7. Hex colors / CSS values pass through unchanged.
8. Material Symbols icon names (lowercase snake_case English already) pass through unchanged.
9. **Addresses**: Convert Taiwan addresses to standard romanization in ${targetName}. Example: "台北市中山區民權東路三段100號" → "No. 100, Sec. 3, Minquan E. Rd., Zhongshan Dist., Taipei City". For Japanese, use the same format with Japanese particles where natural; or keep "台北市" / "新北市" as 台北市 / 新北市 in Japanese (these are commonly used in Japanese as-is). For Chinese county/city → use standard romanized form in English; in Japanese keep the kanji names as-is since Japanese readers understand them.
10. **Region names**: For English: "台北市"→"Taipei City", "新北市"→"New Taipei City", "基隆市"→"Keelung City", "桃園市"→"Taoyuan City", "新竹市"→"Hsinchu City", "新竹縣"→"Hsinchu County". For Japanese: keep as-is (台北市 etc.).
11. **District names**: For English use Hanyu Pinyin + " District" (e.g., 中山區→"Zhongshan District"). For Japanese: keep kanji.
12. **Property type / building type / equipment / furniture / tenant types**: Translate naturally.
   - 整層住家 (en: "Whole-Floor Residence"; ja: "一棟住宅")
   - 獨立套房 (en: "Private Studio"; ja: "独立スタジオ")
   - 分租套房 (en: "Shared Suite"; ja: "シェアスイート")
   - 雅房 (en: "Single Room"; ja: "個室")
   - 公寓 (en: "Apartment"; ja: "アパート")
   - 電梯大樓 (en: "Elevator Building"; ja: "エレベーターマンション")
   - 透天厝 (en: "Townhouse"; ja: "戸建て")
   - 別墅 (en: "Villa"; ja: "別荘")
   - 出租中 (en: "Available"; ja: "募集中")
   - 已出租 (en: "Rented"; ja: "成約済")
   - 售出 (en: "Sold"; ja: "売却済")
   - 結束 (en: "Closed"; ja: "終了")
13. **Currency**: NT$ stays as NT$. Numbers stay numeric.
14. **Tone**: Friendly, professional real-estate marketing voice.
${opts.extraInstructions ? `\n15. ${opts.extraInstructions}` : ''}

Return ONLY the translated JSON, no markdown fences, no commentary.`;

  const userMessage = `Translate this JSON to ${targetName}:\n\n${JSON.stringify(data, null, 2)}`;

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com',
      'X-Title': 'Dingli Rental - Content Translation',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`OpenRouter translate failed: ${res.status} ${errText.slice(0, 200)}`);
  }

  const json = await res.json();
  const text: string =
    json?.choices?.[0]?.message?.content ??
    json?.choices?.[0]?.message?.reasoning ??
    '';
  const parsed = parseJson(text);
  if (parsed == null) {
    throw new Error('OpenRouter translate: 回應無法解析為 JSON');
  }
  return parsed;
}

/**
 * 翻譯一個字串陣列（feature tags 等）。
 * 失敗時回傳原陣列。
 */
export async function translateStringArray(
  arr: string[],
  targetLocale: string
): Promise<string[]> {
  if (!arr || !arr.length) return [];
  if (targetLocale === 'zh') return arr;
  try {
    const out = await translateJsonObject({ items: arr }, targetLocale);
    if (out && typeof out === 'object' && Array.isArray((out as any).items)) {
      return ((out as any).items as unknown[]).filter(
        (x): x is string => typeof x === 'string'
      );
    }
  } catch (e) {
    console.warn('[translateStringArray] failed', (e as Error).message);
  }
  return arr;
}
