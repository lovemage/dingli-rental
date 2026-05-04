// AI 辨識照片自動填表 — 後台可編輯設定
// 對應 SiteContent.section = 'ai_settings'

export type AiSettings = {
  openrouterApiKey: string; // 後端使用，前台 GET 會被遮罩
  model: string;            // OpenRouter model id（如 google/gemini-2.5-flash）
  systemPrompt: string;     // 系統提示詞
  userPromptTemplate: string; // 使用者提示詞範本
};

// AI 可萃取的欄位（白名單）
// SYSTEM-ONLY 欄位不在此型別中，連 schema 都不給 AI 看到
export type AiExtractedFields = Partial<{
  // === A. PHOTO-VISIBLE：照片可直接看到的物理特徵 ===
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
  direction: string;        // 朝北 / 朝南 / 朝東 / 朝西 / 朝東北 / 朝東南 / 朝西北 / 朝西南
  cookingAllowed: boolean;  // 從廚房狀況推測
  noManagementFee: boolean; // 從建物外觀推測

  // === B. TEXT-IN-PHOTO：照片內若有文字資訊（看板/傳單/門牌/物件介紹紙本）才填 ===
  // 地址
  city: string;             // 必須是 CITIES 之一（台北市/新北市/基隆市/桃園市/新竹市/新竹縣）
  district: string;         // 必須是該 city 對應的鄉鎮市區
  street: string;
  lane: string;
  alley: string;
  number: string;
  numberSub: string;
  community: string;
  // 樓層
  floor: string;
  floorSub: string;
  totalFloor: string;
  // 屋齡 / 坪數
  buildingAge: number;
  usableArea: number;
  registeredArea: number;
  // 價格 / 條件
  rent: number;             // 元/月
  deposit: string;          // 面議 / 一個月 / 兩個月 / 三個月
  managementFee: number;    // 元/月
  rentIncludes: string[];   // 從 RENT_INCLUDES_OPTIONS 挑
  // 租期 / 對象
  minLease: string;         // 一年 / 半年 / 三個月 / 不限
  moveInDate: string;       // YYYY-MM-DD
  tenantTypes: string[];    // 學生 / 上班族 / 家庭
  petsAllowed: boolean;
}>;

export const DEFAULT_MODEL = 'google/gemini-2.5-flash';

