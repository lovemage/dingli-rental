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
      valuePillars: Array.isArray(data.valuePillars) && data.valuePillars.length
        ? data.valuePillars
        : CAREERS_DEFAULTS.valuePillars,
      trainingPoints: Array.isArray(data.trainingPoints) && data.trainingPoints.length
        ? data.trainingPoints
        : CAREERS_DEFAULTS.trainingPoints,
      incomeStats: Array.isArray(data.incomeStats) && data.incomeStats.length
        ? data.incomeStats
        : CAREERS_DEFAULTS.incomeStats,
      tier1Categories: Array.isArray(data.tier1Categories) && data.tier1Categories.length
        ? data.tier1Categories
        : CAREERS_DEFAULTS.tier1Categories,
      wlbHighlights: Array.isArray(data.wlbHighlights) && data.wlbHighlights.length
        ? data.wlbHighlights
        : CAREERS_DEFAULTS.wlbHighlights,
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

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = await getCareersContent(locale);

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
                <span className="eyebrow bg-paper/90"><span className="dot" />{c.eyebrow}</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5 text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]">
                  {c.titleLine1}<br />
                  <span className="text-brand-orange-300 relative inline-block">
                    {c.titleLine2}
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-green-900/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-paper/95 max-w-xl whitespace-pre-line drop-shadow-[0_1px_12px_rgba(26,36,33,0.35)]">
                  {c.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1 — 企業理念 */}
        <section className="container-page pt-16 sm:pt-24">
          <div className="text-center max-w-3xl mx-auto">
            <SectionEyebrow>{c.philosophyEyebrow}</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              {c.philosophyTitleBrand} <span className="text-brand-green-700">{c.philosophyTitleSuffix}</span>
            </h2>
            <p className="text-ink-500 leading-relaxed whitespace-pre-line">{c.philosophyIntro}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mt-10">
            <div className="relative rounded-2xl bg-white border border-line p-7 sm:p-8 shadow-sm overflow-hidden">
              <span className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand-green-50" />
              <div className="relative">
                <span className="inline-flex w-12 h-12 rounded-xl bg-brand-green-700 text-white items-center justify-center mb-4">
                  <MaterialIcon name="visibility" className="!text-2xl" />
                </span>
                <h3 className="text-xl font-extrabold mb-2">{c.visionTitle}</h3>
                <p className="text-ink-700 leading-relaxed whitespace-pre-line">{c.visionDesc}</p>
              </div>
            </div>

            <div className="relative rounded-2xl bg-white border border-line p-7 sm:p-8 shadow-sm overflow-hidden">
              <span className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-brand-orange-50" />
              <div className="relative">
                <span className="inline-flex w-12 h-12 rounded-xl bg-brand-orange-500 text-white items-center justify-center mb-4">
                  <MaterialIcon name="rocket_launch" className="!text-2xl" />
                </span>
                <h3 className="text-xl font-extrabold mb-2">{c.missionTitle}</h3>
                <p className="text-ink-700 leading-relaxed whitespace-pre-line">{c.missionDesc}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 text-white p-7 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <p className="text-xs font-bold tracking-[0.2em] text-brand-orange-300 mb-2">{c.coreValuesEyebrow}</p>
                <h3 className="text-2xl sm:text-3xl font-black">{c.coreValuesTitle}</h3>
              </div>
              <div className={`grid gap-3 sm:gap-6 grid-cols-${Math.min(Math.max(c.valuePillars.length, 1), 4)}`}
                   style={{ gridTemplateColumns: `repeat(${Math.max(c.valuePillars.length, 1)}, minmax(0, 1fr))` }}>
                {c.valuePillars.map((v, i) => (
                  <div key={`${v.label}-${i}`} className="flex flex-col items-center text-center">
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

        {/* SECTION 2 — 專業培訓 */}
        <section className="container-page">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="order-2 md:order-1">
              <SectionEyebrow>{c.trainingEyebrow}</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-tight">
                {c.trainingTitleLine1}<br />
                <span className="text-brand-green-700">{c.trainingTitleLine2}</span>
              </h2>
              <p className="text-ink-700 leading-relaxed mb-6 whitespace-pre-line">{c.trainingDesc}</p>
              <ul className="space-y-3">
                {c.trainingPoints.map((p, i) => (
                  <li key={`${i}-${p.text}`} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex w-5 h-5 rounded-full bg-brand-green-50 text-brand-green-700 items-center justify-center shrink-0">
                      <MaterialIcon name="check" className="!text-base" />
                    </span>
                    <span className="text-ink-700">{p.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 md:order-2 relative">
              <div className="absolute -top-4 -left-4 w-24 h-24 rounded-2xl bg-brand-orange-300/40 -z-10" aria-hidden="true" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl bg-brand-green-50 -z-10" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.trainingImageUrl}
                alt={c.trainingImageAlt}
                className="relative w-full aspect-[3/4] object-cover rounded-2xl shadow-lg"
              />
            </div>
          </div>
        </section>

        <div className="container-page"><DecoDivider tone="orange" /></div>

        {/* SECTION 3 — 科技平台高薪 */}
        <section className="container-page">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <SectionEyebrow>{c.incomeEyebrow}</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              {c.incomeTitleLine}<span className="text-brand-orange-700">{c.incomeTitleHighlight}</span>
            </h2>
            <p className="text-ink-700 leading-relaxed whitespace-pre-line">{c.incomeIntro}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {c.incomeStats.map((s, i) => {
              const isAccent = i % 2 === 1;
              return (
                <div
                  key={`${i}-${s.label}`}
                  className={`relative rounded-2xl border p-8 shadow-sm overflow-hidden ${
                    isAccent
                      ? 'bg-gradient-to-br from-brand-orange-500 to-brand-orange-700 text-white border-transparent shadow-md'
                      : 'bg-white border-line'
                  }`}
                >
                  <p className={`text-xs font-bold tracking-[0.2em] mb-2 ${isAccent ? 'text-brand-orange-300' : 'text-brand-green-700'}`}>
                    {s.label}
                  </p>
                  <p className={`text-5xl sm:text-6xl font-black leading-none mb-2 ${isAccent ? '' : 'text-brand-green-900'}`}>
                    {s.number}<span className="text-2xl sm:text-3xl ml-1">{s.suffix}</span>
                  </p>
                  <p className={`text-sm ${isAccent ? 'text-white/85' : 'text-ink-500'}`}>{s.note}</p>
                  <span className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full ${isAccent ? 'bg-white/15' : 'bg-brand-green-50'}`} />
                </div>
              );
            })}
          </div>

          {c.incomeQuote && (
            <p className="text-center text-ink-500 mt-8 italic whitespace-pre-line">{c.incomeQuote}</p>
          )}
        </section>

        <div className="container-page"><DecoDivider /></div>

        {/* SECTION 4 — Tier 1 */}
        <section className="container-page">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-14 items-center">
            <div className="relative">
              <div className="absolute -top-4 -right-4 w-28 h-28 rounded-2xl bg-brand-green-50 -z-10" aria-hidden="true" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 rounded-2xl bg-brand-orange-300/40 -z-10" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.tier1ImageUrl}
                alt={c.tier1ImageAlt}
                className="relative w-full aspect-[4/3] object-cover rounded-2xl shadow-lg"
              />
              {c.tier1Badge && (
                <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/95 text-brand-green-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                  <MaterialIcon name="workspace_premium" className="!text-base text-brand-orange-500" />
                  {c.tier1Badge}
                </span>
              )}
            </div>

            <div>
              <SectionEyebrow>{c.tier1Eyebrow}</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5 leading-tight">
                {c.tier1TitleLine1}<br />
                <span className="text-brand-green-700">{c.tier1TitleLine2}</span>
              </h2>
              <p className="text-ink-700 leading-relaxed mb-6 whitespace-pre-line">{c.tier1Desc}</p>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: `repeat(${Math.max(c.tier1Categories.length, 1)}, minmax(0, 1fr))` }}
              >
                {c.tier1Categories.map((it, i) => (
                  <div key={`${i}-${it.label}`} className="rounded-xl bg-white border border-line p-4 text-center">
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
            <SectionEyebrow>{c.wlbEyebrow}</SectionEyebrow>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              {c.wlbTitleLine} <span className="text-brand-orange-700">{c.wlbTitleHighlight}</span>
            </h2>
            <p className="text-ink-700 leading-relaxed whitespace-pre-line">{c.wlbIntro}</p>
          </div>

          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(c.wlbHighlights.length, 1), 3)}, minmax(0, 1fr))` }}
          >
            {c.wlbHighlights.map((it, i) => (
              <div
                key={`${i}-${it.title}`}
                className="relative bg-white rounded-2xl border border-line p-7 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
              >
                <span className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand-green-50" />
                <div className="relative">
                  <span className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 text-white items-center justify-center mb-4">
                    <MaterialIcon name={it.icon} className="!text-3xl" />
                  </span>
                  <h3 className="text-lg font-extrabold mb-2">{it.title}</h3>
                  <p className="text-sm text-ink-500 leading-relaxed whitespace-pre-line">{it.desc}</p>
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
              <SectionEyebrow>{c.ctaEyebrow}</SectionEyebrow>
              <h2 className="text-3xl sm:text-4xl font-black mb-4">{c.ctaTitle}</h2>
              <p className="text-white/85 max-w-xl mx-auto mb-8 whitespace-pre-line">{c.ctaDesc}</p>
              <a
                href={c.ctaButtonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-brand-orange-500 hover:bg-brand-orange-700 text-white font-bold px-8 py-4 rounded-full shadow-lg transition"
              >
                <MaterialIcon name="north_east" className="!text-xl" />
                {c.ctaButtonText}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
