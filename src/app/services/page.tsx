import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import Link from 'next/link';

export const metadata = { title: '服務特色' };

export default function ServicesPage() {
  return (
    <>
      <Header />
      <main className="py-16 sm:py-20">
        <div className="container-page">
          <div className="text-center mb-14">
            <span className="eyebrow"><span className="dot" />OUR SERVICES</span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 mb-3 leading-tight">不只是找房子，更是找一個家</h1>
            <p className="text-ink-500 max-w-2xl mx-auto">
              從第一次帶看到入住後續，鼎立業務團隊以人為本，提供每一位租客最貼心的服務。
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {[
              ['🏠', '專人陪同帶看', '業務親自到場為您解說屋況與周邊機能。'],
              ['📋', '透明合約收費', '所有費用攤開談清楚，不會有額外費用。'],
              ['🌐', '中英日多語服務', '提供翻譯版本合約給外籍租客審閱。'],
              ['🔍', '嚴選真實物件', '每筆物件業務皆親自確認，杜絕假房源。'],
              ['💬', '議價與條件協助', '協助談租金、修繕條款、寵物友善等。'],
              ['🛏️', '需求精準媒合', '聽懂您的真實需求，再嚴選推薦。'],
              ['🛠️', '入住後續支援', '修繕、押金、續約事宜持續協助。'],
              ['⚡', '當日快速回覆', 'LINE、電話、Email 當日內回覆。'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white border border-line rounded-xl p-7 hover:shadow-md hover:-translate-y-1 hover:border-brand-green-500 transition">
                <div className="w-14 h-14 rounded-2xl bg-brand-green-50 text-brand-green-700 grid place-items-center text-2xl mb-4">{icon}</div>
                <h3 className="font-extrabold text-lg mb-2">{title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-brand-green-900 to-brand-green-700 text-white rounded-xl p-10 sm:p-14 text-center">
            <h2 className="text-3xl font-black mb-3">準備開始找房？</h2>
            <p className="text-white/80 max-w-xl mx-auto mb-8">告訴我們您的需求，業務團隊將於當日內聯繫並安排合適物件帶看。</p>
            <Link href="/contact" className="btn btn-orange">聯絡業務專員 →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
