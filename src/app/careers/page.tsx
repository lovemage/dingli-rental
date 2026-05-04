import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import Link from 'next/link';
import MaterialIcon from '@/components/MaterialIcon';
import { prisma } from '@/lib/prisma';
import { CAREERS_DEFAULTS, type CareersContent } from '@/data/careers-defaults';

export const dynamic = 'force-dynamic';
export const metadata = { title: '人才招募' };

async function getCareersContent(): Promise<CareersContent> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'careers' } });
    const data = (row?.data as Partial<CareersContent>) || {};
    return {
      ...CAREERS_DEFAULTS,
      ...data,
      benefits: Array.isArray(data.benefits) && data.benefits.length
        ? data.benefits
        : CAREERS_DEFAULTS.benefits,
      positions: Array.isArray(data.positions) && data.positions.length
        ? data.positions
        : CAREERS_DEFAULTS.positions,
    };
  } catch {
    return CAREERS_DEFAULTS;
  }
}

export default async function CareersPage() {
  const c = await getCareersContent();

  return (
    <>
      <Header />
      <main className="bg-paper-2">
        {/* === Hero === */}
        <section className="bg-white border-b border-line">
          <div className="container-page py-12 sm:py-16">
            <div className="grid lg:grid-cols-[1.1fr_1.4fr] gap-8 lg:gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />{c.eyebrow}</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black mt-3 mb-4 leading-tight">
                  {c.titleLine1}<br className="sm:hidden" />{c.titleLine2}
                </h1>
                <p className="text-ink-700 text-base sm:text-lg leading-relaxed">
                  {c.description}
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-sm border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.heroImageUrl}
                  alt="鼎立租售管理 團隊"
                  className="w-full h-auto object-cover aspect-[16/9]"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="container-page py-14 sm:py-20">
          {/* === 福利 === */}
          <h2 className="text-2xl sm:text-3xl font-black mb-6 text-center">{c.benefitsTitle}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {c.benefits.map((b, i) => (
              <div
                key={`${b.title}-${i}`}
                className="bg-white rounded-xl p-6 border border-line hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-lg bg-brand-green-50 grid place-items-center mb-3">
                  <MaterialIcon name={b.icon} className="!text-3xl text-brand-green-700" />
                </div>
                <h3 className="font-bold mb-1">{b.title}</h3>
                <p className="text-sm text-ink-500 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          {/* === 職缺 === */}
          <h2 className="text-2xl sm:text-3xl font-black mb-6">{c.positionsTitle}</h2>
          <div className="space-y-4 mb-16">
            {c.positions.map((p, i) => (
              <div
                key={`${p.title}-${i}`}
                className="bg-white rounded-xl border border-line p-6 sm:p-8 hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-xl font-extrabold mb-1">{p.title}</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs bg-brand-green-50 text-brand-green-900 px-2.5 py-1 rounded-full font-bold">
                        {p.type}
                      </span>
                      <span className="text-xs bg-paper-2 text-ink-700 px-2.5 py-1 rounded-full font-bold">
                        {p.region}
                      </span>
                    </div>
                  </div>
                  <p className="text-brand-orange-700 font-bold">{p.salary}</p>
                </div>
                <p className="text-ink-700 mb-3">{p.desc}</p>
                <ul className="text-sm text-ink-700 space-y-1.5 list-none p-0 m-0">
                  {p.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2">
                      <MaterialIcon
                        name="check_circle"
                        className="!text-base text-brand-green-700 mt-0.5 flex-shrink-0"
                      />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* === CTA === */}
          <div className="bg-white border border-line rounded-xl p-10 text-center">
            <h2 className="text-2xl font-black mb-2">{c.ctaTitle}</h2>
            <p className="text-ink-500 mb-6">
              請將履歷寄至{' '}
              <a
                href={`mailto:${c.ctaEmail}`}
                className="text-brand-green-700 underline"
              >
                {c.ctaEmail}
              </a>
              ，主旨註明「應徵職缺名稱」。
            </p>
            <Link href={c.contactCtaLink} className="btn btn-primary">
              {c.contactCtaText}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
