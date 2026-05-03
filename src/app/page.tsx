import Link from 'next/link';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import HeroCarousel, { HeroSlide as HeroSlideType } from '@/components/frontend/HeroCarousel';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const FALLBACK_SLIDES: HeroSlideType[] = [
  { id: 1, imageUrl: '/images/hero.webp', title: '溫馨明亮的家', subtitle: '精選北北基桃竹優質物件' },
  { id: 2, imageUrl: '/images/residential.webp', title: '日系臥室套房', subtitle: '通勤便利・採光絕佳' },
  { id: 3, imageUrl: '/images/property2.webp', title: '挑高夾層住宅', subtitle: '雙北優質好屋' },
];

async function getHero() {
  try {
    const [slides, settings] = await Promise.all([
      prisma.heroSlide.findMany({ where: { active: true }, orderBy: { order: 'asc' }, take: 3 }),
      prisma.heroSettings.findUnique({ where: { id: 1 } }),
    ]);
    return {
      slides: slides.length ? slides : FALLBACK_SLIDES,
      intervalSec: settings?.intervalSec ?? 5,
    };
  } catch {
    return { slides: FALLBACK_SLIDES, intervalSec: 5 };
  }
}

export default async function HomePage() {
  const { slides, intervalSec } = await getHero();

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section className="relative pt-20 pb-24 overflow-hidden bg-gradient-to-b from-paper to-paper-2">
          <div className="container-page relative z-10">
            <div className="grid md:grid-cols-[1.05fr_1fr] gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />Dingli Rental Service · 安心租屋首選</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5">
                  找到一個家，<br />
                  <span className="text-brand-green-700 relative inline-block">
                    不只是找一間房
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-orange-300/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-ink-700 max-w-xl mb-8">
                  鼎立租售管理 是深耕北北基桃竹的專業租賃品牌，由真人業務全程陪伴，從帶看、議價到簽約入住，協助您找到真正想回去的家。
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href="/properties" className="btn btn-primary">看可租物件 →</Link>
                  <Link href="/contact" className="btn btn-secondary">聯絡業務專員</Link>
                </div>
                <div className="flex flex-wrap gap-9">
                  <Stat num="10" suffix="+" label="年 在地深耕" />
                  <Stat num="1,200" suffix="+" label="滿意租客" />
                  <Stat num="3" suffix="語" label="中・英・日服務" />
                  <Stat num="98" suffix="%" label="客戶推薦率" />
                </div>
              </div>

              <HeroCarousel slides={slides} intervalSec={intervalSec} />
            </div>
          </div>
        </section>

        {/* 物件分類 */}
        <section className="py-24" id="categories">
          <div className="container-page">
            <SectionHead eyebrow="三大分類" title="找到最適合您的空間" sub="從溫暖小窩、辦公基地到實體店面，依您的生活與事業階段挑選。" />
            <div className="grid md:grid-cols-3 gap-6">
              <CatCard href="/properties?type=整層住家" img="/images/residential.webp" tag="RESIDENTIAL" title="住宅出租" desc="套房、雅房、整層住家，安心入住每一個夜晚。" />
              <CatCard href="/properties?type=其他" img="/images/office.webp" tag="OFFICE" title="辦公空間" desc="獨立辦公、共享工位、整層出租，靈活規模選擇。" />
              <CatCard href="/properties?type=其他" img="/images/shop.webp" tag="SHOP" title="店面商用" desc="一樓店面、二樓商用，黃金地段助您事業起飛。" />
            </div>
          </div>
        </section>

        {/* 服務特色 */}
        <section className="py-24 bg-paper-2">
          <div className="container-page">
            <SectionHead eyebrow="OUR SERVICES" title="不只是找房子，更是找一個家" sub="從第一次帶看到入住後續，鼎立的業務團隊以人為本，提供每一位租客最貼心的服務。" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatCard icon="🏠" title="專人陪同帶看" desc="業務親自陪同到場，現場為您解說屋況與周邊機能。" />
              <FeatCard icon="📋" title="透明合約收費" desc="租金、押金、仲介費用全部攤開談清楚，不會出現額外費用。" />
              <FeatCard icon="🌐" title="中英日多語服務" desc="可使用中、英、日文溝通，並提供翻譯版本合約給外籍租客審閱。" />
              <FeatCard icon="🔍" title="嚴選真實物件" desc="所有物件皆經業務親自確認屋況，杜絕假房源。" />
              <FeatCard icon="💬" title="議價與條件協助" desc="協助您與房東談租金、修繕條款、寵物友善與設備添購。" />
              <FeatCard icon="🛏️" title="需求精準媒合" desc="聽懂您的真實需求 — 通勤時間、生活機能、安靜程度。" />
              <FeatCard icon="🛠️" title="入住後續支援" desc="入住後若遇到設備維修、押金退還或續約事宜，我們持續協助。" />
              <FeatCard icon="⚡" title="當日快速回覆" desc="無論是 LINE、電話或 Email，業務皆會於當日內回覆。" />
            </div>
            <div className="text-center mt-10">
              <Link href="/services" className="btn btn-primary">了解更多服務 →</Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="container-page">
            <div className="bg-white rounded-xl shadow-md border border-line p-10 sm:p-14 text-center relative overflow-hidden">
              <span className="eyebrow"><span className="dot" />READY TO MOVE IN</span>
              <h2 className="text-3xl sm:text-4xl font-black my-4 leading-tight">準備好為自己<br />找一個真正想回去的家了嗎？</h2>
              <p className="text-lg text-ink-700 max-w-xl mx-auto mb-8">把您的需求告訴我們，業務團隊會在當日內聯繫您，安排合適的物件帶看。</p>
              <div className="flex justify-center flex-wrap gap-3">
                <Link href="/contact" className="btn btn-primary">聯絡業務專員 →</Link>
                <Link href="/properties" className="btn btn-secondary">先看推薦物件</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Stat({ num, suffix, label }: { num: string; suffix?: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-black text-brand-green-900 leading-none">
        {num}<span className="text-brand-orange-500">{suffix}</span>
      </div>
      <div className="text-sm text-ink-500 mt-1">{label}</div>
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      <span className="eyebrow"><span className="dot" />{eyebrow}</span>
      <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3 leading-tight">{title}</h2>
      <p className="text-ink-500 text-base">{sub}</p>
    </div>
  );
}

function CatCard({ href, img, tag, title, desc }: { href: string; img: string; tag: string; title: string; desc: string }) {
  return (
    <Link href={href} className="relative block rounded-xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900/85" />
      <div className="absolute left-6 right-6 bottom-6 text-white">
        <span className="inline-block bg-brand-orange-500 text-xs font-bold px-2.5 py-1 rounded-full mb-2 tracking-wide">{tag}</span>
        <h3 className="text-2xl font-extrabold mb-1.5">{title}</h3>
        <p className="text-sm opacity-90">{desc}</p>
        <span className="inline-flex items-center gap-1 mt-3 font-bold text-sm text-brand-orange-300">查看物件 →</span>
      </div>
    </Link>
  );
}

function FeatCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white border border-line rounded-xl p-7 hover:shadow-md hover:-translate-y-1 hover:border-brand-green-500 transition">
      <div className="w-14 h-14 rounded-2xl bg-brand-green-50 text-brand-green-700 grid place-items-center text-2xl mb-4">
        {icon}
      </div>
      <h3 className="font-extrabold text-lg mb-2">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
    </div>
  );
}
