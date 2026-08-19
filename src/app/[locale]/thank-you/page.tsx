import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import LineFollowCard from '@/components/frontend/LineFollowCard';

export const dynamic = 'force-dynamic';

// 感謝頁只有從表單送出後才會進來，不需要被搜尋引擎收錄
export const metadata: Metadata = {
  title: '送出成功 / Submitted / 送信完了',
  robots: { index: false, follow: false },
};

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const lp = (p: string) => localePath(locale, p);

  return (
    <>
      <Header />
      <main className="py-16 sm:py-20">
        <div className="container-page">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-line p-8 sm:p-10 shadow-sm">
              {/* 感謝頁的主要動作：把詢問導進官方 LINE，由專員接手確認物件 */}
              <LineFollowCard flush />

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Link href={lp('/properties')} className="btn btn-secondary flex-1">
                  繼續看物件 / Browse listings
                </Link>
                <Link href={lp('/')} className="btn btn-secondary flex-1">
                  回首頁 / Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
