import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadAiSettings } from '@/lib/ai-extract';
import { isAiQuotaExhausted } from '@/lib/ai-usage';
import { recordAiUsage } from '@/lib/ai-usage';
import { getChatLogInquiryId, isValidChatSessionId, saveChatLog } from '@/lib/ai-chat-log';
import { createInquiry, InquiryValidationError } from '@/lib/inquiry';
import { FLOATING_CTA_DEFAULTS, type FloatingCtaContent } from '@/data/floating-cta-defaults';
import { LEGAL_SUMMARY_FOR_AI } from '@/data/legal-content';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_PROPERTIES_IN_CONTEXT = 50;
const MAX_USER_MESSAGES = 20;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

/** 網站語系路徑前綴（網站只有 zh / en / ja，其他對話語言導向英文版） */
function localePrefix(languageCode: string): string {
  if (languageCode === 'zh') return '';
  if (languageCode === 'ja') return '/ja';
  return '/en';
}

/** 需求單頁面路徑（依對話語言） */
function contactPath(languageCode: string): string {
  return `${localePrefix(languageCode)}/contact`;
}

const INQUIRY_BLOCK_RE = /<inquiry>([\s\S]*?)(?:<\/inquiry>|$)/i;

/** 從 AI 回覆拆出需求單標記：回傳給客戶看的文字與解析後的欄位 */
function extractInquiry(reply: string): { text: string; data: Record<string, unknown> | null } {
  const m = reply.match(INQUIRY_BLOCK_RE);
  if (!m) return { text: reply, data: null };
  const text = reply.replace(m[0], '').replace(/\s+$/, '');
  try {
    const raw = m[1].trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
    const data = JSON.parse(raw);
    return { text, data: data && typeof data === 'object' ? data : null };
  } catch {
    return { text, data: null };
  }
}

function str(v: unknown, max = 200): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : typeof v === 'number' ? String(v) : '';
}

/** 依 AI 標記建立（或更新同一段對話既有的）需求單 */
async function upsertInquiryFromChat(
  data: Record<string, unknown>,
  sessionId: string | null,
  languageCode: string,
): Promise<number | null> {
  const payload = {
    name: str(data.name, 50),
    phone: str(data.phone, 30),
    userRole: str(data.role) === 'landlord' ? 'landlord' : 'renter',
    messengerType: str(data.messengerType).toLowerCase(),
    messengerHandle: str(data.messengerId, 80),
    region: str(data.region, 50),
    propertyType: str(data.propertyType, 50),
    budget: str(data.budget, 20),
    message: [`【AI 客服登記・對話語言 ${languageCode.toUpperCase()}】`, str(data.summary, 1800)]
      .filter(Boolean)
      .join('\n'),
  };
  const existingId = sessionId ? await getChatLogInquiryId(sessionId) : null;
  if (existingId) {
    // 同一段對話再次確認（客戶修改資料）→ 更新原需求單，不重複建立
    const budgetDigits = payload.budget.replace(/[^\d.]/g, '');
    await prisma.contactInquiry
      .update({
        where: { id: existingId },
        data: {
          ...(payload.name ? { name: payload.name } : {}),
          ...(payload.phone ? { phone: payload.phone } : {}),
          userRole: payload.userRole,
          ...(payload.messengerHandle
            ? { email: payload.messengerHandle, messengerType: ['line', 'whatsapp', 'wechat'].includes(payload.messengerType) ? payload.messengerType : 'line' }
            : {}),
          ...(payload.region ? { region: payload.region } : {}),
          ...(payload.propertyType ? { propertyType: payload.propertyType } : {}),
          ...(budgetDigits ? { budget: Math.round(Number(budgetDigits)) || null } : {}),
          message: payload.message,
        },
      })
      .catch((e) => console.error('[customer-service] inquiry update failed', e?.message));
    return existingId;
  }
  try {
    const inquiry = await createInquiry(payload, { source: 'ai_chat', chatSessionId: sessionId ?? undefined });
    return inquiry.id;
  } catch (e) {
    if (!(e instanceof InquiryValidationError)) console.error('[customer-service] inquiry create failed', (e as Error).message);
    return null;
  }
}

const SUPPORTED_LANGUAGES: Record<string, string> = {
  zh: '繁體中文 (Traditional Chinese, zh-TW)',
  en: 'English',
  ja: '日本語 (Japanese)',
  vi: 'Tiếng Việt (Vietnamese)',
  th: 'ภาษาไทย (Thai)',
  id: 'Bahasa Indonesia',
};

async function loadLineUrl(): Promise<string> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'floating_cta' } });
    const data = (row?.data as Partial<FloatingCtaContent>) || {};
    return (data.linkUrl || FLOATING_CTA_DEFAULTS.linkUrl).trim();
  } catch {
    return FLOATING_CTA_DEFAULTS.linkUrl;
  }
}

