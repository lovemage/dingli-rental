// 聯絡頁面（/contact）後台可編輯內容
// 對應 SiteContent.section = 'contact_page'
// 注意：避開既有 'contact' section 名稱以免衝突

export type ContactAgent = {
  initial: string;            // 1 字（無頭像時顯示）
  avatarUrl?: string;         // 選填頭像 URL
  badgeColor: 'green' | 'orange'; // 漸層底色
  name: string;
  role: string;
  bullets: string[];
  phone: string;              // 顯示用 0912-000-111
  phoneTel: string;           // tel: 連結用 +886912000111
  lineUrl: string;
  email: string;
};

export type ContactCompanyInfo = {
  companyName: string;
  businessId: string;
  address: string;
  customerEmail: string;
  serviceHours: string;
  serviceArea: string;
};

// 社群連結（全站共用，目前顯示在 Footer 右下）。
// 留空字串 → 前台自動隱藏該圖示。
export type ContactSocial = {
  instagram: string;
  facebook: string;
  whatsapp: string;
};

export type ContactContent = {
  // Hero
  eyebrow: string;
  title: string;
  description: string;
  // 業務團隊
  agentsTitle: string;
  agents: ContactAgent[];
  // 公司資訊
  companyInfoTitle: string;
  companyInfo: ContactCompanyInfo;
  // 社群連結（Footer 顯示用）
  social: ContactSocial;
  // 需求表單區塊（前端表單元件的文案）
  formTitle: string;
  formSubmitText: string;
  formNote: string;
  formSuccessMessage: string;
};

export const CONTACT_DEFAULTS: ContactContent = {
  eyebrow: 'CONTACT US',
  title: '告訴我們您的需求',
  description: '業務團隊將於當日內聯繫您，安排合適的物件帶看與諮詢。',

  agentsTitle: '租賃業務團隊',
  agents: [
    {
      initial: '楊',
      badgeColor: 'green',
      name: '楊小姐',
      role: '資深租賃業務專員',
      bullets: [
        '專責住宅與電梯套房，台北・新北 10+ 年經驗',
        '中・英・日多語溝通服務',
      ],
      phone: '0912-000-111',
      phoneTel: '+886912000111',
      lineUrl: 'https://lin.ee/z9d5558',
      email: 'yang@dingli-rental.com',
    },
    {
      initial: '曹',
      badgeColor: 'orange',
      name: '曹先生',
      role: '商用物件業務經理',
      bullets: [
        '專責辦公大樓與店面物件',
        '商圈分析、租金行情與合約風險評估',
      ],
      phone: '0933-000-222',
      phoneTel: '+886933000222',
      lineUrl: 'https://lin.ee/z9d5558',
      email: 'tsao@dingli-rental.com',
    },
  ],

  social: {
    instagram: 'https://www.instagram.com/dingli_rental?igsh=OGVydDRrNzgxNjlp&utm_source=qr',
    facebook: 'https://www.facebook.com/share/18b1r63P7F/?mibextid=wwXIfr',
    whatsapp: '',
  },

  companyInfoTitle: '公司資訊',
  companyInfo: {
    companyName: '鼎立房屋有限公司',
    businessId: '93790198',
    address: '新北市新莊區西盛街199號2樓',
    customerEmail: 'service@dingli-rental.com',
    serviceHours: '週一至週日 09:00 - 21:00',
    serviceArea: '雙北桃園',
  },

  formTitle: '填寫需求表',
  formSubmitText: '送出需求 →',
  formNote: '送出後我們將於 24 小時內聯繫，感謝您！',
  formSuccessMessage: '已收到您的訊息，業務專員將於當日內聯繫您。',
};
