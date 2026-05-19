import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';

export async function generateMetadata() {
  return { title: '房屋修繕' };
}

export default async function RepairsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="bg-paper">
        <section className="container-page flex min-h-[52vh] items-center justify-center py-20 text-center">
          <div>
            <span className="eyebrow">
              <span className="dot" />
              房屋修繕
            </span>
            <h1 className="mt-5 text-4xl font-black text-brand-green-900 sm:text-5xl">
              建置中
            </h1>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
