import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import Link from 'next/link';

type Props = {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
};

export default function LegalDocument({ title, lastUpdated, children }: Props) {
  return (
    <>
      <Header />
      <main className="bg-paper-2 py-12 sm:py-16">
        <div className="container-page">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-line p-8 sm:p-12">
            <Link href="/" className="text-sm text-ink-500 hover:text-brand-green-700 inline-flex items-center gap-1 mb-6">
              ← 返回首頁
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black mb-3 text-ink-900">{title}</h1>
            <p className="text-sm text-ink-500 mb-10">最後修改日期：{lastUpdated}</p>

            <article className="legal-prose">
              {children}
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