/** 把資料庫物件壓成 AI prompt 用的精簡格式 */
function summarizeProperty(p: any, baseUrl: string): string {
  const displayCode = p.code || `未編號-${p.id}`;
  const parts: string[] = [
    `[物件編號 ${displayCode}]`,
    p.region,
    p.district,
  ];
  if (p.typeMid) parts.push(p.typeMid);
  if (p.buildingType) parts.push(p.buildingType);
  parts.push(`${p.rooms || 0}房${p.livingRooms || 0}廳${p.bathrooms || 0}衛`);
  if (p.usableArea) parts.push(`${p.usableArea}坪`);
  if (p.rent) parts.push(`NT$${p.rent.toLocaleString()}/月`);
  if (p.hasElevator) parts.push('有電梯');
  if (p.petsAllowed) parts.push('可寵物');
  const tags = Array.isArray(p.featureTags) ? (p.featureTags as string[]).slice(0, 4).join('/') : '';
  if (tags) parts.push(tags);
  parts.push(`— ${p.title}`);
  parts.push(`詳情連結：${baseUrl}/properties/${p.id}`);
  return parts.filter(Boolean).join(' · ');
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const incoming: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const languageCode: string =
      typeof body?.language === 'string' && SUPPORTED_LANGUAGES[body.language] ? body.language : 'zh';
    const languageName = SUPPORTED_LANGUAGES[languageCode];
    const sessionId = isValidChatSessionId(body?.sessionId) ? body.sessionId : null;

    // 過濾與限長
    const cleanedMessages = incoming
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))
      .slice(-MAX_USER_MESSAGES);

    if (!cleanedMessages.length || cleanedMessages[cleanedMessages.length - 1].role !== 'user') {
      return NextResponse.json({ error: '需提供至少一則使用者訊息' }, { status: 400 });
    }

    const settings = await loadAiSettings();
    if (!settings.openrouterApiKey) {
      return NextResponse.json({ error: 'AI 客服尚未設定（缺少 API Key）' }, { status: 503 });
    }
    if (await isAiQuotaExhausted()) {
      // 額度用盡：不呼叫 AI，引導訪客改用 LINE（仍保留訪客訊息，業務可在後台看到）
      if (sessionId) {
        await saveChatLog({ sessionId, language: languageCode, messages: cleanedMessages });
      }
      const unavailable: Record<string, string> = {
        zh: '線上客服目前暫停服務，請點選「LINE 諮詢」與我們聯繫。',
        ja: 'オンライン対応は現在休止中です。LINEからお問い合わせください。',
      };
      return NextResponse.json(
        {
          error: unavailable[languageCode] ?? 'Our online assistant is currently unavailable. Please contact us via LINE.',
          lineUrl: await loadLineUrl(),
        },
        { status: 503 },
      );
    }
    const model = settings.customerServiceModel || 'google/gemini-2.5-flash';

    // 物件清單 — 雙重過濾：上架中 (status=active) 且 出租狀態為「出租中」(listingStatus=active)
    // 已出租 / 售出 / 結束 / 下架 / 審核中 等狀態都不會出現在 AI 的可推薦清單中
    const properties = await prisma.property.findMany({
      where: { status: 'active', listingStatus: 'active' },
      select: {
        id: true,
        code: true,
        region: true,
        district: true,
        typeMid: true,
        buildingType: true,
        rooms: true,
        livingRooms: true,
        bathrooms: true,
        usableArea: true,
        rent: true,
        hasElevator: true,
        petsAllowed: true,
        featureTags: true,
        title: true,
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: MAX_PROPERTIES_IN_CONTEXT,
    }).catch(() => [] as any[]);

    const lineUrl = await loadLineUrl();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com').replace(/\/$/, '');

    const propertyCatalog = properties.length
      ? properties.map((p) => summarizeProperty(p, `${siteUrl}${localePrefix(languageCode)}`)).join('\n')
      : '（目前資料庫沒有任何「出租中」狀態的物件）';

    // 把 LEGAL_SUMMARY_FOR_AI 中的 ${siteUrl} 模板替換成實際 URL
    const legalSummary = LEGAL_SUMMARY_FOR_AI.replace(/\$\{siteUrl\}/g, siteUrl);
    const contactUrl = `${siteUrl}${contactPath(languageCode)}`;

    const systemPrompt = `${settings.customerServiceSystemPrompt}

${legalSummary}

# 目前「出租中」物件清單（共 ${properties.length} 筆，依精選與最新排序）
**重要：下方清單已預先過濾，僅包含「出租中」狀態（listingStatus=active）的物件。任何不在此清單上的物件都不可推薦。**

${propertyCatalog}

# 推薦規則（嚴格遵守）
1. **只能推薦上方清單中列出的物件** — 清單中每一筆都已確認為「出租中」可承租狀態
2. **絕對不可推薦清單外的物件** — 包括但不限於：已出租 / 售出 / 結束 / 下架 / 審核中的物件，或你想像中可能存在但未列出的物件
3. **絕對不可虛構物件** — 不要編造物件編號、地址、租金、坪數、房型等任何欄位
4. 若清單為空（沒有任何出租中物件），誠實告知用戶「目前暫無符合需求的可租物件，建議透過 LINE 聯繫業務專員了解最新進件」
5. 推薦時請註明物件編號、地區、房型、租金，方便用戶辨識與複製
6. **每推薦一個物件，都必須在該物件說明的最後另起一行附上清單中的「詳情連結」完整網址**（直接貼純網址，不要用 markdown 連結語法、不要加其他文字；系統會自動轉成按鈕）。不要自行組 URL
7. 用戶有預約看房 / 議價 / 詳細諮詢需求時，引導他們透過 LINE 直接聯繫業務專員，並直接貼出純網址：${lineUrl}
8. 用戶詢問完整服務條款內容請提供 ${siteUrl}/terms
9. 用戶詢問完整隱私權政策內容請提供 ${siteUrl}/privacy
10. 一次最多推薦 3 個物件，避免訊息過長
11. 訊息控制在 5 句話以內，需要時用條列項目
12. 物件的設備、規定、能否議價等清單上沒有的細節，不要猜測，請客戶留下需求單或透過 LINE 詢問業務專員

# 需求單（重要任務）
除了回答問題，你要引導客戶留下需求單，讓業務專員主動聯繫。
1. 客戶表達找房、預約看房、委託出租、議價或想了解更多時，或對話進行 2～3 輪後，主動邀請客戶留下需求單，並提供兩種方式：
   a. 填寫網站需求表單：${contactUrl}
   b. 直接在對話中提供資料，由你代為登記
2. 客戶選擇在對話中登記時，一次只問 1～2 項，依序收集：
   - 姓名（必填）
   - 電話（必填；台灣手機或含國碼的國際電話皆可）
   - 身份：承租方（找房）或出租方（委託出租）
   - 通訊軟體與 ID（LINE / WhatsApp / WeChat，選填）
   - 希望地區、物件類型、每月預算（選填）
   - 其他需求（選填）
   對話中已提過的資訊不要重複詢問。
3. 必填資料齊全後，條列複述所有資料，請客戶確認。
4. 客戶明確確認後（例如「對」「確認」「OK」「送出」），回覆「已為您登記，業務專員會盡快與您聯繫」，並在回覆最後另起一行附上以下標記（系統會自動移除，客戶看不到）：
<inquiry>{"name":"姓名","phone":"電話","role":"renter 或 landlord","messengerType":"line、whatsapp、wechat 或空字串","messengerId":"ID 或空字串","region":"地區或空字串","propertyType":"物件類型或空字串","budget":每月預算數字或 null,"summary":"用繁體中文摘要客戶需求，包含推薦過、客戶有興趣的物件編號"}</inquiry>
5. 標記只能在客戶確認後輸出；客戶之後修改資料，再輸出一次更新後的完整標記。絕對不要在回覆內容中提到、解釋或預覽這個標記。
6. 客戶不想留資料時尊重客戶，改提供 LINE 諮詢連結。

# 語言要求（最高優先）
請使用 **${languageName}** 回應使用者。
- 物件編號、地址、社區名等專有名詞可保留繁體中文原文
- 其他說明文字、推薦理由、引導語句等一律用 ${languageName}
- 若使用者切換語言（用其他語言提問），跟隨使用者最新訊息的語言回應

# 對話流程建議
1. 先問清楚用戶需求（地區、房型、預算、特殊需求如電梯/寵物）
2. 從清單中挑出符合的物件推薦
3. 邀請用戶點 LINE 跟業務專員預約看房`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...cleanedMessages,
    ];

    const upstreamRes = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': siteUrl,
        'X-Title': 'Dingli Rental - Customer Service',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.6,
      }),
    });

    if (!upstreamRes.ok) {
      const errText = await upstreamRes.text().catch(() => '');
      console.error('[customer-service] upstream', upstreamRes.status, errText.slice(0, 300));
      return NextResponse.json({ error: '客服服務暫時無法回應，請稍後再試' }, { status: 502 });
    }

    const json = await upstreamRes.json();
    const rawReply: string =
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.message?.reasoning ??
      '';
    if (!rawReply) {
      return NextResponse.json({ error: '客服無回應' }, { status: 502 });
    }

    void recordAiUsage('chat', { scope: 'chat', label: `客服（${languageCode.toUpperCase()}）` });

    const { text: reply, data: inquiryData } = extractInquiry(rawReply);
    const inquiryId = inquiryData ? await upsertInquiryFromChat(inquiryData, sessionId, languageCode) : null;

    if (sessionId) {
      await saveChatLog({
        sessionId,
        language: languageCode,
        messages: [...cleanedMessages, { role: 'assistant', content: reply }],
        inquiryId,
      });
    }

    return NextResponse.json({ reply, lineUrl, inquirySubmitted: Boolean(inquiryId) });
  } catch (e: any) {
    console.error('[customer-service] failed', e?.message);
    return NextResponse.json({ error: '客服服務暫時無法回應' }, { status: 500 });
  }
}
