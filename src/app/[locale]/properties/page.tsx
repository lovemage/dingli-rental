import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations, getLocale, setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import PropertyFilters from '@/components/frontend/PropertyFilters';
import PropertyResults from '@/components/frontend/PropertyResults';
import MaterialIcon from '@/components/MaterialIcon';
import { prisma } from '@/lib/prisma';
import { getLocalizedPropertyCards } from '@/lib/property-translate';
import { isPropertyCode, normalizePropertyCode } from '@/lib/property-code';
import { buildPublicPropertyWhere } from '@/lib/property-search';
import { buildPropertyOrderBy } from '@/lib/property-sort';
import { getTaxonomies } from '@/lib/taxonomies';

export const dynamic = 'force-dynamic';

type SearchParams = {
  q?: string;
  region?: string;
  district?: string;
  type?: string;
  building?: string;
  minRent?: string;
  maxRent?: string;
  minArea?: string;
  maxArea?: string;
  rooms?: string;
  minAge?: string;
  ageMax?: string;
  elevator?: string;
  pets?: string;
  cooking?: string;
  parking?: string;
  tags?: string;
  equipment?: string;
  sort?: string;
  page?: string;
};

async function search(params: SearchParams, locale: string) {
  const localeCandidates = locale === 'ja' ? ['ja', 'jp'] : [locale];
  const where = buildPublicPropertyWhere(params, locale);

  const page = Math.max(1, Number(params.page || 1));
  const pageSize = 12;

  try {
    const [items, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
          translations:
            locale === 'zh'
              ? false
              : { where: { locale: { in: localeCandidates } } },
        },
        orderBy: buildPropertyOrderBy(params.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.property.count({ where }),
    ]);
    return { items, total, page, pageSize };
  } catch {
    return { items: [], total: 0, page, pageSize };
  }
}

