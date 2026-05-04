import Link from 'next/link';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import HeroCarousel, { HeroSlide as HeroSlideType } from '@/components/frontend/HeroCarousel';
import HeroSearch from '@/components/frontend/HeroSearch';
import PropertyCard, { type PropertyCardData } from '@/components/frontend/PropertyCard';
import MaterialIcon from '@/components/MaterialIcon';
import { prisma } from '@/lib/prisma';
import { getTaxonomies } from '@/lib/taxonomies';
import {
  HERO_DEFAULTS,
  CATEGORIES_DEFAULTS,
  SERVICES_DEFAULTS,
  type HeroContent,
  type CategoriesContent,
  type ServicesContent,
} from '@/data/homepage-defaults';

export const dynamic = 'force-dynamic';

const FALLBACK_SLIDES: HeroSlideType[] = [
  { id: 1, imageUrl: '/images/hero.webp', title: '溫馨明亮的家', subtitle: '精選北北基桃竹優質物件' },
  { id: 2, imageUrl: '/images/residential.webp', title: '日系臥室套房', subtitle: '通勤便利・採光絕佳' },
  { id: 3, imageUrl: '/images/property2.webp', title: '挑高夾層住宅', subtitle: '雙北優質好屋' },
];

async function getHero() {
  try {
    const [slides, settings] = await Promise.all([
      prisma.heroSlide.findMany({ where: { active: true }, orderBy: { order: 'asc' }, take: 3 }),
      prisma.heroSettings.findUnique({ where: { id: 1 } }),
    ]);
    return {
      slides: slides.length ? slides : FALLBACK_SLIDES,
      intervalSec: settings?.intervalSec ?? 5,
    };
  } catch {
    return { slides: FALLBACK_SLIDES, intervalSec: 5 };
  }
}

type Testimonial = {
  name: string;
  role: string;
  quote: string;
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    name: '陳小姐',
    role: '外商行銷經理',
    quote: '帶看很有效率，業務把每個物件優缺點講得很清楚，兩天內就找到理想租屋。',
  },
  {
    name: '佐藤先生',
    role: '日本工程師',
    quote: '可以用日文溝通真的很安心，合約條款也逐條解說，整個流程非常專業。',
  },
  {
    name: '王先生',
    role: '新創團隊負責人',
    quote: '從辦公室選址到租約談判都有幫上忙，省下很多時間成本。',
  },
];

async function getFeaturedProperties(): Promise<PropertyCardData[]> {
  try {
    const items = await prisma.property.findMany({
      where: { status: 'active', featured: true },
      include: { images: { orderBy: { order: 'asc' }, take: 1 } },
      orderBy: [{ updatedAt: 'desc' }],
      take: 6,
    });
    return items.map((p) => ({
      id: p.id,
      title: p.title,
      region: p.region,
      district: p.district,
      street: p.street,
      community: p.community,
      typeMid: p.typeMid,
      rooms: p.rooms,
      livingRooms: p.livingRooms,
      bathrooms: p.bathrooms,
      usableArea: p.usableArea,
      rent: p.rent,
      imageUrl: p.images[0]?.url ?? null,
      featureTags: Array.isArray(p.featureTags) ? (p.featureTags as string[]) : [],
      buildingAge: p.buildingAge,
      hasElevator: p.hasElevator,
      petsAllowed: p.petsAllowed,
      cookingAllowed: p.cookingAllowed,
      description: p.description,
      hideAddress: p.hideAddress,
      featured: p.featured,
    }));
  } catch {
    return [];
  }
}

async function getHomepageContent() {
  try {
    const items = await prisma.siteContent.findMany({
      where: { section: { in: ['homepage_hero', 'homepage_categories', 'homepage_services'] } },
    });
    const map = new Map(items.map((i) => [i.section, i.data as Record<string, unknown>]));
    const hero: HeroContent = { ...HERO_DEFAULTS, ...(map.get('homepage_hero') || {}) };
    const cRaw = map.get('homepage_categories') as { items?: unknown } | undefined;
    const categories: CategoriesContent = {
      items: Array.isArray(cRaw?.items) && cRaw!.items!.length
        ? (cRaw!.items as CategoriesContent['items'])
        : CATEGORIES_DEFAULTS.items,
    };
    const sRaw = (map.get('homepage_services') || {}) as Partial<ServicesContent>;
    const services: ServicesContent = {
      ...SERVICES_DEFAULTS,
      ...sRaw,
      items: Array.isArray(sRaw.items) && sRaw.items.length
        ? sRaw.items
        : SERVICES_DEFAULTS.items,
    };
    return { hero, categories, services };
  } catch {
    return {
      hero: HERO_DEFAULTS,
      categories: CATEGORIES_DEFAULTS,
      services: SERVICES_DEFAULTS,
    };
  }
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const about = await prisma.siteContent.findUnique({ where: { section: 'about' } });
    const data = (about?.data as Record<string, unknown>) || {};
    const raw = data.testimonials;
    if (Array.isArray(raw)) {
      const normalized = raw
        .map((item) => {
          if (!item || typeof item !== 'object') return null;
          const row = item as Record<string, unknown>;
          if (
            typeof row.name !== 'string' ||
            typeof row.role !== 'string' ||
            typeof row.quote !== 'string'
          ) {
            return null;
          }
          return { name: row.name, role: row.role, quote: row.quote };
        })
        .filter((x): x is Testimonial => x !== null);
      if (normalized.length) return normalized;
    }
    return FALLBACK_TESTIMONIALS;
  } catch {
    return FALLBACK_TESTIMONIALS;
  }
}

