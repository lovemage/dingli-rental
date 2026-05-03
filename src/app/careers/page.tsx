import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import Link from 'next/link';

export const metadata = { title: '人才招募' };

const POSITIONS = [
  {
    title: '租賃業務專員',
    type: '全職',
    region: '台北・新北・桃園',
    salary: 'NT$ 35K - 80K（含獎金）',
    desc: '負責物件帶看、需求媒合、合約議價與後續服務。',
    requirements: ['具良好溝通能力', '熱愛與人互動', '有業務經驗者佳', '熟悉北北基桃地區尤佳'],
  },
  {
    title: '商用物件業務經理',
    type: '全職',
    region: '台北・新北',
    salary: 'NT$ 50K - 120K（含獎金）',
    desc: '專責辦公與店面物件，從商圈分析、租金行情到合約風險評估。',
    requirements: ['3 年以上商用物件經驗', '熟悉商圈與企業承租流程', '具備合約風險判讀能力'],
  },
  {
    title: '物件編輯助理',
    type: '兼職／全職',
    region: '台北',
    salary: 'NT$ 28K - 38K',
    desc: '負責物件資料整理、照片美化、文字撰寫與前後台維護。',
    requirements: ['細心、文字流暢', '具備基本影像處理能力', '可使用後台系統管理物件'],
  },
];

export default function CareersPage() {
  return (
    <>
      <Header />
      <main className="py-16 sm:py-20 bg-paper-2">
        <div className="container-page">
          <div className="text-center mb-14">
            <span className="eyebrow"><span className="dot" />JOIN US</span>
            <h1 className="text-3xl sm:text-4xl font-black mt-3 mb-3 leading-tight">加入鼎立，<br className="sm:hidden" />一起把租屋這件事做好</h1>
            <p className="text-ink-500 max-w-2xl mx-auto">
              我們相信好的租屋體驗從業務的態度開始。如果您熱愛與人互動、認同誠信透明的價值，歡迎加入鼎立團隊。
            </p>
          </div>

          {/* 福利 */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {[
              ['💰', '高底薪 + 獎金', '保障底薪外加成交獎金，努力就有回報'],
              ['📚', '完整教育訓練', '新進業務一對一帶領，快速上手'],
              ['🌴', '彈性休假', '排班彈性，輪休制不打卡'],
              ['🏥', '完善保險', '勞健保與團保，安心工作'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="bg-white rounded-xl p-6 border border-line">
                <div className="text-3xl mb-2">{icon}</div>
                <h3 className="font-bold mb-1">{title}</h3>
                <p className="text-sm text-ink-500">{desc}</p>
              </div>
            ))}
          </div>

          {/* 職缺 */}
          <h2 className="text-2xl font-black mb-6">職缺資訊</h2>
          <div className="space-y-4 mb-14">
            {POSITIONS.map((p) => (
              <div key={p.title} className="bg-white rounded-xl border border-line p-6 sm:p-8 hover:shadow-md transition">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold mb-1">{p.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-brand-green-50 text-brand-green-900 px-2.5 py-1 rounded-full font-bold">{p.type}</span>
                      <span className="text-xs bg-paper-2 text-ink-700 px-2.5 py-1 rounded-full font-bold">{p.region}</span>
                    </div>
                  </div>
                  <p className="text-brand-orange-700 font-bold">{p.salary}</p>
                </div>
                <p className="text-ink-700 mb-3">{p.desc}</p>
                <ul className="text-sm text-ink-500 space-y-1">
                  {p.requirements.map((r) => (
                    <li key={r}>✓ {r}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white border border-line rounded-xl p-10 text-center">
            <h2 className="text-2xl font-black mb-2">投遞履歷</h2>
            <p className="text-ink-500 mb-6">請將履歷寄至 <a href="mailto:hr@dingli-rental.com" className="text-brand-green-700 underline">hr@dingli-rental.com</a>，主旨註明「應徵職缺名稱」。</p>
            <Link href="/contact" className="btn btn-primary">或透過聯絡表單 →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
