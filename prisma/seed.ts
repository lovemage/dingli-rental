import 'dotenv/config';

import bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  // 預設管理員 admin / dingli123
  const username = 'admin';
  const defaultPwd = 'dingli123';
  const hash = await bcrypt.hash(defaultPwd, 10);

  const exists = await prisma.admin.findUnique({ where: { username } });
  if (!exists) {
    await prisma.admin.create({
      data: { username, passwordHash: hash, displayName: '系統管理員' },
    });
    console.log(`✓ 已建立預設管理員：${username} / ${defaultPwd}`);
  } else {
    console.log('• 管理員已存在，跳過建立');
  }

  // Hero 預設設定
  const settings = await prisma.heroSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.heroSettings.create({ data: { id: 1, intervalSec: 5 } });
    console.log('✓ 已建立 Hero 預設設定');
  }

  // 首頁評論預設內容（6 中文 + 2 英文 + 2 日文）
  const testimonials = [
    {
      name: '陳小姐',
      role: '外商行銷經理',
      quote: '帶看很有效率，業務把每個物件優缺點講得很清楚，兩天內就找到理想租屋。',
    },
    {
      name: '王先生',
      role: '產品經理',
      quote: '原本以為找房要跑很多趟，結果需求整理後一次帶看就命中，流程非常順。',
    },
    {
      name: '林小姐',
      role: '醫護人員',
      quote: '上夜班最怕通勤不方便，業務幫我精準篩選，入住後也持續關心狀況。',
    },
    {
      name: '張先生',
      role: '新婚家庭',
      quote: '租金與合約條款講得很透明，和房東溝通也很到位，省下很多協調成本。',
    },
    {
      name: '黃小姐',
      role: '研究生',
      quote: '第一次在台北租屋很緊張，從看屋到簽約都有清楚說明，讓人很安心。',
    },
    {
      name: '郭先生',
      role: '創業者',
      quote: '辦公空間需求變化很快，團隊回覆速度快、建議實際，幫我抓到很好的地點。',
    },
    {
      name: 'Emily Chen',
      role: 'UX Designer',
      quote: 'The team understood my requirements quickly and arranged viewings that were actually relevant.',
    },
    {
      name: 'Michael Lee',
      role: 'Finance Analyst',
      quote: 'Clear contract terms, responsive communication, and a smooth move-in process from start to finish.',
    },
    {
      name: '佐藤健太',
      role: 'ソフトウェアエンジニア',
      quote: '日本語で丁寧に対応してくれて、契約内容も分かりやすく説明してもらえました。',
    },
    {
      name: '鈴木彩',
      role: 'マーケティング担当',
      quote: '希望条件に合う物件を短期間で提案してくれて、内見から入居までとてもスムーズでした。',
    },
  ];

  const aboutContent = await prisma.siteContent.findUnique({ where: { section: 'about' } });
  const aboutData = (aboutContent?.data as Record<string, unknown>) || {};
  await prisma.siteContent.upsert({
    where: { section: 'about' },
    create: {
      section: 'about',
      data: { testimonials },
    },
    update: {
      data: {
        ...aboutData,
        testimonials,
      },
    },
  });
  console.log('✓ 已同步首頁評論（6 中文 / 2 英文 / 2 日文）');

  // 精選物件（首頁「本週嚴選好物件」區塊）
  const featuredProperties = [
    {
      title: '明亮電梯套房・近捷運站',
      region: '台北市',
      city: '台北市',
      district: '大安區',
      street: '忠孝東路四段',
      number: '120',
      typeMid: '套房',
      buildingType: '電梯大樓',
      adType: '套房-電梯大樓',
      rooms: 1,
      livingRooms: 0,
      bathrooms: 1,
      balconies: 1,
      usableArea: 12,
      buildingAge: 8,
      direction: '南',
      hasElevator: true,
      rent: 18500,
      deposit: '兩個月',
      managementFee: 800,
      minLease: '一年',
      anytimeMoveIn: true,
      cookingAllowed: false,
      petsAllowed: false,
      tenantTypes: ['上班族', '學生'],
      equipment: ['冷氣', '冰箱', '洗衣機', '熱水器', '網路'],
      furniture: ['床', '衣櫃', '書桌', '椅子'],
      featureTags: ['近捷運', '採光佳', '可短租'],
      description: '位於忠孝東路精華地段，緊鄰捷運忠孝復興站，生活機能極佳。屋況維護良好，採光通風皆優。',
      imageUrl: '/images/property1.webp',
      featured: true,
    },
    {
      title: '挑高夾層・採光絕佳',
      region: '新北市',
      city: '新北市',
      district: '板橋區',
      street: '文化路二段',
      number: '358',
      typeMid: '整層住家',
      buildingType: '電梯大樓',
      adType: '整層住家-電梯大樓',
      rooms: 2,
      livingRooms: 1,
      bathrooms: 1,
      balconies: 1,
      usableArea: 22,
      buildingAge: 6,
      direction: '東南',
      hasElevator: true,
      rent: 32000,
      deposit: '兩個月',
      managementFee: 1500,
      minLease: '一年',
      anytimeMoveIn: true,
      cookingAllowed: true,
      petsAllowed: false,
      tenantTypes: ['上班族', '家庭'],
      equipment: ['冷氣', '冰箱', '洗衣機', '熱水器', '網路', '電視'],
      furniture: ['床', '衣櫃', '沙發', '餐桌'],
      featureTags: ['挑高夾層', '採光絕佳', '近捷運'],
      description: '板橋文化商圈核心位置，挑高 3.6 米夾層設計，雙面採光通風。鄰近捷運江子翠站、板橋車站，生活與通勤皆便利。',
      imageUrl: '/images/property2.webp',
      featured: true,
    },
    {
      title: '精品辦公・電梯整層',
      region: '桃園市',
      city: '桃園市',
      district: '桃園區',
      street: '中正路',
      number: '888',
      typeMid: '辦公室',
      buildingType: '電梯大樓',
      adType: '辦公室-電梯大樓',
      rooms: 0,
      livingRooms: 0,
      bathrooms: 2,
      balconies: 0,
      usableArea: 35,
      buildingAge: 10,
      direction: '南',
      hasElevator: true,
      rent: 80000,
      deposit: '三個月',
      managementFee: 3500,
      minLease: '一年',
      anytimeMoveIn: true,
      cookingAllowed: false,
      petsAllowed: false,
      tenantTypes: ['上班族'],
      equipment: ['冷氣', '網路', '電視'],
      furniture: [],
      featureTags: ['整層辦公', '近車站', '電梯大樓'],
      description: '桃園市政中心商圈，整層出租可容納 8 個工作站。雙衛浴、獨立會議室空間，企業形象佳。',
      imageUrl: '/images/office.webp',
      featured: true,
    },
    {
      title: '一樓金店面・人潮密集',
      region: '新北市',
      city: '新北市',
      district: '中和區',
      street: '連城路',
      number: '258',
      typeMid: '店面',
      buildingType: '透天厝',
      adType: '店面-透天',
      rooms: 0,
      livingRooms: 0,
      bathrooms: 1,
      balconies: 0,
      usableArea: 28,
      buildingAge: 25,
      direction: '北',
      hasElevator: false,
      rent: 65000,
      deposit: '三個月',
      noManagementFee: true,
      minLease: '一年',
      anytimeMoveIn: true,
      cookingAllowed: false,
      petsAllowed: false,
      tenantTypes: ['上班族'],
      equipment: ['冷氣'],
      furniture: [],
      featureTags: ['一樓金店面', '人潮密集', '雙面採光'],
      description: '中和連城路黃金店面，雙面採光、走道寬敞。鄰近南勢角捷運站，公車轉乘人潮聚集，餐飲零售首選。',
      imageUrl: '/images/shop.webp',
      featured: true,
    },
    {
      title: '日系溫馨小家・邊間',
      region: '台北市',
      city: '台北市',
      district: '大安區',
      street: '和平東路二段',
      number: '76',
      typeMid: '套房',
      buildingType: '電梯大樓',
      adType: '套房-電梯大樓',
      rooms: 1,
      livingRooms: 0,
      bathrooms: 1,
      balconies: 1,
      usableArea: 9,
      buildingAge: 5,
      direction: '東',
      hasElevator: true,
      rent: 14800,
      deposit: '兩個月',
      managementFee: 600,
      minLease: '一年',
      anytimeMoveIn: true,
      cookingAllowed: false,
      petsAllowed: false,
      tenantTypes: ['學生', '上班族'],
      equipment: ['冷氣', '冰箱', '洗衣機', '熱水器', '網路'],
      furniture: ['床', '衣櫃', '書桌', '椅子'],
      featureTags: ['邊間', '日系裝潢', '採光佳'],
      description: '邊間設計、雙窗戶通風採光佳。日系極簡裝潢，傢俱齊全可立即入住，鄰近捷運科技大樓站及師大商圈。',
      imageUrl: '/images/residential.webp',
      featured: true,
    },
    {
      title: '景觀電梯三房・優質學區',
      region: '桃園市',
      city: '桃園市',
      district: '中壢區',
      street: '青埔高鐵特區',
      number: '12',
      typeMid: '整層住家',
      buildingType: '電梯大樓',
      adType: '整層住家-電梯大樓',
      rooms: 3,
      livingRooms: 2,
      bathrooms: 2,
      balconies: 2,
      usableArea: 32,
      buildingAge: 3,
      direction: '南',
      hasElevator: true,
      rent: 45000,
      deposit: '兩個月',
      managementFee: 2000,
      minLease: '一年',
      anytimeMoveIn: true,
      cookingAllowed: true,
      petsAllowed: true,
      tenantTypes: ['家庭'],
      equipment: ['冷氣', '冰箱', '洗衣機', '熱水器', '網路', '電視', '天然瓦斯'],
      furniture: ['床', '衣櫃', '沙發', '餐桌', '椅子'],
      featureTags: ['景觀戶', '優質學區', '寵物友善', '近高鐵'],
      description: '青埔高鐵特區三房景觀戶，採光無遮蔽。鄰近高鐵桃園站、機場捷運與青埔商圈，學區完整且生活機能佳。',
      imageUrl: '/images/hero.webp',
      featured: true,
    },
  ];

  for (const item of featuredProperties) {
    const { imageUrl, ...data } = item;
    const existing = await prisma.property.findFirst({ where: { title: data.title } });
    if (existing) {
      await prisma.property.update({
        where: { id: existing.id },
        data: data as any,
      });
      // 確保至少有一張圖
      const hasImage = await prisma.propertyImage.findFirst({ where: { propertyId: existing.id } });
      if (!hasImage) {
        await prisma.propertyImage.create({
          data: { propertyId: existing.id, url: imageUrl, order: 0 },
        });
      }
    } else {
      const created = await prisma.property.create({ data: data as any });
      await prisma.propertyImage.create({
        data: { propertyId: created.id, url: imageUrl, order: 0 },
      });
    }
  }
  console.log(`✓ 已同步 ${featuredProperties.length} 筆精選物件`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