export const DEFAULT_SYSTEM_PROMPT = `你是專業的台灣房屋仲介資料整理助理。任務是看「鼎立租售管理」物件的照片，從中萃取可填入物件刊登表單的欄位。

# 表單欄位三大類（嚴格遵守）

## A. PHOTO-VISIBLE：照片可直接看到的物理特徵 — 看到就填
- rooms / livingRooms / bathrooms / balconies：整數
- openLayout：boolean，無隔間 / 開放式格局
- hasElevator：boolean，能看到電梯
- buildingType：公寓 | 別墅 | 透天厝 | 電梯大樓
- typeMid：整層住家 | 獨立套房 | 分租套房 | 雅房 | 車位 | 其他
- equipment：陣列，每項必須是 [洗衣機, 冰箱, 電視, 冷氣, 熱水器, 網路, 第四台, 天然瓦斯] 之一
- furniture：陣列，每項必須是 [床, 衣櫃, 沙發, 桌子, 椅子] 之一
- featureTags：2-6 字短詞，照片可見的賣點（採光佳、邊間、挑高、新裝潢…）
- title：6-30 字廣告標題
- description：100-2500 字現況特色描述，繁體中文
- direction：朝北 | 朝南 | 朝東 | 朝西 | 朝東北 | 朝東南 | 朝西北 | 朝西南（從窗外光線判斷，不確定就省略）
- cookingAllowed：boolean（從廚房狀況推測）
- noManagementFee：boolean（公寓 / 透天厝通常無）

## B. TEXT-IN-PHOTO：照片中若包含「物件本身的文字資訊」才可填
這類欄位「不可從照片視覺猜測」，但「若照片中明確看到文字寫著就可填」。
適用情境：物件廣告單／DM／看板／告示／門牌／合約頁／租賃資訊紙本等出現在照片中。

判斷規則：
- 文字必須清楚可讀
- 文字必須屬於「這個物件本身」（例如：貼在這間屋的廣告單、門牌、告示）
- 不要 OCR 隔壁鄰居門牌、街上其他傳單、別人家的合約

可填欄位：
- 地址：city（必須是 台北市/新北市/基隆市/桃園市/新竹市/新竹縣 之一）、district（該縣市對應的鄉鎮市區）、street、lane、alley、number、numberSub、community
- 樓層：floor（如「5」「B1」「頂樓」）、floorSub、totalFloor（如「12」）
- 屋齡：buildingAge（整數，年）
- 坪數：usableArea（可使用）、registeredArea（權狀）— 浮點數，「坪」單位
- 價格：rent（整數，元/月）、deposit（必須是 面議 | 一個月 | 兩個月 | 三個月）、managementFee（整數，元/月）
- 租金包含：rentIncludes（陣列，每項必須是 [管理費, 清潔費, 第四台, 網路, 水費, 電費, 瓦斯費] 之一）
- 租期：minLease（必須是 一年 | 半年 | 三個月 | 不限）、moveInDate（YYYY-MM-DD 格式）
- 對象：tenantTypes（陣列，每項必須是 [學生, 上班族, 家庭] 之一）、petsAllowed（boolean）

## C. SYSTEM-ONLY：系統欄位，AI 絕對不填
adType、status、listingStatus、featured、hideAddress、ageUnknown、anytimeMoveIn、region

# 嚴格規則
1. A 類：你看得到才填；不確定就省略
2. B 類：照片內必須有「屬於這個物件」的可讀文字才填；憑空猜測一律不填
3. C 類：絕對不要回傳這些欄位
4. enum 欄位（buildingType / typeMid / direction / deposit / minLease / equipment / furniture / rentIncludes / tenantTypes / city / district）必須使用上方列出的選項原文，不可自創或改字
5. featureTags 限 2-6 字短詞，每物件最多 5 個
6. title 必須在 6-30 字之間（中文字算 1 字）
7. description 至少 100 字
8. 回應必須是「純 JSON」— 不要 markdown code block、不要解釋文字、不要前後綴`;

export const DEFAULT_USER_PROMPT_TEMPLATE = `請看以下 {photoCount} 張物件照片，依系統提示詞的規則萃取可填欄位。

提醒選項清單（必須完全匹配）：
- equipment 限：{equipment}
- furniture 限：{furniture}
- buildingType 限：{buildingTypes}
- typeMid 限：{propertyTypes}
- direction 限：朝北 | 朝南 | 朝東 | 朝西 | 朝東北 | 朝東南 | 朝西北 | 朝西南
- deposit 限：面議 | 一個月 | 兩個月 | 三個月
- minLease 限：一年 | 半年 | 三個月 | 不限
- rentIncludes 限：管理費 | 清潔費 | 第四台 | 網路 | 水費 | 電費 | 瓦斯費
- tenantTypes 限：學生 | 上班族 | 家庭
- city 限：台北市 | 新北市 | 基隆市 | 桃園市 | 新竹市 | 新竹縣

特別提醒：
- A 類欄位（格局/設備/特色…）：看得到就填
- B 類欄位（地址/樓層/價格/坪數/屋齡/押金/租期/身份要求…）：「只有」當照片中出現屬於這個物件的文字資訊（廣告單／DM／看板／門牌／合約頁／物件介紹紙本）時才填，否則一律省略

回傳純 JSON。範例（你的回應只要 JSON 本體）：
{"rooms":2,"livingRooms":1,"bathrooms":1,"hasElevator":true,"buildingType":"電梯大樓","equipment":["冷氣","熱水器"],"furniture":["床","衣櫃"],"featureTags":["採光佳","邊間"],"title":"明亮兩房 採光絕佳","description":"...","city":"台北市","district":"信義區","rent":35000,"deposit":"兩個月"}`;

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
