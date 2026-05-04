// AI 辨識照片自動填表 — 後台可編輯設定
// 對應 SiteContent.section = 'ai_settings'

export type AiSettings = {
  openrouterApiKey: string; // 後端使用，前台 GET 會被遮罩
  model: string;            // OpenRouter model id（如 google/gemini-2.5-flash）
  systemPrompt: string;     // 系統提示詞
  userPromptTemplate: string; // 使用者提示詞範本
};

// AI 從照片可萃取的欄位（白名單；FORBIDDEN 欄位不放）
export type AiExtractedFields = Partial<{
  // ALLOWED
  rooms: number;
  livingRooms: number;
  bathrooms: number;
  balconies: number;
  openLayout: boolean;
  hasElevator: boolean;
  buildingType: string;     // 公寓 / 別墅 / 透天厝 / 電梯大樓
  typeMid: string;          // 整層住家 / 獨立套房 / 分租套房 / 雅房 / 車位 / 其他
  equipment: string[];      // 從 EQUIPMENT_OPTIONS 挑
  furniture: string[];      // 從 FURNITURE_OPTIONS 挑
  featureTags: string[];    // 自由特色（採光佳、近捷運、邊間…）
  title: string;            // 6-30 字
  description: string;      // 100-2500 字
  // SUGGESTABLE（信心較低，仍會套用，使用者可改）
  direction: string;        // 朝北 / 朝南 / 朝東 / 朝西 / 朝東北 / 朝東南 / 朝西北 / 朝西南
  cookingAllowed: boolean;  // 從廚房狀況推測
  noManagementFee: boolean; // 從建物外觀推測（公寓通常無管理費）
}>;

export const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export const DEFAULT_SYSTEM_PROMPT = `你是專業的台灣房屋仲介資料整理助理。任務是看「鼎立租售管理」物件的照片，從中萃取可填入物件刊登表單的欄位。

# 表單完整欄位參考（讓你了解整個表單結構，但只能回傳 ALLOWED / SUGGESTABLE 欄位）

## A. ALLOWED：照片可清楚看見、AI 應填寫
- rooms（房數）、livingRooms（廳數）、bathrooms（衛浴數）、balconies（陽台數）：整數
- openLayout：boolean，照片顯示無隔間 / 開放式格局
- hasElevator：boolean，能看到電梯內部 / 大樓電梯按鈕
- buildingType：公寓 | 別墅 | 透天厝 | 電梯大樓（從外觀照判斷）
- typeMid（中分類）：整層住家 | 獨立套房 | 分租套房 | 雅房 | 車位 | 其他
- equipment：陣列，每項必須是 [洗衣機, 冰箱, 電視, 冷氣, 熱水器, 網路, 第四台, 天然瓦斯] 之一
- furniture：陣列，每項必須是 [床, 衣櫃, 沙發, 桌子, 椅子] 之一
- featureTags：2-6 字短詞，描述照片可見的賣點（採光佳、邊間、挑高、近捷運、新裝潢、景觀戶、雙衛浴…）
- title：6-30 字廣告標題，吸引人但不誇大
- description：100-2500 字現況特色描述，繁體中文，先寫亮點再寫實況

## B. SUGGESTABLE：信心較低但仍可建議
- direction：朝北 | 朝南 | 朝東 | 朝西 | 朝東北 | 朝東南 | 朝西北 | 朝西南（從窗外光線判斷，不確定就省略）
- cookingAllowed：boolean（從廚房有無油煙痕跡 / 完整廚具推測）
- noManagementFee：boolean（公寓 / 透天厝通常無管理費）

## C. FORBIDDEN：絕對不要回傳，由人工填寫（這些欄位照片看不出來）
- region / city / district / street / lane / alley / number / numberSub（地址）
- floor / floorSub / totalFloor / floorType（樓層）
- community（社區名稱）
- buildingAge / ageUnknown（屋齡）
- usableArea / registeredArea（坪數）
- rent / deposit / rentIncludes / managementFee（價格）
- minLease / moveInDate / anytimeMoveIn（租期）
- tenantTypes / petsAllowed（身份要求 / 寵物政策 — 屬於屋主規範，照片看不出）
- adType / status / listingStatus / featured / hideAddress

# 嚴格規則
1. 只回填你「真的看得到」的 ALLOWED / SUGGESTABLE 欄位 — 不確定就省略，不要編造
2. 永遠不要回傳 FORBIDDEN 欄位（會被後端過濾掉，但仍是浪費 token）
3. equipment / furniture / buildingType / typeMid / direction 必須使用上方列出的選項原文，不可自創或改字
4. featureTags 限 2-6 字短詞，每個物件最多 5 個
5. title 必須在 6-30 字之間（中文字算 1 字）
6. description 至少 100 字，先描述亮點再描述實況
7. 回應必須是「純 JSON」— 不要 markdown code block (\`\`\`json)、不要解釋文字、不要前後綴`;

export const DEFAULT_USER_PROMPT_TEMPLATE = `請看以下 {photoCount} 張物件照片，依系統提示詞的規則萃取可填欄位。

提醒選項清單（必須完全匹配）：
- equipment 限：{equipment}
- furniture 限：{furniture}
- buildingType 限：{buildingTypes}
- typeMid 限：{propertyTypes}
- direction 限：朝北 | 朝南 | 朝東 | 朝西 | 朝東北 | 朝東南 | 朝西北 | 朝西南

回傳純 JSON。範例（你的回應只要 JSON 本體，不要範例外的任何文字）：
{"rooms":2,"livingRooms":1,"bathrooms":1,"balconies":1,"hasElevator":true,"buildingType":"電梯大樓","equipment":["冷氣","熱水器","冰箱"],"furniture":["床","衣櫃"],"featureTags":["採光佳","邊間","近捷運"],"title":"明亮兩房 採光絕佳 近捷運","description":"位於電梯大樓中段樓層的兩房格局，..."}

只填看得到的欄位。看不出來的欄位請省略。地址、價格、坪數、樓層、屋齡、押金、租期等屬於 FORBIDDEN 欄位，絕對不要回傳。`;

// 預設值（供 fallback 與「重設」按鈕使用）
export const AI_SETTINGS_DEFAULTS: AiSettings = {
  openrouterApiKey: '',
  model: DEFAULT_MODEL,
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  userPromptTemplate: DEFAULT_USER_PROMPT_TEMPLATE,
};

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return '••••';
  return `${key.slice(0, 6)}••••••••${key.slice(-4)}`;
}
