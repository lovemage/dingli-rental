// 頁首導覽列文字（後台可編輯）
// 對應 SiteContent.section = 'header_nav'
//
// 若 DB row 不存在，前端會 fallback 至 messages/{locale}.json 的 header.* 既有翻譯，
// 因此 admin 不必為了讓 EN/JA 正常顯示而被迫先儲存一次。

export type HeaderNavContent = {
  properties: string;
  services: string;
  careers: string;
  contact: string;
};

export const HEADER_NAV_DEFAULTS: HeaderNavContent = {
  properties: '物件分類',
  services: '服務特色',
  careers: '人才招募',
  contact: '聯絡我們',
};
