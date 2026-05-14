import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import MaterialIcon from '@/components/MaterialIcon';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { CAREERS_DEFAULTS, type CareersContent } from '@/data/careers-defaults';
import { translateCmsSection } from '@/lib/cms-translate';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'careersPage' });
  return { title: t('metaTitle') };
}

async function getCareersContent(locale: string): Promise<CareersContent> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'careers' } });
    const data = (row?.data as Partial<CareersContent>) || {};
    const merged: CareersContent = {
      ...CAREERS_DEFAULTS,
      ...data,
      benefits: Array.isArray(data.benefits) && data.benefits.length
        ? data.benefits
        : CAREERS_DEFAULTS.benefits,
      positions: Array.isArray(data.positions) && data.positions.length
        ? data.positions
        : CAREERS_DEFAULTS.positions,
    };
    if (locale === 'zh') return merged;
    const translated = await translateCmsSection(
      'careers',
      merged as unknown as Record<string, unknown>,
      locale
    );
    return { ...merged, ...(translated as Partial<CareersContent>) } as CareersContent;
  } catch {
    return CAREERS_DEFAULTS;
  }
}

function DecoDivider({ tone = 'green' }: { tone?: 'green' | 'orange' }) {
  const color = tone === 'green' ? 'text-brand-green-700' : 'text-brand-orange-500';
  return (
    <div className={`flex items-center justify-center my-12 sm:my-16 ${color}`} aria-hidden="true">
      <svg viewBox="0 0 360 24" className="w-[260px] sm:w-[360px] h-6" fill="none" stroke="currentColor">
        <line x1="0" y1="12" x2="140" y2="12" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="150" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <circle cx="160" cy="12" r="2.2" fill="currentColor" stroke="none" />
        <path d="M180 4 L188 12 L180 20 L172 12 Z" fill="currentColor" stroke="none" />
        <circle cx="200" cy="12" r="2.2" fill="currentColor" stroke="none" />
        <circle cx="210" cy="12" r="1.6" fill="currentColor" stroke="none" />
        <line x1="220" y1="12" x2="360" y2="12" strokeWidth="1" strokeDasharray="2 6" />
      </svg>
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] text-brand-orange-700 uppercase mb-3">
      <span className="w-6 h-px bg-brand-orange-500" />
      {children}
      <span className="w-6 h-px bg-brand-orange-500" />
    </span>
  );
}

const VALUE_PILLARS = [
  { icon: 'workspace_premium', label: '專業' },
  { icon: 'bolt',              label: '高效' },
  { icon: 'lightbulb',         label: '創新' },
  { icon: 'groups',            label: '團隊' },
];

