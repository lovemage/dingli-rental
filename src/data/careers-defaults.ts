// 人才招募頁面（/careers）後台可編輯內容
// 對應 SiteContent.section = 'careers'
// 變更：2026-05 redesign — 棄用 benefits / positions / ctaEmail / contactCta*
// 改採 5 段式版型（philosophy / training / income / tier1 / wlb）+ CTA。

export type CareersValuePillar = {
  icon: string;  // Material Symbols Rounded
  label: string;
};

export type CareersTrainingPoint = {
  text: string;
};

export type CareersIncomeStat = {
  label: string;     // e.g. "起步年收入"
  number: string;    // e.g. "60"
  suffix: string;    // e.g. "萬+"
  note: string;      // 一句說明
};

export type CareersTier1Category = {
  icon: string;
  label: string;
};

export type CareersWLBHighlight = {
  icon: string;
  title: string;
  desc: string;
};

export type CareersContent = {
  // === Hero ===
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  description: string;
  heroImageUrl: string;

  // === Section 1 — 企業理念 ===
  philosophyEyebrow: string;          // OUR PHILOSOPHY
  philosophyTitleBrand: string;       // 鼎立 DingLi
  philosophyTitleSuffix: string;      // 企業理念
  philosophyIntro: string;
  visionTitle: string;
  visionDesc: string;
  missionTitle: string;
  missionDesc: string;
  coreValuesEyebrow: string;          // CORE VALUES
  coreValuesTitle: string;            // 鼎立 DingLi 核心價值
  valuePillars: CareersValuePillar[];

  // === Section 2 — 專業培訓 ===
  trainingEyebrow: string;            // TRAINING & SUPPORT
  trainingTitleLine1: string;         // 專業培訓！
  trainingTitleLine2: string;         // 鼎立 DingLi 就是你的最佳後援
  trainingDesc: string;
  trainingPoints: CareersTrainingPoint[];
  trainingImageUrl: string;
  trainingImageAlt: string;

  // === Section 3 — 科技平台 高薪 ===
  incomeEyebrow: string;              // TECH × HIGH INCOME
  incomeTitleLine: string;            // 科技化平台，
  incomeTitleHighlight: string;       // 助你邁向高薪
  incomeIntro: string;
  incomeStats: CareersIncomeStat[];   // 預期 2 筆
  incomeQuote: string;                // 引言

  // === Section 4 — Tier 1 高端外商 ===
  tier1Eyebrow: string;               // TIER 1 BRAND
  tier1TitleLine1: string;            // 高端外商租賃買賣
  tier1TitleLine2: string;            // 業界的翹楚
  tier1Desc: string;
  tier1Categories: CareersTier1Category[];
  tier1Badge: string;                 // 圖上小徽章文字
  tier1ImageUrl: string;
  tier1ImageAlt: string;

  // === Section 5 — Work Life Balance ===
  wlbEyebrow: string;                 // WORK · LIFE · BALANCE
  wlbTitleLine: string;               // 美式的
  wlbTitleHighlight: string;          // Work Life Balance
  wlbIntro: string;
  wlbHighlights: CareersWLBHighlight[];

  // === CTA ===
  ctaEyebrow: string;                 // JOIN US
  ctaTitle: string;
  ctaDesc: string;
  ctaButtonText: string;
  ctaButtonUrl: string;
};

