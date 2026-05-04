// 全站浮動聯絡按鈕（右下角）
// 對應 SiteContent.section = 'floating_cta'

export type FloatingCtaContent = {
  enabled: boolean;
  avatarUrl: string;
  linkUrl: string;       // 通常是 LINE 連結
  bubbleTitle: string;   // 泡泡主文字（如：LINE 諮詢）
  bubbleSubtitle: string; // 泡泡副文字（如：點擊聯絡客服）
  label: string;         // aria-label / hover tooltip
};

export const FLOATING_CTA_DEFAULTS: FloatingCtaContent = {
  enabled: true,
  avatarUrl: '/images/floating-cta-avatar.webp',
  linkUrl: 'https://lin.ee/z9d5558',
  bubbleTitle: 'LINE 諮詢',
  bubbleSubtitle: '點我聯絡客服',
  label: '聯絡客服',
};