export default async function PropertiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;

  // 編號精準查找：若 q 形如 [L][YY][MMDD][NNN]（9 碼），直接跳該物件詳細頁。
  // 找不到就 fall through 走一般 keyword 搜尋（讓使用者看到「無結果」而非 404）。
  const rawQ = (sp.q || '').trim();
  if (rawQ && isPropertyCode(rawQ)) {
    const hit = await prisma.property
      .findUnique({ where: { code: normalizePropertyCode(rawQ) }, select: { id: true } })
      .catch(() => null);
    if (hit) {
      const prefix = locale === 'zh' ? '' : `/${locale}`;
      redirect(`${prefix}/properties/${hit.id}`);
    }
  }

  const [{ items, total, page, pageSize }, taxonomies] = await Promise.all([
    search(sp, locale),
    getTaxonomies(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const t = await getTranslations('properties');
  const currentLocale = await getLocale();
  const lp = (p: string) => (currentLocale === 'zh' ? p : `/${currentLocale}${p}`);

  const heroImg = '/images/properties-hero.webp';
  const cards = getLocalizedPropertyCards(items as any, locale);

  return (
    <>
      <Header />
      <main>
        {/* HERO — 樣式對齊首頁：full-bleed 主圖、固定 550px 高、20% 遮罩、白色文字 */}
        <section className="relative bg-paper-2">
          <div className="relative h-[550px] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={heroImg}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-[1] bg-ink-900/20" />
            <div className="container-page relative z-10 flex h-full items-center">
              <div className="max-w-2xl pt-6">
                <span className="eyebrow bg-paper/90"><span className="dot" />{t('pageEyebrow')}</span>
                <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black leading-tight my-5 text-paper drop-shadow-[0_2px_18px_rgba(26,36,33,0.35)]">
                  {t('pageTitleLine1')}<br />
                  <span className="text-brand-orange-300 relative inline-block">
                    {t('pageTitleLine2')}
                    <span className="absolute left-0 right-0 bottom-1 h-3.5 bg-brand-green-900/55 -z-10 rounded" />
                  </span>
                </h1>
                <p className="text-lg text-paper/95 max-w-xl whitespace-pre-line drop-shadow-[0_1px_12px_rgba(26,36,33,0.35)]">
                  {t('pageSubtitle')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container-page">
            {cards.length === 0 ? (
              <>
                <PropertyFilters total={total} taxonomies={taxonomies} />
                <div className="bg-paper-2 rounded-xl border border-line p-12 text-center text-ink-500 mt-8">
                  <p className="text-lg mb-2">{t('noResultsTitle')}</p>
                  <p className="text-sm">
                    {t('noResultsHint')}
                    <Link href={lp('/contact')} className="text-brand-green-700 underline">
                      {t('noResultsContactLink')}
                    </Link>
                  </p>
                  <Link
                    href={lp('/properties')}
                    className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-brand-green-200 bg-white px-4 py-2 text-sm font-semibold text-brand-green-700 shadow-sm transition hover:border-brand-green-500 hover:bg-brand-green-50"
                  >
                    {t('noResultsClear')}
                  </Link>
                </div>
              </>
            ) : (
              <PropertyResults cards={cards} total={total} taxonomies={taxonomies} />
            )}

            {totalPages > 1 && (
              <Pagination total={totalPages} current={page} sp={sp} basePath={lp('/properties')} />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Pagination({
  total,
  current,
  sp,
  basePath,
}: {
  total: number;
  current: number;
  sp: SearchParams;
  basePath: string;
}) {
  if (total <= 1) return null;

  const maxVisible = 10;
  const end = Math.min(maxVisible, total);
  const pages: number[] = [];
  for (let p = 1; p <= end; p++) pages.push(p);
  const showEllipsis = total > maxVisible + 1;
  const showLastPage = total > maxVisible;

  const buildHref = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, val]) => {
      if (val) params.set(k, String(val));
    });
    params.set('page', String(page));
    return `${basePath}?${params.toString()}#properties-grid`;
  };

  const baseBtn =
    'inline-flex items-center justify-center gap-1.5 rounded-full border text-[11px] font-semibold whitespace-nowrap transition sm:text-xs';
  const sizeSquare = 'w-10 h-10';
  const sizePill = 'px-3 py-1.5';
  const activeBtn = 'bg-brand-green-700 text-white border-brand-green-700';
  const idleBtn = 'bg-white border-line text-ink-700 hover:border-brand-green-500';
  const squareIdle = `${baseBtn} ${sizeSquare} ${idleBtn}`;
  const pillIdle = `${baseBtn} ${sizePill} ${idleBtn}`;
  const disabled = `${baseBtn} ${sizeSquare} bg-paper-2 border-line text-ink-300 cursor-not-allowed`;

  const prevPage = current - 1;
  const nextPage = current + 1;
  const prevDisabled = current <= 1;
  const nextDisabled = current >= total;

  return (
    <nav aria-label="Pagination" className="mt-12">
      {/* Mobile: simple prev / indicator / next */}
      <div className="flex items-center justify-center gap-3 sm:hidden">
        {prevDisabled ? (
          <span className={disabled} aria-disabled="true">
            <MaterialIcon name="chevron_left" className="!text-lg" />
          </span>
        ) : (
          <Link href={buildHref(prevPage)} className={squareIdle} aria-label="Previous page">
            <MaterialIcon name="chevron_left" className="!text-lg" />
          </Link>
        )}
        <span className="text-sm text-ink-500">
          {current} / {total}
        </span>
        {nextDisabled ? (
          <span className={disabled} aria-disabled="true">
            <MaterialIcon name="chevron_right" className="!text-lg" />
          </span>
        ) : (
          <Link href={buildHref(nextPage)} className={squareIdle} aria-label="Next page">
            <MaterialIcon name="chevron_right" className="!text-lg" />
          </Link>
        )}
      </div>

      {/* PC: full pagination with page numbers */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
        {prevDisabled ? (
          <span className={`${pillIdle} opacity-50 cursor-not-allowed`}>首頁</span>
        ) : (
          <Link href={buildHref(1)} className={pillIdle}>首頁</Link>
        )}
        {prevDisabled ? (
          <span className={disabled} aria-disabled="true">
            <MaterialIcon name="chevron_left" className="!text-lg" />
          </span>
        ) : (
          <Link href={buildHref(prevPage)} className={squareIdle} aria-label="Previous page">
            <MaterialIcon name="chevron_left" className="!text-lg" />
          </Link>
        )}

        {pages.map((n) => (
          <Link
            key={n}
            href={buildHref(n)}
            aria-current={n === current ? 'page' : undefined}
            className={n === current ? `${baseBtn} ${sizeSquare} ${activeBtn}` : squareIdle}
          >
            {n}
          </Link>
        ))}

        {showEllipsis && (
          <span className="px-1 text-xs text-ink-400">...</span>
        )}
        {showLastPage && (
          <Link
            href={buildHref(total)}
            aria-current={total === current ? 'page' : undefined}
            className={total === current ? `${baseBtn} ${sizeSquare} ${activeBtn}` : squareIdle}
          >
            {total}
          </Link>
        )}

        {nextDisabled ? (
          <span className={disabled} aria-disabled="true">
            <MaterialIcon name="chevron_right" className="!text-lg" />
          </span>
        ) : (
          <Link href={buildHref(nextPage)} className={squareIdle} aria-label="Next page">
            <MaterialIcon name="chevron_right" className="!text-lg" />
          </Link>
        )}
        {nextDisabled ? (
          <span className={`${pillIdle} opacity-50 cursor-not-allowed`}>末頁</span>
        ) : (
          <Link href={buildHref(total)} className={pillIdle}>末頁</Link>
        )}
      </div>
    </nav>
  );
}
