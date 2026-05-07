// 北北基桃竹 行政區資料（縣市 → 鄉鎮市區）
// 鼎立租售管理服務範圍

export const CITY_DISTRICTS: Record<string, string[]> = {
  '台北市': [
    '中正區', '大同區', '中山區', '松山區', '大安區', '萬華區',
    '信義區', '士林區', '北投區', '內湖區', '南港區', '文山區',
  ],
  '新北市': [
    '板橋區', '三重區', '中和區', '永和區', '新莊區', '新店區',
    '土城區', '蘆洲區', '汐止區', '樹林區', '鶯歌區', '三峽區',
    '淡水區', '瑞芳區', '五股區', '泰山區', '林口區', '深坑區',
    '石碇區', '坪林區', '三芝區', '石門區', '八里區', '平溪區',
    '雙溪區', '貢寮區', '金山區', '萬里區', '烏來區',
  ],
  '基隆市': [
    '仁愛區', '信義區', '中正區', '中山區', '安樂區', '暖暖區', '七堵區',
  ],
  '桃園市': [
    '桃園區', '中壢區', '平鎮區', '八德區', '楊梅區', '蘆竹區',
    '大溪區', '龍潭區', '龜山區', '大園區', '觀音區', '新屋區', '復興區',
  ],
  '新竹市': ['東區', '北區', '香山區'],
  '新竹縣': [
    '竹北市', '竹東鎮', '新埔鎮', '關西鎮', '湖口鄉', '新豐鄉',
    '芎林鄉', '橫山鄉', '北埔鄉', '寶山鄉', '峨眉鄉', '尖石鄉', '五峰鄉',
  ],
};

export const CITIES = Object.keys(CITY_DISTRICTS);

// 大分類
export const REGIONS = ['台北市', '新北市', '基隆市', '桃園市', '新竹市', '新竹縣'] as const;

/**
 * 共用的縣市選項（i18n 友善版）。
 * - `value` 是中文字串：URL query string 與 DB region 欄位的穩定識別，不可改。
 * - `labelKey` 對應 `messages/<locale>.json` 的 `regions.<key>`，
 *   由 `useTranslations('regions')(labelKey)` 取得在地化文字。
 *
 * 前台縣市選單（HeroSearch、PropertyFilters、ContactForm）都應從這裡讀，
 * 避免硬編碼中文字串造成 en/ja 路由失守。
 */
export const REGION_OPTIONS: { value: string; labelKey: string }[] = [
  { value: '台北市', labelKey: 'taipei' },
  { value: '新北市', labelKey: 'new_taipei' },
  { value: '基隆市', labelKey: 'keelung' },
  { value: '桃園市', labelKey: 'taoyuan' },
  { value: '新竹市', labelKey: 'hsinchu_city' },
  { value: '新竹縣', labelKey: 'hsinchu_county' },
];

// 中分類
export const PROPERTY_TYPES = [
  '整層住家', '獨立套房', '分租套房', '雅房', '車位', '其他',
] as const;

// 小分類
export const BUILDING_TYPES = [
  '公寓', '別墅', '透天厝', '電梯大樓',
] as const;

// 設備
export const EQUIPMENT_OPTIONS = [
  '洗衣機', '冰箱', '電視', '冷氣', '熱水器', '網路', '第四台', '天然瓦斯',
] as const;

// 家具
export const FURNITURE_OPTIONS = [
  '床', '衣櫃', '沙發', '桌子', '椅子',
] as const;

// 身份
export const TENANT_TYPES = ['學生', '上班族', '家庭'] as const;

// 押金
export const DEPOSIT_OPTIONS = ['面議', '一個月', '兩個月', '三個月'] as const;

// 租金包含
export const RENT_INCLUDES_OPTIONS = [
  '管理費', '清潔費', '第四台', '網路', '水費', '電費', '瓦斯費',
] as const;

// 最短租期
export const MIN_LEASE_OPTIONS = ['一年', '半年', '三個月', '不限'] as const;

// 朝向
export const DIRECTION_OPTIONS = [
  '朝北', '朝南', '朝東', '朝西',
  '朝東北', '朝東南', '朝西北', '朝西南',
] as const;

// 樓層類型
export const FLOOR_TYPE_OPTIONS = ['出租單層', '全棟出租'] as const;

// 制度型特色標籤（固定，前台用綠色 badge 強化公信力）
export const FEATURE_TAGS = [
  '社會住宅', '租金補貼', '高齡友善', '可報稅', '可入籍',
] as const;

// 常用自由特色標籤建議（後台 chip input 快速加入用，前台用橘色 badge）
export const CUSTOM_TAG_SUGGESTIONS = [
  '近捷運', '近車站', '採光佳', '挑高夾層', '邊間', '頂樓加蓋',
  '景觀戶', '電梯', '寵物友善', '可開伙', '附車位', '雙衛浴',
  '優質學區', '商圈核心', '安靜巷弄', '新成屋',
] as const;