export default async function HomePage() {
  const { slides, intervalSec } = await getHero();
  const testimonials = await getTestimonials();
  const featured = await getFeaturedProperties();
  const { hero, categories, services } = await getHomepageContent();
  const taxonomies = await getTaxonomies();

  return (
    <>
      <Header />
      <main>
        {/* HERO */}
        <section className="relative pt-20 pb-24 bg-gradient-to-b from-paper to-paper-2">
          <div className="container-page relative z-10">
            <div className="grid md:grid-cols-[1.05fr_1fr] gap-14 items-center">
              <div>
                <span className="eyebrow"><span className="dot" />{hero.eyebrow}</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5">
                  {hero.titleLine1}<br />
                  <span className="text-brand-green-700 relative inline-block">
                    {hero.titleLine2}
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-orange-300/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-ink-700 max-w-xl mb-8 whitespace-pre-line">
                  {hero.description}
                </p>
                <div className="flex flex-wrap gap-3 mb-10">
                  <Link href={hero.primaryCtaLink} className="btn btn-primary">{hero.primaryCtaText}</Link>
                  <Link href={hero.secondaryCtaLink} className="btn btn-secondary">{hero.secondaryCtaText}</Link>
                </div>
              </div>

              <HeroCarousel slides={slides} intervalSec={intervalSec} />
            </div>

            <div className="mt-12 max-w-5xl mx-auto relative z-30">
              <HeroSearch propertyTypes={taxonomies.propertyTypes} />
            </div>
          </div>
        </section>

        {/* 物件分類 */}
        <section className="py-24" id="categories">
          <div className="container-page">
            <SectionHead eyebrow="三大分類" title="找到最適合您的空間" sub="從溫暖小窩、辦公基地到實體店面，依您的生活與事業階段挑選。" />
            <div className="grid md:grid-cols-3 gap-6">
              {categories.items.map((cat, i) => (
                <CatCard
                  key={`${cat.tag}-${i}`}
                  href={cat.href}
                  img={cat.imageUrl}
                  tag={cat.tag}
                  title={cat.title}
                  desc={cat.desc}
                />
              ))}
            </div>
          </div>
        </section>

        {/* 本週嚴選好物件 */}
        {featured.length > 0 && (
          <section className="py-24 bg-paper-2" id="featured">
            <div className="container-page">
              <SectionHead
                eyebrow="精選推薦"
                title="本週嚴選好物件"
                sub="系統依您所在地區與預算自動推薦關聯物件，省下大量搜尋時間。"
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
                {featured.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href="/properties" className="btn btn-primary">
                  查看所有物件 →
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 服務特色 */}
        <section className="py-24 bg-paper-2">
          <div className="container-page">
            <SectionHead eyebrow={services.eyebrow} title={services.title} sub={services.sub} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {services.items.map((s, i) => (
                <FeatCard key={`${s.title}-${i}`} icon={s.icon} title={s.title} desc={s.desc} />
              ))}
            </div>
            {services.ctaText && services.ctaLink && (
              <div className="text-center mt-10">
                <Link href={services.ctaLink} className="btn btn-primary">{services.ctaText}</Link>
              </div>
            )}
          </div>
        </section>

        {/* WHY DINGLI 租屋這件事，值得被認真對待 */}
        <section className="py-24" id="why-dingli">
          <div className="container-page">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[5/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/property2.webp"
                  alt="挑高夾層公寓室內"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-ink-900/30 via-transparent to-transparent" />
              </div>
              <div>
                <span className="eyebrow">
                  <span className="dot" />
                  WHY DINGLI
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-5 leading-tight">
                  租屋這件事，<br />
                  <span className="text-brand-green-700">值得被認真對待</span>
                </h2>
                <p className="text-ink-500 mb-8">
                  我們不只是把鑰匙交給您 — 從帶看、議價、簽約到入住後續，鼎立的真人業務全程把關，讓您每一個決定都安心。
                </p>
                <div className="grid sm:grid-cols-2 gap-5">
                  <WhyCard
                    num="01"
                    title="10 年以上在地經驗"
                    desc="熟悉雙北、桃園、新竹各大商圈行情，價格不被吃豆腐。"
                  />
                  <WhyCard
                    num="02"
                    title="真人專員一對一"
                    desc="從帶看到簽約由同一位業務全程跟進，不會被踢來踢去。"
                  />
                  <WhyCard
                    num="03"
                    title="嚴選真實物件"
                    desc="每筆物件皆經業務親自看過，不放假房源也不灌水。"
                  />
                  <WhyCard
                    num="04"
                    title="入住後仍持續關心"
                    desc="遇到修繕、退押金或續約問題，我們依然是您的後盾。"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 租客評論 */}
        <section className="py-24 bg-paper-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(243,156,18,0.08),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(46,157,47,0.08),_transparent_55%)] pointer-events-none" />
          <div className="container-page relative">
            <SectionHead eyebrow="TESTIMONIALS" title="租客真實回饋" sub="我們重視每一次帶看與簽約體驗，以下是租客的真實分享。" />
            <div className="testimonial-marquee py-2">
              <div className="testimonial-track">
                {[...testimonials, ...testimonials].map((item, idx) => (
                  <TestimonialCard key={`${item.name}-${item.role}-${idx}`} item={item} idx={idx} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-14">
      <span className="eyebrow"><span className="dot" />{eyebrow}</span>
      <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-3 leading-tight">{title}</h2>
      <p className="text-ink-500 text-base">{sub}</p>
    </div>
  );
}

function CatCard({ href, img, tag, title, desc }: { href: string; img: string; tag: string; title: string; desc: string }) {
  return (
    <Link href={href} className="relative block rounded-xl overflow-hidden aspect-[4/5] shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition group">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900/85" />
      <div className="absolute left-6 right-6 bottom-6 text-white">
        <span className="inline-block bg-brand-orange-500 text-xs font-bold px-2.5 py-1 rounded-full mb-2 tracking-wide">{tag}</span>
        <h3 className="text-2xl font-extrabold mb-1.5">{title}</h3>
        <p className="text-sm opacity-90">{desc}</p>
        <span className="inline-flex items-center gap-1 mt-3 font-bold text-sm text-brand-orange-300">查看物件 →</span>
      </div>
    </Link>
  );
}

const AVATAR_PALETTE = [
  { bg: 'bg-brand-green-700', ring: 'ring-brand-green-50' },
  { bg: 'bg-brand-orange-500', ring: 'ring-brand-orange-50' },
  { bg: 'bg-brand-green-900', ring: 'ring-brand-green-50' },
  { bg: 'bg-brand-orange-700', ring: 'ring-brand-orange-50' },
];

function TestimonialCard({ item, idx }: { item: Testimonial; idx: number }) {
  const palette = AVATAR_PALETTE[idx % AVATAR_PALETTE.length];
  const initial = item.name.trim().slice(0, 1) || '客';

  return (
    <article className="testimonial-card group relative bg-white rounded-2xl border border-line/80 p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-brand-green-500/60 transition-all duration-300">
      <span
        aria-hidden="true"
        className="absolute top-4 right-5 text-7xl font-serif leading-none text-brand-orange-300/45 select-none transition-transform duration-300 group-hover:scale-110"
      >
        “
      </span>

      <div className="flex items-center gap-1 mb-4 text-brand-orange-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="text-sm">★</span>
        ))}
      </div>

      <p className="text-ink-700 leading-relaxed mb-6 text-[15px] line-clamp-5 relative z-10">
        {item.quote}
      </p>

      <div className="flex items-center gap-3 pt-5 border-t border-line/80">
        <div
          className={`w-11 h-11 rounded-full ${palette.bg} text-white grid place-items-center font-bold text-lg ring-4 ${palette.ring} flex-shrink-0`}
        >
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-ink-900 truncate">{item.name}</p>
          <p className="text-xs text-ink-500 truncate">{item.role}</p>
        </div>
      </div>
    </article>
  );
}

function WhyCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl border border-line p-5 hover:border-brand-green-500 hover:shadow-md transition">
      <div className="text-3xl font-black text-brand-orange-500 mb-2 leading-none">{num}</div>
      <h3 className="font-extrabold text-lg mb-1.5">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="bg-white border border-line rounded-xl p-7 hover:shadow-md hover:-translate-y-1 hover:border-brand-green-500 transition">
      <div className="w-14 h-14 rounded-2xl bg-brand-green-50 text-brand-green-700 grid place-items-center mb-4">
        <MaterialIcon name={icon} className="!text-3xl" />
      </div>
      <h3 className="font-extrabold text-lg mb-2">{title}</h3>
      <p className="text-sm text-ink-500 leading-relaxed">{desc}</p>
    </div>
  );
}
