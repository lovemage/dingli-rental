import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loadAiSettings } from '@/lib/ai-extract';
import { FLOATING_CTA_DEFAULTS, type FloatingCtaContent } from '@/data/floating-cta-defaults';
import { LEGAL_SUMMARY_FOR_AI } from '@/data/legal-content';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_PROPERTIES_IN_CONTEXT = 50;
const MAX_USER_MESSAGES = 20;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

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
function summarizeProperty(p: any): string {
  const parts: string[] = [
    `[ID ${p.id}]`,
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
  return parts.filter(Boolean).join(' · ');
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const incoming: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];

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
    const model = settings.customerServiceModel || 'google/gemini-2.5-flash';

    // 物件清單 — 雙重過濾：上架中 (status=active) 且 出租狀態為「出租中」(listingStatus=active)
    // 已出租 / 售出 / 結束 / 下架 / 審核中 等狀態都不會出現在 AI 的可推薦清單中
    const properties = await prisma.property.findMany({
      where: { status: 'active', listingStatus: 'active' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      take: MAX_PROPERTIES_IN_CONTEXT,
    }).catch(() => [] as any[]);

    const lineUrl = await loadLineUrl();
    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com').replace(/\/$/, '');

    const propertyCatalog = properties.length
      ? properties.map(summarizeProperty).join('\n')
      : '（目前資料庫沒有任何「出租中」狀態的物件）';

    // 把 LEGAL_SUMMARY_FOR_AI 中的 ${siteUrl} 模板替換成實際 URL
    const legalSummary = LEGAL_SUMMARY_FOR_AI.replace(/\$\{siteUrl\}/g, siteUrl);

    const systemPrompt = `${settings.customerServiceSystemPrompt}

${legalSummary}

# 目前「出租中」物件清單（共 ${properties.length} 筆，依精選與最新排序）
**重要：下方清單已預先過濾，僅包含「出租中」狀態（listingStatus=active）的物件。任何不在此清單上的物件都不可推薦。**

${propertyCatalog}

# 推薦規則（嚴格遵守）
1. **只能推薦上方清單中列出的物件** — 清單中每一筆都已確認為「出租中」可承租狀態
2. **絕對不可推薦清單外的物件** — 包括但不限於：已出租 / 售出 / 結束 / 下架 / 審核中的物件，或你想像中可能存在但未列出的物件
3. **絕對不可虛構物件** — 不要編造 ID、地址、租金、坪數、房型等任何欄位
4. 若清單為空（沒有任何出租中物件），誠實告知用戶「目前暫無符合需求的可租物件，建議透過 LINE 聯繫業務專員了解最新進件」
5. 推薦時請註明 ID、地區、房型、租金，方便用戶辨識
6. 用戶想看完整資訊時，提供物件詳情連結：${siteUrl}/properties/<ID>
7. 用戶有預約看房 / 議價 / 詳細諮詢需求時，引導他們點擊下方「LINE 諮詢」按鈕直接聯繫業務專員（連結：${lineUrl}）
8. 用戶詢問完整服務條款內容請提供 ${siteUrl}/terms
9. 用戶詢問完整隱私權政策內容請提供 ${siteUrl}/privacy
10. 一次最多推薦 3 個物件，避免訊息過長
11. 訊息控制在 5 句話以內，需要時用條列項目
12. 用繁體中文回應

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
    const reply: string =
      json?.choices?.[0]?.message?.content ??
      json?.choices?.[0]?.message?.reasoning ??
      '';
    if (!reply) {
      return NextResponse.json({ error: '客服無回應' }, { status: 502 });
    }

    return NextResponse.json({ reply, lineUrl });
  } catch (e: any) {
    console.error('[customer-service] failed', e?.message);
    return NextResponse.json({ error: '客服服務暫時無法回應' }, { status: 500 });
  }
}
