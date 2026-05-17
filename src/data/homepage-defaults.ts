// 首頁可後台編輯內容的預設值
// 對應 SiteContent 的 homepage_hero / homepage_categories / homepage_services

export type HeroContent = {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  primaryCtaText: string;
  primaryCtaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
};

export type CategoryItem = {
  tag: string;
  title: string;
  desc: string;
  imageUrl: string;
  href: string;
};

export type CategoriesContent = {
  items: CategoryItem[];
};

export type ServiceItem = {
  icon: string; // Material Symbols name
  title: string;
  desc: string;
};

export type ServicesContent = {
  eyebrow: string;
  title: string;
  sub: string;
  ctaText: string;
  ctaLink: string;
  items: ServiceItem[];
};

export const HERO_DEFAULTS: HeroContent = {
  eyebrow: 'Dingli Rental Service · 北北基桃竹真人租屋',
  titleLine1: '找到一個家，',
  titleLine2: '不只是找一間房',
  description:
    '鼎立租售管理 是深耕北北基桃竹的專業租賃品牌，由真人業務全程陪伴，從帶看、議價到簽約入住，協助您找到真正想回去的家。',
  primaryCtaText: '看可租物件 →',
  primaryCtaLink: '/properties',
  secondaryCtaText: '聯絡業務專員',
  secondaryCtaLink: '/contact',
};

export const CATEGORIES_DEFAULTS: CategoriesContent = {
  items: [
    {
      tag: 'RESIDENTIAL',
      title: '住宅出租',
      desc: '套房、雅房、整層住家，安心入住每一個夜晚。',
      imageUrl: '/images/residential.webp',
      href: '/properties?type=整層住家',
    },
    {
      tag: 'OFFICE',
      title: '辦公空間',
      desc: '獨立辦公、共享工位、整層出租，靈活規模選擇。',
      imageUrl: '/images/office.webp',
      href: '/properties?type=辦公室',
    },
    {
      tag: 'SHOP',
      title: '店面商用',
      desc: '一樓店面、二樓商用，黃金地段助您事業起飛。',
      imageUrl: '/images/shop.webp',
      href: '/properties?type=店面',
    },
  ],
};

export const SERVICES_DEFAULTS: ServicesContent = {
  eyebrow: 'OUR SERVICES',
  title: '不只是找房子，更是找一個家',
  sub: '從第一次帶看到入住後續，鼎立的業務團隊以人為本，提供每一位租客最貼心的服務。',
  ctaText: '了解更多服務 →',
  ctaLink: '/services',
  items: [
    { icon: 'home', title: '專人陪同帶看', desc: '業務親自陪同到場，現場為您解說屋況與周邊機能。' },
    { icon: 'description', title: '透明合約收費', desc: '租金、押金、仲介費用全部攤開談清楚，不會出現額外費用。' },
    { icon: 'language', title: '中英日多語服務', desc: '可使用中、英、日文溝通，並提供翻譯版本合約給外籍租客審閱。' },
    { icon: 'verified', title: '嚴選真實物件', desc: '所有物件皆經業務親自確認屋況，杜絕假房源。' },
    { icon: 'forum', title: '議價與條件協助', desc: '協助您與房東談租金、修繕條款、寵物友善與設備添購。' },
    { icon: 'bed', title: '需求精準媒合', desc: '聽懂您的真實需求 — 通勤時間、生活機能、安靜程度。' },
    { icon: 'build', title: '入住後續支援', desc: '入住後若遇到設備維修、押金退還或續約事宜，我們持續協助。' },
    { icon: 'bolt', title: '當日快速回覆', desc: '無論是 LINE、電話或 Email，業務皆會於當日內回覆。' },
  ],
};

// 常用 Material Symbols 圖示快速選單（後台 picker）
export const SERVICE_ICON_PRESETS = [
  'home', 'home_work', 'apartment', 'cottage', 'meeting_room',
  'description', 'gavel', 'fact_check', 'verified', 'shield',
  'language', 'translate', 'public', 'group', 'support_agent',
  'forum', 'chat', 'sms', 'phone', 'mail',
  'search', 'manage_search', 'pageview', 'travel_explore',
  'bed', 'chair', 'kitchen', 'bathtub', 'directions_car',
  'build', 'handyman', 'engineering', 'construction',
  'bolt', 'schedule', 'access_time', 'event',
  'pets', 'eco', 'park',
  'star', 'favorite', 'thumb_up',
];
