import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

type Props = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export default async function LegalDocument({ title, lastUpdated, children }: Props) {
  const t = await getTranslations('legal');
  const locale = await getLocale();
  const homeLink = locale === 'zh' ? '/' : `/${locale}`;
  const isNonChinese = locale !== 'zh';

  return (
    <>
      <Header />
      <main className="bg-paper-2 py-12 sm:py-16">
        <div className="container-page">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-line p-8 sm:p-12">
            <Link
              href={homeLink}
              className="text-sm text-ink-500 hover:text-brand-green-700 inline-flex items-center gap-1 mb-6"
            >
              {t('backHome')}
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black mb-3 text-ink-900">{title}</h1>
            <p className="text-sm text-ink-500 mb-6">
              {t('lastUpdated', { date: lastUpdated })}
            </p>

            {isNonChinese && (
              <div className="mb-8 rounded-xl bg-brand-orange-50 border border-brand-orange-300 px-4 py-3 text-sm text-ink-700">
                {t('zhOnlyNotice')}
              </div>
            )}

            <article className="legal-prose">{children}</article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
