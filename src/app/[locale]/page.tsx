import Link from 'next/link';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import TrackingBeacon from '@/components/frontend/TrackingBeacon';
import HeroCarousel, { HeroSlide as HeroSlideType } from '@/components/frontend/HeroCarousel';
import PropertyFilters from '@/components/frontend/PropertyFilters';
import HeroCtaPanel from '@/components/frontend/HeroCtaPanel';
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
import { translateCmsSection } from '@/lib/cms-translate';
import { getLocalizedPropertyCards } from '@/lib/property-translate';

export const dynamic = 'force-dynamic';

function localizeHref(href: string, locale: string): string {
  if (!href) return href;
  if (
    href.startsWith('#') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    /^https?:\/\//i.test(href)
  ) {
    return href;
  }
  if (!href.startsWith('/')) return href;

  const stripped = href.replace(/^\/(?:zh|en|ja)(?=\/|$)/, '') || '/';
  if (locale === 'zh') return stripped;
  return `/${locale}${stripped === '/' ? '' : stripped}`;
}

function normalizeCategoryHref(item: { tag?: string; title?: string; href?: string }): string {
  const tag = (item.tag || '').trim().toUpperCase();
  const title = (item.title || '').trim();
  if (tag === 'OFFICE' || title.includes('辦公')) return '/properties?type=辦公室';
  if (tag === 'SHOP' || title.includes('店面')) return '/properties?type=店面';
  if (tag === 'RESIDENTIAL' || title.includes('住宅')) return '/properties?type=整層住家';
  return item.href || '/properties';
}

const FALLBACK_SLIDES: HeroSlideType[] = [
  { id: 1, imageUrl: '/images/hero.webp', title: '溫馨明亮的家', subtitle: '精選雙北桃園優質物件' },
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

function normalizeTestimonials(raw: unknown): Testimonial[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): Testimonial | null => {
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
}

async function getFeaturedProperties(locale: string): Promise<PropertyCardData[]> {
  try {
    const items = await prisma.property.findMany({
      where: { status: 'active', featured: true },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        translations: locale === 'zh' ? false : { where: { locale } },
      },
      orderBy: [{ updatedAt: 'desc' }],
      take: 6,
    });
    return getLocalizedPropertyCards(items, locale);
  } catch {
    return [];
  }
}

async function getActivePropertyCount(): Promise<number> {
  try {
    return await prisma.property.count({ where: { status: 'active' } });
  } catch {
    return 0;
  }
}

