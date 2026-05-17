// 站頂公告（顯示在每個前台頁面 Header 上方）
// 對應 SiteContent.section = 'announcement'

export type AnnouncementEffect =
  | 'marquee'         // 跑馬燈（左→右）— 預設
  | 'marquee-reverse' // 跑馬燈（右→左）
  | 'typewriter'      // 打字機
  | 'blink'           // 閃爍
  | 'fade'            // 淡入淡出
  | 'pulse';          // 脈動放大

export type AnnouncementSettings = {
  enabled: boolean;
  text: string;
  effect: AnnouncementEffect;
};

export const ANNOUNCEMENT_EFFECT_OPTIONS: { value: AnnouncementEffect; label: string; desc: string }[] = [
  { value: 'marquee',         label: '跑馬燈（左→右）',  desc: '文字由左向右流動，預設效果' },
  { value: 'marquee-reverse', label: '跑馬燈（右→左）',  desc: '傳統跑馬燈方向' },
  { value: 'typewriter',      label: '打字機',          desc: '文字逐字浮現再消失，循環播放' },
  { value: 'blink',           label: '閃爍',            desc: '文字快速顯示／隱藏，提醒效果強' },
  { value: 'fade',            label: '淡入淡出',        desc: '柔和的呼吸式漸隱漸顯' },
  { value: 'pulse',           label: '脈動放大',        desc: '輕微縮放，吸引目光不刺眼' },
];

export const ANNOUNCEMENT_DEFAULTS: AnnouncementSettings = {
  enabled: true,
  text: '歡迎光臨鼎立租售管理 ｜ 深耕雙北桃園｜真實物件嚴選｜中英日多語服務｜業務專員當日內回覆',
  effect: 'marquee',
};
