import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'servicesPage' });
  return { title: t('metaTitle') };
}

export default async function ServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('servicesPage');
  const lp = (p: string) => (locale === 'zh' ? p : `/${locale}${p}`);

  const features: [string, string, string][] = [
    ['🏠', t('feat1Title'), t('feat1Desc')],
    ['📋', t('feat2Title'), t('feat2Desc')],
    ['🌐', t('feat3Title'), t('feat3Desc')],
    ['🔍', t('feat4Title'), t('feat4Desc')],
    ['💬', t('feat5Title'), t('feat5Desc')],
    ['🛏️', t('feat6Title'), t('feat6Desc')],
    ['🛠️', t('feat7Title'), t('feat7Desc')],
    ['⚡', t('feat8Title'), t('feat8Desc')],
  ];

  return (
    <>
      <Header />
      <main>
        <section className="bg-white border-b border-line">
          <div className="container-page py-12 sm:py-16">
            <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 lg:gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />{t('eyebrow')}</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 mb-4 leading-tight">
                  {t('heroTitleLine1')}<br className="sm:hidden" />{t('heroTitleLine2')}
                </h1>
                <p className="text-ink-700 text-base sm:text-lg leading-relaxed">
                  {t('heroSubtitle')}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/services-hero.webp"
                  alt=""
                  className="w-full h-auto object-cover aspect-[16/9]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="container-page py-14 sm:py-20">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map(([icon, title, desc]) => (
              <div
                key={title}
                className="bg-white border border-line rounded-xl p-7 hover:shadow-md hover:-translate-y-1 hover:border-brand-green-500 transition"
              >
                <div className="w-14 h-14 rounded-2xl bg-brand-green-50 text-brand-green-700 grid place-items-center text-2xl mb-4">
                  {icon}
                </div>
                <h3 className="font-extrabold text-lg mb-2">{title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-brand-green-900 to-brand-green-700 text-white rounded-xl p-10 sm:p-14 text-center">
            <h2 className="text-3xl font-black mb-3">{t('ctaTitle')}</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">{t('ctaSub')}</p>
            <Link href={lp('/contact')} className="btn btn-orange">{t('ctaButton')}</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
