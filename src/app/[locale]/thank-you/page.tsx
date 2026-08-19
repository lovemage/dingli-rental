import type { Metadata } from 'next';
import Link from 'next/link';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import LineFollowCard from '@/components/frontend/LineFollowCard';
import { getContactContent } from '@/lib/contact-content';

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

  const c = await getContactContent(locale);
  const lp = (p: string) => localePath(locale, p);

  return (
    <>
      <Header />
      <main className="py-16 sm:py-20">
        <div className="container-page">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-line p-8 sm:p-10 shadow-sm">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-brand-green-50 grid place-items-center text-brand-green-700 text-2xl font-black mb-4">
                  ✓
                </div>
                {/* 送出後的標題固定中／英／日並列，外籍客戶沒切語系也能讀懂下一步 */}
                <h1 className="text-xl font-black mb-2">送出成功 / Submitted / 送信完了</h1>
                <p className="text-ink-700">{c.formSuccessMessage}</p>
              </div>

              {/* 感謝頁的主要動作：把詢問導進官方 LINE，由專員接手確認物件 */}
              <LineFollowCard />

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