export const CAREERS_DEFAULTS: CareersContent = {
  // Hero
  eyebrow: 'JOIN DINGLI',
  titleLine1: '在 鼎立 DingLi，',
  titleLine2: '開啟你的不動產職涯',
  description:
    '專業培訓、科技平台、Tier 1 高端品牌，加上美式 Work Life Balance，在這裡你能把不動產做成一輩子的事業。',
  heroImageUrl: '/images/careers-hero.webp',

  // Section 1 — 企業理念
  philosophyEyebrow: 'OUR PHILOSOPHY',
  philosophyTitleBrand: '鼎立 DingLi',
  philosophyTitleSuffix: '企業理念',
  philosophyIntro:
    '打造台灣首選的頂級不動產品牌，從專業、高效、創新、團隊四個價值出發，快速而準確地滿足每一位客戶的需求。',
  visionTitle: '我們的願景',
  visionDesc:
    '成為台灣首選的頂級不動產品牌，讓每一次居住與投資的選擇，都是值得驕傲的決定。',
  missionTitle: '我們的使命',
  missionDesc:
    '提供專業的租賃買賣顧問服務，以速度與精準，回應客戶從找屋、議價到成交的每一個需求。',
  coreValuesEyebrow: 'CORE VALUES',
  coreValuesTitle: '鼎立 DingLi 核心價值',
  valuePillars: [
    { icon: 'workspace_premium', label: '專業' },
    { icon: 'bolt',              label: '高效' },
    { icon: 'lightbulb',         label: '創新' },
    { icon: 'groups',            label: '團隊' },
  ],

  // Section 2 — 專業培訓
  trainingEyebrow: 'TRAINING & SUPPORT',
  trainingTitleLine1: '專業培訓！',
  trainingTitleLine2: '鼎立 DingLi 就是你的最佳後援',
  trainingDesc:
    '無論是新手還是經驗豐富的不動產專業人士，我們都提供專業培訓、最新產業資訊與持續支援。想走管理職位、或在專業職位深耕，我們都能為你規劃發展與成長的路徑。',
  trainingPoints: [
    { text: '一對一師徒制，新人三個月內快速上手' },
    { text: '每月內訓 + 外部講師：法規、議價、商圈分析' },
    { text: '雙職涯軌道：專業顧問 / 管理階層自由選擇' },
  ],
  trainingImageUrl: '/images/careers/agent.webp',
  trainingImageAlt: '鼎立 DingLi 業務員專業形象',

  // Section 3 — 科技平台 高薪
  incomeEyebrow: 'TECH × HIGH INCOME',
  incomeTitleLine: '科技化平台，',
  incomeTitleHighlight: '助你邁向高薪',
  incomeIntro:
    '憑藉超過 10 年的客戶資源累積與高效作業管理系統，平台提供比一般租賃買賣業更完整的資訊，讓你大幅減少行政流程、專注於成交。肯做、聰明的做，就會成功！',
  incomeStats: [
    { label: '起步年收入', number: '60',  suffix: '萬+', note: '在 鼎立 DingLi，業務年收入至少可達 60 萬。' },
    { label: '頂尖業務',   number: '300', suffix: '萬+', note: '努力 + 方法，更有機會突破年收 300 萬。' },
  ],
  incomeQuote: '「這是一個你可以實現夢想的地方。」',

  // Section 4 — Tier 1
  tier1Eyebrow: 'TIER 1 BRAND',
  tier1TitleLine1: '高端外商租賃買賣',
  tier1TitleLine2: '業界的翹楚',
  tier1Desc:
    '鼎立 DingLi 在行業內擁有 Tier 1 的品牌形象與聲譽。無論你想從事豪宅、高級商辦，還是台北精華地帶的店面租賃買賣，我們都與頂級高端客戶緊密合作，為你提供最好的發展機會。',
  tier1Categories: [
    { icon: 'apartment',  label: '豪宅' },
    { icon: 'business',   label: '高級商辦' },
    { icon: 'storefront', label: '精華店面' },
  ],
  tier1Badge: 'Tier 1 Brand',
  tier1ImageUrl: '/images/careers/owner.webp',
  tier1ImageAlt: '鼎立 DingLi 與業主豪宅成交握手',

  // Section 5 — Work Life Balance
  wlbEyebrow: 'WORK · LIFE · BALANCE',
  wlbTitleLine: '美式的',
  wlbTitleHighlight: 'Work Life Balance',
  wlbIntro: '與傳統不動產業不同，我們重視工作與生活的平衡，讓你長久走、走得遠。',
  wlbHighlights: [
    { icon: 'flight_takeoff', title: '排班出國', desc: '排班彈性安排，想出國也能說走就走。' },
    { icon: 'home_work',      title: '達標 WFH', desc: '職級達成可選擇遠端工作，自主安排節奏。' },
    { icon: 'restaurant',     title: '月聚餐',   desc: '每月團隊聚餐，工作之外也享受生活的美好。' },
  ],

  // CTA
  ctaEyebrow: 'JOIN US',
  ctaTitle: '準備好加入 鼎立 DingLi 了嗎？',
  ctaDesc: '所有最新職缺、薪資範圍與應徵流程，皆於 104 人力銀行同步更新。',
  ctaButtonText: '前往 104 投履歷',
  ctaButtonUrl: 'https://www.104.com.tw/company/1a2x6bmkli#info06',
};

// 後台 picker 用：適合人才招募頁的常見 Material Symbols
export const CAREERS_BENEFIT_ICON_PRESETS = [
  // 核心價值
  'workspace_premium', 'bolt', 'lightbulb', 'groups', 'verified', 'diamond',
  // 培訓
  'school', 'auto_stories', 'menu_book', 'trending_up', 'mentor', 'support_agent',
  // 高薪 / 科技
  'payments', 'paid', 'savings', 'rocket_launch', 'insights', 'show_chart',
  // Tier 1 / 物件
  'apartment', 'business', 'storefront', 'villa', 'corporate_fare', 'location_city',
  // 假期 / WLB
  'flight_takeoff', 'home_work', 'restaurant', 'beach_access', 'celebration', 'spa',
  // 其他
  'visibility', 'check_circle', 'star', 'favorite', 'handshake', 'emoji_events',
];
