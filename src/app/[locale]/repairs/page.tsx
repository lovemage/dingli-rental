import { setRequestLocale } from 'next-intl/server';
import Link from 'next/link';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import RepairContactForm from '@/components/frontend/RepairContactForm';

export async function generateMetadata() {
  return {
    title: '房屋修繕裝潢',
    description: '鼎立協助屋主處理租前整理、修繕監工、裝潢溝通與完工驗收，讓物件更快、更安心地進入出租流程。',
  };
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
        <section className="relative bg-paper-2">
          <div className="relative h-[550px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/repairs/repairs-hero.webp"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 z-[1] bg-ink-900/25" />
            <div className="container-page relative z-10 flex h-full items-center">
              <div className="max-w-2xl pt-6">
                <span className="eyebrow bg-paper/90"><span className="dot" />房屋修繕裝潢</span>
                <h1 className="my-5 text-4xl font-black leading-tight text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)] md:text-5xl lg:text-[56px]">
                  租前整理到完工驗收，<br />
                  <span className="relative inline-block text-brand-orange-300">
                    鼎立幫您盯好細節
                    <span className="absolute bottom-1 left-0 right-0 -z-10 h-3.5 rounded bg-brand-green-900/55" />
                  </span>
                </h1>
                <p className="max-w-xl whitespace-pre-line text-lg text-paper/95 drop-shadow-[0_1px_12px_rgba(26,36,33,0.35)]">
                  從漏水、油漆、清潔、設備汰換到簡易裝潢，我們協助屋主評估需求、安排廠商、追蹤進度，讓房子用更好的狀態交到租客手上。
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#repair-contact" className="btn btn-primary">
                    建立修繕聯絡表單
                  </a>
                  <Link href={locale === 'zh' ? '/contact' : `/${locale}/contact`} className="btn btn-secondary bg-white/95">
                    先與專人討論
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <span className="eyebrow"><span className="dot" />服務流程</span>
              <h2 className="mt-4 text-3xl font-black text-brand-green-900 sm:text-4xl">
                不是只找工班，而是把出租前的問題一次整理清楚
              </h2>
              <p className="mt-5 text-ink-600 leading-8">
                很多物件不是不好租，而是照片前的修補、清潔、設備與動線沒有整理好。鼎立會先站在「未來租客實際使用」的角度檢查屋況，再和屋主討論哪些該修、哪些可先保留，避免花冤枉錢。
              </p>
              <div className="mt-8 grid gap-3">
                {[
                  ['01', '現場檢查', '確認牆面、地板、水電、衛浴、廚房、設備與安全疑慮。'],
                  ['02', '需求與預算整理', '依出租定位分成必修項目、加分項目與可延後項目。'],
                  ['03', '廠商溝通與監工', '協助安排工程、追蹤進度，降低屋主來回溝通成本。'],
                  ['04', '完工驗收與上架', '確認修繕成果、拍攝上架素材，銜接出租流程。'],
                ].map(([step, title, desc]) => (
                  <div key={step} className="grid grid-cols-[48px_1fr] gap-4 rounded-lg border border-line bg-white p-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-green-700 text-sm font-black text-white">{step}</span>
                    <div>
                      <h3 className="font-extrabold text-ink-900">{title}</h3>
                      <p className="mt-1 text-sm leading-6 text-ink-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/repairs/repairs-supervision.webp"
                alt="鼎立業務與工程人員確認修繕進度"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section className="bg-paper-2 py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="order-2 overflow-hidden rounded-xl border border-line bg-white shadow-sm lg:order-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/repairs/repairs-consultation.webp"
                alt="屋主與鼎立業務討論修繕與裝潢配置"
                className="aspect-[4/3] h-full w-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <span className="eyebrow"><span className="dot" />適合情境</span>
              <h2 className="mt-4 text-3xl font-black text-brand-green-900 sm:text-4xl">
                讓物件更好租，也讓後續管理更省心
              </h2>
              <div className="mt-6 grid gap-4">
                {[
                  ['租前整理', '油漆修補、深度清潔、燈具與小五金更新，讓照片與帶看第一印象更好。'],
                  ['設備修繕', '冷氣、熱水器、衛浴、廚具與排水問題，先處理再出租，減少入住後報修。'],
                  ['簡易裝潢', '依租客族群調整收納、照明、牆面與地板，不過度裝修，把錢花在有效位置。'],
                  ['屋主協調', '不在台灣或工作繁忙的屋主，可由鼎立協助現場回報、照片紀錄與進度追蹤。'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-lg border border-line bg-white p-5">
                    <h3 className="font-extrabold text-ink-900">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-ink-500">{desc}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#repair-contact" className="btn btn-primary">
                  建立修繕聯絡表單
                </a>
                <Link href={locale === 'zh' ? '/properties' : `/${locale}/properties`} className="btn btn-secondary">
                  查看出租物件
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="repair-contact" className="py-20">
          <div className="container-page grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <span className="eyebrow"><span className="dot" />聯絡鼎立</span>
              <h2 className="mt-4 text-3xl font-black text-brand-green-900 sm:text-4xl">
                先留下房屋所在地與聯絡方式
              </h2>
              <p className="mt-5 text-ink-600 leading-8">
                不確定要先修哪裡也沒關係。鼎立會先了解房屋位置、目前狀況與出租計畫，再協助安排後續檢查與廠商溝通。
              </p>
            </div>
            <RepairContactForm />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
