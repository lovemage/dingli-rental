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
        {/* HERO — 樣式對齊首頁：full-bleed 主圖、固定 550px 高、20% 遮罩、白色文字 */}
        <section className="relative bg-paper-2">
          <div className="relative h-[550px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/services-hero.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-[1] bg-ink-900/20" />
            <div className="container-page relative z-10 flex h-full items-center">
              <div className="max-w-2xl pt-6">
                <span className="eyebrow bg-paper/90"><span className="dot" />{t('eyebrow')}</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5 text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]">
                  {t('heroTitleLine1')}<br />
                  <span className="text-brand-orange-300 relative inline-block">
                    {t('heroTitleLine2')}
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-green-900/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-paper/95 max-w-xl whitespace-pre-line drop-shadow-[0_1px_12px_rgba(26,36,33,0.35)]">
                  {t('heroSubtitle')}
                </p>
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