const WLB_HIGHLIGHTS = [
  { icon: 'flight_takeoff', title: '排班出國', desc: '排班彈性安排，想出國也能說走就走。' },
  { icon: 'home_work',      title: '達標 WFH',  desc: '職級達成可選擇遠端工作，自主安排節奏。' },
  { icon: 'restaurant',     title: '月聚餐',    desc: '每月團隊聚餐，工作之外也享受生活的美好。' },
];

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = await getCareersContent(locale);
  const t = await getTranslations('careersPage');
  const jobApplyLink = 'https://www.104.com.tw/company/1a2x6bmkli#info06';

  return (
    <>
      <Header />
      <main className="bg-paper-2">
        {/* HERO */}
        <section className="relative bg-paper-2">
          <div className="relative h-[550px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={c.heroImageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-ink-900/60 via-ink-900/30 to-transparent" />
            <div className="container-page relative z-10 flex h-full items-center">
              <div className="max-w-2xl pt-6">
                <span className="eyebrow bg-paper/90"><span className="dot" />JOIN UR HOUSE</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5 text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]">
                  在 UR HOUSE，<br />
                  <span className="text-brand-orange-300 relative inline-block">
                    開啟你的不動產職涯
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-green-900/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-paper/95 max-w-xl drop-shadow-[0_1px_12px_rgba(26,36,33,0.35)]">
                  專業培訓、科技平台、Tier 1 高端品牌，加上美式 Work Life Balance，
                  在這裡你能把不動產做成一輩子的事業。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 — 企業理念 */}
        <section className="container-page pt-16 sm:pt-24">
          <div className="text-center max-w-3xl mx-auto">
            <SectionEyebrow>OUR PHILOSOPHY</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              UR HOUSE <span className="text-brand-green-700">企業理念</span>
            </h2>
            <p className="text-ink-500 leading-relaxed">
              打造台灣首選的頂級不動產品牌，從專業、高效、創新、團隊四個價值出發，
              快速而準確地滿足每一位客戶的需求。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <div className="relative rounded-2xl bg-white border border-line p-7 sm:p-8 shadow-sm overflow-hidden">
              <span className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand-green-50" />
              <div className="relative">
                <span className="inline-flex w-12 h-12 rounded-xl bg-brand-green-700 text-white items-center justify-center mb-4">
                  <MaterialIcon name="visibility" className="!text-2xl" />
                </span>
                <h3 className="text-xl font-extrabold mb-2">我們的願景</h3>
                <p className="text-ink-700 leading-relaxed">
                  成為<span className="font-bold text-brand-green-900">台灣首選的頂級不動產品牌</span>，
                  讓每一次居住與投資的選擇，都是值得驕傲的決定。
                </p>
              </div>
            </div>

            <div className="relative rounded-2xl bg-white border border-line p-7 sm:p-8 shadow-sm overflow-hidden">
              <span className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand-orange-50" />
              <div className="relative">
                <span className="inline-flex w-12 h-12 rounded-xl bg-brand-orange-500 text-white items-center justify-center mb-4">
                  <MaterialIcon name="rocket_launch" className="!text-2xl" />
                </span>
                <h3 className="text-xl font-extrabold mb-2">我們的使命</h3>
                <p className="text-ink-700 leading-relaxed">
                  提供<span className="font-bold text-brand-orange-700">專業的租賃買賣顧問服務</span>，
                  以速度與精準，回應客戶從找屋、議價到成交的每一個需求。
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 text-white p-7 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-brand-orange-300 mb-2">CORE VALUES</p>
                <h3 className="text-2xl sm:text-3xl font-black">UR HOUSE 核心價值</h3>
              </div>
              <div className="grid grid-cols-4 gap-3 sm:gap-6">
                {VALUE_PILLARS.map((v) => (
                  <div key={v.label} className="flex flex-col items-center text-center">
                    <span className="inline-flex w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/15 items-center justify-center mb-2">
                      <MaterialIcon name={v.icon} className="!text-2xl sm:!text-3xl text-brand-orange-300" />
                    </span>
                    <span className="font-bold text-sm sm:text-base">{v.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="container-page"><DecoDivider /></div>

        {/* SECTION 2 — 專業培訓 + agent.webp */}
        <section className="container-page">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="order-2 md:order-1">
              <SectionEyebrow>TRAINING & SUPPORT</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-tight">
                專業培訓！<br />
                <span className="text-brand-green-700">UR HOUSE 就是你的最佳後援</span>
              </h2>
              <p className="text-ink-700 leading-relaxed mb-6">
                無論是新手還是經驗豐富的不動產專業人士，我們都提供
                <span className="font-bold text-brand-green-900">專業培訓、最新產業資訊與持續支援</span>。
                想走管理職位、或在專業職位深耕，我們都能為你規劃發展與成長的路徑。
              </p>
              <ul className="space-y-3">
                {[
                  '一對一師徒制，新人三個月內快速上手',
                  '每月內訓 + 外部講師：法規、議價、商圈分析',
                  '雙職涯軌道：專業顧問 / 管理階層自由選擇',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex w-5 h-5 rounded-full bg-brand-green-50 text-brand-green-700 items-center justify-center shrink-0">
                      <MaterialIcon name="check" className="!text-base" />
                    </span>
                    <span className="text-ink-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 md:order-2 relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-2xl bg-brand-orange-300/40 -z-10" aria-hidden="true" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-brand-green-50 -z-10" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/careers/agent.webp"
                alt="UR HOUSE 業務員專業形象"
                className="relative w-full aspect-[3/4] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </section>

        <div className="container-page"><DecoDivider tone="orange" /></div>

        {/* SECTION 3 — 科技化平台高薪 */}
        <section className="container-page">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <SectionEyebrow>TECH × HIGH INCOME</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              科技化平台，<span className="text-brand-orange-700">助你邁向高薪</span>
            </h2>
            <p className="text-ink-700 leading-relaxed">
              憑藉超過 10 年的客戶資源累積與高效作業管理系統，平台提供比一般租賃買賣業更完整的資訊，
              讓你大幅減少行政流程、專注於成交。
              <span className="font-bold text-brand-green-900">肯做、聰明的做，就會成功！</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="relative rounded-2xl bg-white border border-line p-8 shadow-sm overflow-hidden">
              <p className="text-xs font-bold tracking-[0.2em] text-brand-green-700 mb-2">起步年收入</p>
              <p className="text-5xl sm:text-6xl font-black text-brand-green-900 leading-none mb-2">
                60<span className="text-2xl sm:text-3xl ml-1">萬+</span>
              </p>
              <p className="text-ink-500 text-sm">在 UR HOUSE，業務年收入至少可達 60 萬。</p>
              <span className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-brand-green-50 -z-0" />
            </div>
            <div className="relative rounded-2xl bg-gradient-to-br from-brand-orange-500 to-brand-orange-700 text-white p-8 shadow-md overflow-hidden">
              <p className="text-xs font-bold tracking-[0.2em] text-brand-orange-300 mb-2">頂尖業務</p>
              <p className="text-5xl sm:text-6xl font-black leading-none mb-2">
                300<span className="text-2xl sm:text-3xl ml-1">萬+</span>
              </p>
              <p className="text-white/85 text-sm">努力 + 方法，更有機會突破年收 300 萬。</p>
              <span className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/15 -z-0" />
            </div>
          </div>

          <p className="text-center text-ink-500 mt-8 italic">
            「這是一個你可以實現夢想的地方。」
          </p>
        </section>

        <div className="container-page"><DecoDivider /></div>

        {/* SECTION 4 — Tier 1 高端外商 + owner.webp */}
        <section className="container-page">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-28 h-28 rounded-2xl bg-brand-green-50 -z-10" aria-hidden="true" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-brand-orange-300/40 -z-10" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/careers/owner.webp"
                alt="UR HOUSE 與業主豪宅成交握手"
                className="relative w-full aspect-[4/3] object-cover rounded-2xl shadow-lg"
              />
              <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 text-brand-green-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                <MaterialIcon name="workspace_premium" className="!text-base text-brand-orange-500" />
                Tier 1 Brand
              </span>
            </div>

            <div>
              <SectionEyebrow>TIER 1 BRAND</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-tight">
                高端外商租賃買賣<br />
                <span className="text-brand-green-700">業界的翹楚</span>
              </h2>
              <p className="text-ink-700 leading-relaxed mb-6">
                UR HOUSE 在行業內擁有 <span className="font-bold text-brand-green-900">Tier 1 的品牌形象與聲譽</span>。
                無論你想從事豪宅、高級商辦，還是台北精華地帶的店面租賃買賣，
                我們都與頂級高端客戶緊密合作，為你提供最好的發展機會。
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: 'apartment',     label: '豪宅' },
                  { icon: 'business',      label: '高級商辦' },
                  { icon: 'storefront',    label: '精華店面' },
                ].map((it) => (
                  <div key={it.label} className="rounded-xl bg-white border border-line p-4 text-center">
                    <MaterialIcon name={it.icon} className="!text-2xl text-brand-green-700 mb-1" />
                    <p className="text-sm font-bold text-ink-700">{it.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="container-page"><DecoDivider tone="orange" /></div>

        {/* SECTION 5 — Work Life Balance */}
        <section className="container-page pb-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <SectionEyebrow>WORK · LIFE · BALANCE</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              美式的 <span className="text-brand-orange-700">Work Life Balance</span>
            </h2>
            <p className="text-ink-700 leading-relaxed">
              與傳統不動產業不同，我們重視工作與生活的平衡，讓你長久走、走得遠。
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {WLB_HIGHLIGHTS.map((it) => (
              <div
                key={it.title}
                className="relative bg-white rounded-2xl border border-line p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
              >
                <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand-green-50" />
                <div className="relative">
                  <span className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 text-white items-center justify-center mb-4">
                    <MaterialIcon name={it.icon} className="!text-3xl" />
                  </span>
                  <h3 className="text-lg font-extrabold mb-2">{it.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed">{it.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="container-page py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-green-900 via-brand-green-700 to-brand-green-900 text-white p-10 sm:p-14 text-center">
            <span className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-brand-orange-500/20" />
            <span className="absolute -bottom-16 -right-12 w-60 h-60 rounded-full bg-brand-orange-300/15" />
            <div className="relative">
              <SectionEyebrow>JOIN US</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">準備好加入 UR HOUSE 了嗎？</h2>
              <p className="text-white/85 max-w-xl mx-auto mb-8">
                所有最新職缺、薪資範圍與應徵流程，皆於 104 人力銀行同步更新。
              </p>
              <a
                href={jobApplyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-700 text-white font-bold px-8 py-4 rounded-full shadow-lg transition"
              >
                <MaterialIcon name="north_east" className="!text-xl" />
                {t('goTo104')}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