async function getHomepageContent(locale: string) {
  try {
    const items = await prisma.siteContent.findMany({
      where: { section: { in: ['homepage_hero', 'homepage_categories', 'homepage_services'] } },
    });
    const map = new Map(items.map((i) => [i.section, i.data as Record<string, unknown>]));
    const heroRaw = ((map.get('homepage_hero') as Record<string, unknown> | undefined) || HERO_DEFAULTS) as Record<string, unknown>;
    const categoriesRaw = ((map.get('homepage_categories') as Record<string, unknown> | undefined) || CATEGORIES_DEFAULTS) as Record<string, unknown>;
    const servicesRaw = ((map.get('homepage_services') as Record<string, unknown> | undefined) || SERVICES_DEFAULTS) as Record<string, unknown>;

    const [heroT, categoriesT, servicesT] = await Promise.all([
      translateCmsSection('homepage_hero', heroRaw, locale),
      translateCmsSection('homepage_categories', categoriesRaw, locale),
      translateCmsSection('homepage_services', servicesRaw, locale),
    ]);

    const hero: HeroContent = { ...HERO_DEFAULTS, ...(heroT as Partial<HeroContent>) };
    const cRaw = categoriesT as { items?: unknown };
    const categories: CategoriesContent = {
      items: Array.isArray(cRaw?.items) && cRaw.items.length
        ? (cRaw.items as CategoriesContent['items'])
        : CATEGORIES_DEFAULTS.items,
    };
    const sRaw = servicesT as Partial<ServicesContent>;
    const services: ServicesContent = {
      ...SERVICES_DEFAULTS,
      ...sRaw,
      items: Array.isArray(sRaw.items) && sRaw.items.length ? sRaw.items : SERVICES_DEFAULTS.items,
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

async function getTestimonials(locale: string): Promise<Testimonial[]> {
  // 讀取優先序：
  // 1. data.testimonialsByLocale[locale] — admin 在後台針對該語言策展的評論
  // 2. zh 路由限定：data.testimonials（legacy zh-only schema，向下相容舊資料）
  // 3. i18n messages 的 home.testimonials fallback
  try {
    const about = await prisma.siteContent.findUnique({ where: { section: 'about' } });
    const data = (about?.data as Record<string, unknown>) || {};

    const byLocale = data.testimonialsByLocale;
    if (byLocale && typeof byLocale === 'object' && !Array.isArray(byLocale)) {
      const localeList = (byLocale as Record<string, unknown>)[locale];
      const normalized = normalizeTestimonials(localeList);
      if (normalized.length) return normalized;
    }

    if (locale === 'zh') {
      const legacy = normalizeTestimonials(data.testimonials);
      if (legacy.length) return legacy;
    }
  } catch {
    // ignore — fall through to i18n fallback
  }

  try {
    const t = await getTranslations({ locale, namespace: 'home' });
    return normalizeTestimonials(t.raw('testimonials'));
  } catch {
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const currentLocale = await getLocale();
  const lp = (p: string) => (currentLocale === 'zh' ? p : `/${currentLocale}${p}`);

  const [{ slides, intervalSec }, testimonials, featured, { hero, categories, services }, taxonomies, propertyTotal] = await Promise.all([
    getHero(),
    getTestimonials(locale),
    getFeaturedProperties(locale),
    getHomepageContent(locale),
    getTaxonomies(),
    getActivePropertyCount(),
  ]);
  const heroQuickLinks = taxonomies.propertyTypes.slice(0, 4).map((type) => ({
    label: type,
    href: localizeHref(`/properties?type=${encodeURIComponent(type)}`, currentLocale),
  }));

  return (
    <>
      <Header />
      <TrackingBeacon kind="home" />
      <main>
        {/* HERO */}
        <section className="relative bg-paper-2">
          <div className="relative h-[550px] overflow-hidden">
            <HeroCarousel
              slides={slides}
              intervalSec={intervalSec}
              showCaptions={false}
              className="hero-carousel-full"
            />
            <div className="absolute inset-0 z-[1] bg-ink-900/20" />
            <div className="container-page relative z-10 flex h-full items-center">
              {/* 中文版用 max-w-2xl 維持原排版；EN/JA 譯文較長改 max-w-3xl + 略小字級，避免一句被切成 4–5 行 */}
              <div className={`pt-6 ${currentLocale === 'zh' ? 'max-w-2xl' : 'max-w-3xl'}`}>
                <span className="eyebrow bg-paper/90"><span className="dot" />{hero.eyebrow}</span>
                <h1
                  className={
                    currentLocale === 'zh'
                      ? 'text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5 text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]'
                      : 'text-3xl md:text-4xl lg:text-5xl font-black leading-tight my-5 text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]'
                  }
                >
                  {/* zh 強制兩行（短句設計）；EN/JA 譯文較長，讓 line1 與 line2 之間以空格相接、自然 wrap */}
                  {hero.titleLine1}
                  {currentLocale === 'zh' ? <br /> : ' '}
                  <span className="text-brand-orange-300 relative inline-block">
                    {hero.titleLine2}
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-green-900/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-paper/95 max-w-xl mb-8 whitespace-pre-line drop-shadow-[0_1px_12px_rgba(26,36,33,0.35)]">
                  {hero.description}
                </p>
                <HeroCtaPanel
                  primaryText={hero.primaryCtaText}
                  secondaryText={hero.secondaryCtaText}
                  secondaryHref={localizeHref(hero.secondaryCtaLink, currentLocale)}
                  quickLinks={heroQuickLinks}
                />
              </div>
            </div>
          </div>

          <div className="container-page relative z-30 pb-16">
            <div className="-mt-10 max-w-5xl mx-auto">
              <PropertyFilters total={propertyTotal} taxonomies={taxonomies} />
            </div>
          </div>
        </section>

        {/* 物件分類 */}
        <section className="py-16 sm:py-24" id="categories">
          <div className="container-page">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6">
              {categories.items.map((cat, i) => (
                <CatCard
                  key={`${cat.tag}-${i}`}
                  href={localizeHref(normalizeCategoryHref(cat), currentLocale)}
                  img={cat.imageUrl}
                  tag={cat.tag}
                  title={cat.title}
                  desc={cat.desc}
                  viewMoreLabel={t('categoryViewMore')}
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
                eyebrow={t('featuredEyebrow')}
                title={t('featuredTitle')}
                sub={t('featuredSub')}
              />
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 lg:gap-7">
                {featured.map((p) => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
              <div className="text-center mt-12">
                <Link href={lp('/properties')} className="btn btn-primary">
                  {t('viewAllProperties')}
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* 服務特色 */}
        <section className="py-24 bg-paper-2">
          <div className="container-page">
            <SectionHead eyebrow={services.eyebrow} title={services.title} sub={services.sub} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-8 max-w-5xl mx-auto">
              {services.items.map((s, i) => (
                <FeatRow key={`${s.title}-${i}`} icon={s.icon} title={s.title} desc={s.desc} />
              ))}
            </div>
            {services.ctaText && services.ctaLink && (
              <div className="text-center mt-12">
                <Link
                  href={localizeHref(services.ctaLink, currentLocale)}
                  className="inline-flex items-center gap-1 font-bold text-brand-green-700 hover:text-brand-green-900 transition"
                >
                  {services.ctaText} →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* WHY DINGLI */}
        <section className="py-24" id="why-dingli">
          <div className="container-page">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-14 items-center">
              <div className="relative rounded-2xl overflow-hidden shadow-lg aspect-[5/4]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/property2.webp" alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="eyebrow">
                  <span className="dot" />
                  {t('whyEyebrow')}
                </span>
                <h2 className="text-3xl sm:text-4xl font-black mt-3 mb-5 leading-tight">
                  {t('whyTitleLine1')}<br />
                  <span className="text-brand-green-700">{t('whyTitleLine2')}</span>
                </h2>
                <p className="text-ink-500 mb-8">{t('whySubtitle')}</p>
                <ul className="divide-y divide-line/70">
                  <WhyRow num="01" title={t('why01Title')} desc={t('why01Desc')} />
                  <WhyRow num="02" title={t('why02Title')} desc={t('why02Desc')} />
                  <WhyRow num="03" title={t('why03Title')} desc={t('why03Desc')} />
                  <WhyRow num="04" title={t('why04Title')} desc={t('why04Desc')} />
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 租客評論 */}
        <section className="py-24 bg-paper-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(243,156,18,0.08),_transparent_55%),radial-gradient(circle_at_bottom_left,_rgba(46,157,47,0.08),_transparent_55%)] pointer-events-none" />
          <div className="container-page relative">
            <SectionHead
              eyebrow={t('testimonialsEyebrow')}
              title={t('testimonialsTitle')}
              sub={t('testimonialsSub')}
            />
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

function CatCard({
  href,
  img,
  tag,
  title,
  desc,
  viewMoreLabel,
}: {
  href: string;
  img: string;
  tag: string;
  title: string;
  desc: string;
  viewMoreLabel: string;
}) {
  return (
    <Link
      href={href}
      className="relative block rounded-xl overflow-hidden aspect-square shadow-sm hover:shadow-lg hover:-translate-y-1.5 transition group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={img}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-900/85" />
      <div className="absolute left-3 right-3 bottom-3 sm:left-6 sm:right-6 sm:bottom-6 text-white">
        <span className="hidden sm:inline-block bg-brand-orange-500 text-xs font-bold px-2.5 py-1 rounded-full mb-2 tracking-wide">
          {tag}
        </span>
        <h3 className="text-base sm:text-2xl font-extrabold sm:mb-1.5 leading-tight">{title}</h3>
        <p className="hidden sm:block text-sm opacity-90">{desc}</p>
        <span className="hidden sm:inline-flex items-center gap-1 mt-3 font-bold text-sm text-brand-orange-300">
          {viewMoreLabel}
        </span>
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
  const initial = item.name.trim().slice(0, 1) || 'D';

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

function WhyRow({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <li className="flex items-baseline gap-5 py-5 first:pt-0 last:pb-0">
      <span className="text-2xl font-black text-brand-orange-500 leading-none tabular-nums shrink-0 w-10">
        {num}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-extrabold text-lg mb-1 text-ink-900">{title}</h3>
        <p className="text-sm text-ink-700 leading-relaxed">{desc}</p>
      </div>
    </li>
  );
}

function FeatRow({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-green-50 text-brand-green-700 grid place-items-center">
        <MaterialIcon name={icon} className="!text-2xl" />
      </div>
      <div className="min-w-0 pt-0.5">
        <h3 className="font-extrabold text-lg mb-1.5 text-ink-900">{title}</h3>
        <p className="text-sm text-ink-700 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
