// 人才招募頁面（/careers）後台可編輯內容
// 對應 SiteContent.section = 'careers'

export type CareersBenefit = {
  icon: string; // Material Symbols Rounded name
  title: string;
  desc: string;
};

export type CareersPosition = {
  title: string;
  type: string;       // 全職 / 兼職 / 實習...
  region: string;     // 工作地點
  salary: string;
  desc: string;
  requirements: string[];
};

export type CareersContent = {
  // Hero
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  heroImageUrl: string;

  // 福利
  benefitsTitle: string;
  benefits: CareersBenefit[];

  // 職缺
  positionsTitle: string;
  positions: CareersPosition[];

  // CTA
  ctaTitle: string;
  ctaDesc: string;
  ctaEmail: string;
  contactCtaText: string;
  contactCtaLink: string;
};

export const CAREERS_DEFAULTS: CareersContent = {
  eyebrow: 'JOIN US',
  titleLine1: '加入鼎立，',
  titleLine2: '一起把租屋這件事做好',
  description:
    '我們相信好的租屋體驗從業務的態度開始。如果您熱愛與人互動、認同誠信透明的價值，歡迎加入鼎立團隊。',
  heroImageUrl: '/images/careers-hero.webp',

  benefitsTitle: '我們提供的福利',
  benefits: [
    { icon: 'payments',          title: '高底薪 + 獎金',     desc: '保障底薪外加成交獎金，努力就有回報。' },
    { icon: 'school',            title: '完整教育訓練',      desc: '新進業務一對一帶領，快速上手。' },
    { icon: 'event_available',   title: '彈性休假',          desc: '排班彈性，輪休制不打卡。' },
    { icon: 'health_and_safety', title: '完善保險',          desc: '勞健保與團保，安心工作。' },
  ],

  positionsTitle: '職缺資訊',
  positions: [
    {
      title: '租賃業務專員',
      type: '全職',
      region: '台北・新北・桃園',
      salary: 'NT$ 35K - 80K（含獎金）',
      desc: '負責物件帶看、需求媒合、合約議價與後續服務。',
      requirements: [
        '具良好溝通能力',
        '熱愛與人互動',
        '有業務經驗者佳',
        '熟悉北北基桃地區尤佳',
      ],
    },
    {
      title: '商用物件業務經理',
      type: '全職',
      region: '台北・新北',
      salary: 'NT$ 50K - 120K（含獎金）',
      desc: '專責辦公與店面物件，從商圈分析、租金行情到合約風險評估。',
      requirements: [
        '3 年以上商用物件經驗',
        '熟悉商圈與企業承租流程',
        '具備合約風險判讀能力',
      ],
    },
    {
      title: '物件編輯助理',
      type: '兼職／全職',
      region: '台北',
      salary: 'NT$ 28K - 38K',
      desc: '負責物件資料整理、照片美化、文字撰寫與前後台維護。',
      requirements: [
        '細心、文字流暢',
        '具備基本影像處理能力',
        '可使用後台系統管理物件',
      ],
    },
  ],

  ctaTitle: '投遞履歷',
  ctaDesc: '請將履歷寄至 hr@dingli-rental.com，主旨註明「應徵職缺名稱」。',
  ctaEmail: 'hr@dingli-rental.com',
  contactCtaText: '或透過聯絡表單 →',
  contactCtaLink: '/contact',
};

// 後台 picker 用：適合福利區塊的常見 Material Symbols
export const CAREERS_BENEFIT_ICON_PRESETS = [
  // 薪酬 / 獎金
  'payments', 'paid', 'savings', 'credit_card', 'account_balance_wallet',
  // 訓練 / 成長
  'school', 'auto_stories', 'menu_book', 'workspace_premium', 'trending_up',
  // 假期 / 時間
  'event_available', 'beach_access', 'schedule', 'calendar_today', 'flight_takeoff',
  // 保險 / 健康
  'health_and_safety', 'medical_services', 'local_hospital', 'shield', 'verified_user',
  // 團隊 / 文化
  'groups', 'handshake', 'diversity_3', 'volunteer_activism', 'celebration',
  // 工作環境
  'coffee', 'restaurant', 'pets', 'eco', 'spa',
];
