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

export default async function CareersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const c = await getCareersContent(locale);
  const t = await getTranslations('careersPage');

  return (
    <>
      <Header />
      <main className="bg-paper-2">
        <section className="bg-white border-b border-line">
          <div className="container-page py-12 sm:py-16">
            <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 lg:gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />{c.eyebrow}</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 mb-4 leading-tight">
                  {c.titleLine1}<br className="sm:hidden" />{c.titleLine2}
                </h1>
                <p className="text-ink-700 text-base sm:text-lg leading-relaxed">{c.description}</p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.heroImageUrl} alt="" className="w-full h-auto object-cover aspect-[16/9]" />
              </div>
            </div>
          </div>
        </section>

        <div className="container-page py-14 sm:py-20">
          <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center">{c.benefitsTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {c.benefits.map((b, i) => (
              <div
                key={`${b.title}-${i}`}
                className="bg-white rounded-xl p-6 border border-line hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-green-50 grid place-items-center mb-3">
                  <MaterialIcon name={b.icon} className="!text-3xl text-brand-green-700" />
                </div>
                <h3 className="font-bold mb-1">{b.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black mb-6">{c.positionsTitle}</h2>
          <div className="mb-16 rounded-xl border border-line bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-green-50">
              <MaterialIcon name="work_off" className="!text-3xl text-brand-green-700" />
            </div>
            <h3 className="text-xl font-extrabold mb-2">{t('positionsClosedTitle')}</h3>
            <p className="mx-auto max-w-xl text-ink-500">{t('positionsClosedDesc')}</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
