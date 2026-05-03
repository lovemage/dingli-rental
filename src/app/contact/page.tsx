import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import ContactForm from '@/components/frontend/ContactForm';

export const metadata = { title: '聯絡我們' };

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="py-16 sm:py-20">
        <div className="container-page">
          <div className="text-center mb-14">
            <span className="eyebrow"><span className="dot" />CONTACT US</span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 mb-3 leading-tight">告訴我們您的需求</h1>
            <p className="text-ink-500 max-w-2xl mx-auto">
              業務團隊將於當日內聯繫您，安排合適的物件帶看與諮詢。
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-10 max-w-5xl mx-auto">
            {/* 業務團隊 */}
            <div className="space-y-5">
              <h2 className="text-xl font-black mb-2">租賃業務團隊</h2>

              <div className="bg-white rounded-xl border border-line p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-green-700 to-brand-green-900 grid place-items-center text-3xl font-black text-white">楊</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-extrabold">楊小姐</h3>
                    <p className="text-sm text-brand-orange-700 font-bold mb-3">資深租賃業務專員</p>
                    <ul className="text-sm text-ink-700 space-y-1 mb-4">
                      <li>✓ 專責住宅與電梯套房，台北・新北 10+ 年經驗</li>
                      <li>✓ 中・英・日多語溝通服務</li>
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <a href="tel:+886912000111" className="bg-brand-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">📞 0912-000-111</a>
                      <a href="#" className="bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-300 text-xs font-bold px-3 py-1.5 rounded-full">💬 LINE</a>
                      <a href="mailto:yang@dingli-rental.com" className="bg-paper-2 text-ink-700 border border-line text-xs font-bold px-3 py-1.5 rounded-full">✉ Email</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-line p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-orange-500 to-brand-orange-700 grid place-items-center text-3xl font-black text-white">曹</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-extrabold">曹先生</h3>
                    <p className="text-sm text-brand-orange-700 font-bold mb-3">商用物件業務經理</p>
                    <ul className="text-sm text-ink-700 space-y-1 mb-4">
                      <li>✓ 專責辦公大樓與店面物件</li>
                      <li>✓ 商圈分析、租金行情與合約風險評估</li>
                    </ul>
                    <div className="flex flex-wrap gap-2">
                      <a href="tel:+886933000222" className="bg-brand-green-700 text-white text-xs font-bold px-3 py-1.5 rounded-full">📞 0933-000-222</a>
                      <a href="#" className="bg-brand-orange-50 text-brand-orange-700 border border-brand-orange-300 text-xs font-bold px-3 py-1.5 rounded-full">💬 LINE</a>
                      <a href="mailto:tsao@dingli-rental.com" className="bg-paper-2 text-ink-700 border border-line text-xs font-bold px-3 py-1.5 rounded-full">✉ Email</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-paper-2 rounded-xl p-5 text-sm text-ink-700">
                <h4 className="font-bold mb-2">公司資訊</h4>
                <p>客服信箱：service@dingli-rental.com</p>
                <p>客服專線：0800-000-000</p>
                <p>服務時間：週一至週日 09:00 - 21:00</p>
                <p>服務範圍：北北基桃竹</p>
              </div>
            </div>

            <ContactForm />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
