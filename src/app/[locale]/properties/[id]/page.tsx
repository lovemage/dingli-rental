import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/frontend/Header';
import Footer from '@/components/frontend/Footer';
import TrackingBeacon from '@/components/frontend/TrackingBeacon';
import PropertyGallery from '@/components/frontend/PropertyGallery';
import { prisma } from '@/lib/prisma';
import { localizePropertyForDetail } from '@/lib/property-translate';
import { FLOATING_CTA_DEFAULTS, type FloatingCtaContent } from '@/data/floating-cta-defaults';

export const dynamic = 'force-dynamic';

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

async function loadOfficialLineUrl(): Promise<string> {
  try {
    const row = await prisma.siteContent.findUnique({ where: { section: 'floating_cta' } });
    const data = (row?.data as Partial<FloatingCtaContent>) || {};
    return (data.linkUrl || FLOATING_CTA_DEFAULTS.linkUrl).trim();
  } catch {
    return FLOATING_CTA_DEFAULTS.linkUrl;
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id: rawId, locale } = await params;
  const localeCandidates = locale === 'ja' ? ['ja', 'jp'] : [locale];
  setRequestLocale(locale);

  const id = Number(rawId);
  if (!id) notFound();

  const t = await getTranslations('propertyDetail');
  const lp = (p: string) => localePath(locale, p);
  const officialLineUrl = await loadOfficialLineUrl();

  const raw = await prisma.property
    .findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        translations:
          locale === 'zh'
            ? false
            : { where: { locale: { in: localeCandidates } } },
      },
    })
    .catch(() => null);

  if (!raw || raw.status !== 'active') notFound();

  const p = localizePropertyForDetail(raw, locale);

  const equipment: string[] = (p.equipment as string[]) || [];
  const furniture: string[] = (p.furniture as string[]) || [];
  const tenantTypes: string[] = (p.tenantTypes as string[]) || [];
  const rentIncludes: string[] = (p.rentIncludes as string[]) || [];
  const featureTags: string[] = (p.featureTags as string[]) || [];

  const hideAddress = !!raw.hideAddress;
  const addressDisplay = hideAddress
    ? `${p.region}・${p.district}${p.street ? `・${p.street}` : ''}`
    : `${p.region}・${p.district}${p.street ? `・${p.street}` : ''}${
        raw.lane ? `${raw.lane}${t('lane')}` : ''
      }${raw.alley ? `${raw.alley}${t('alley')}` : ''}${raw.number ? `${raw.number}${t('number')}` : ''}${
        raw.numberSub ? `${t('numberSub')}${raw.numberSub}` : ''
      }`;

  const mapQueryParts = [raw.region, raw.district];
  if (!hideAddress && raw.street) mapQueryParts.push(raw.street);
  const mapQuery = mapQueryParts.join(' ');
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;

  const moveInDateStr = raw.anytimeMoveIn
    ? t('moveInAnytime')
    : raw.moveInDate
      ? new Date(raw.moveInDate).toLocaleDateString(
          locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'zh-TW'
        )
      : t('dash');

  const ageStr = raw.ageUnknown
    ? t('ageUnknown')
    : raw.buildingAge
      ? t('ageYears', { count: raw.buildingAge })
      : t('dash');

  const floorStr = raw.floor
    ? t('floorValue', {
        floor: raw.floor,
        total: raw.totalFloor ? `/${raw.totalFloor}` : '',
      })
    : t('dash');

  const layoutStr = t('layoutValue', {
    rooms: raw.rooms,
    living: raw.livingRooms,
    bath: raw.bathrooms,
    balcony: raw.balconies,
  });

  const managementFeeStr = raw.noManagementFee
    ? t('managementFeeNone')
    : raw.managementFee
      ? t('managementFeeAmount', { amount: raw.managementFee.toLocaleString() })
      : t('dash');

  return (
    <>
      <Header />
      <TrackingBeacon kind="property" propertyId={p.id} />
      <main className="bg-paper-2 py-10">
        <div className="container-page">
          <Link
            href={lp('/properties')}
            className="text-sm text-ink-500 hover:text-brand-green-700 mb-4 inline-flex items-center gap-1"
          >
            {t('backToList')}
          </Link>

          <div className="bg-white rounded-xl shadow-md border border-line overflow-hidden">
            <PropertyGallery images={raw.images} title={p.title} noImageText={t('noImage')} />

            <div className="p-6 sm:p-10 grid lg:grid-cols-[1fr_320px] gap-8">
              <div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-brand-green-50 text-brand-green-900 text-xs font-bold px-2.5 py-1 rounded-full">
                    {p.region}
                  </span>
                  <span className="bg-brand-orange-50 text-brand-orange-700 text-xs font-bold px-2.5 py-1 rounded-full">
                    {p.typeMid}
                  </span>
                  {p.buildingType && (
                    <span className="bg-paper-2 text-ink-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {p.buildingType}
                    </span>
                  )}
                </div>

                {p.code && (
                  <span className="text-[11px] font-mono font-bold tracking-wider text-ink-400 mb-1 block">#{p.code}</span>
                )}
                <h1 className="text-2xl sm:text-3xl font-black mb-2">{p.title}</h1>
                <p className="text-ink-500 mb-6">📍 {addressDisplay}</p>

                {featureTags.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {featureTags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-brand-orange-50 text-brand-orange-700 text-xs font-bold px-2.5 py-1 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h2 className="font-bold text-lg mb-3">{t('basicInfo')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                  <Info label={t('layout')} value={layoutStr} />
                  <Info label={t('usableArea')} value={t('areaPing', { count: raw.usableArea })} />
                  <Info label={t('floor')} value={floorStr} />
                  <Info label={t('buildingAge')} value={ageStr} />
                  <Info label={t('direction')} value={p.direction || t('dash')} />
                  <Info label={t('community')} value={p.community || t('dash')} />
                  <Info
                    label={t('elevator')}
                    value={raw.hasElevator ? t('elevatorYes') : t('elevatorNo')}
                  />
                  <Info label={t('openLayout')} value={raw.openLayout ? t('yes') : t('no')} />
                </div>

                {equipment.length > 0 && <Tags label={t('equipmentLabel')} items={equipment} />}
                {furniture.length > 0 && <Tags label={t('furnitureLabel')} items={furniture} />}

                <h2 className="font-bold text-lg mb-3 mt-6">{t('rentTermsHeading')}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <Info
                    label={t('cooking')}
                    value={raw.cookingAllowed ? t('cookingYes') : t('cookingNo')}
                  />
                  <Info
                    label={t('pets')}
                    value={raw.petsAllowed ? t('cookingYes') : t('cookingNo')}
                  />
                  <Info label={t('minLease')} value={p.minLease} />
                  <Info label={t('moveIn')} value={moveInDateStr} />
                </div>
                {tenantTypes.length > 0 && <Tags label={t('tenantTypes')} items={tenantTypes} />}

                <h2 className="font-bold text-lg mb-3 mt-6">{t('locationHeading')}</h2>
                <div className="rounded-xl overflow-hidden border border-line bg-paper-2">
                  <iframe
                    title={p.title}
                    src={mapSrc}
                    width="100%"
                    height="320"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    style={{ border: 0, display: 'block' }}
                  />
                </div>
                <p className="text-xs text-ink-500 mt-2">{t('locationDisclaimer')}</p>

                {p.description && (
                  <>
                    <h2 className="font-bold text-lg mb-3 mt-6">{t('descriptionHeading')}</h2>
                    <div className="prose max-w-none text-ink-700 whitespace-pre-wrap">
                      {p.description}
                    </div>
                  </>
                )}

              </div>

              <aside className="bg-paper-2 rounded-xl p-6 h-fit lg:sticky lg:top-24">
                <p className="text-sm text-ink-500">{t('rentLabel')}</p>
                <p className="text-3xl font-black text-brand-green-900 mb-1">
                  NT$ {raw.rent.toLocaleString()}
                </p>
                <p className="text-sm text-ink-500 mb-4">{t('rentSuffix')}</p>

                <div className="border-t border-line pt-4 space-y-2 text-sm">
                  <Row label={t('depositLabel')} value={p.deposit} />
                  <Row label={t('managementFee')} value={managementFeeStr} />
                  {rentIncludes.length > 0 && (
                    <div>
                      <p className="text-ink-500 mb-1">{t('rentIncludes')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {rentIncludes.map((r) => (
                          <span
                            key={r}
                            className="bg-white text-ink-700 text-xs px-2 py-0.5 rounded-full border border-line"
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <a
                  href={officialLineUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full mt-6 text-center"
                >
                  {t('contactCta')}
                </a>
              </aside>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Info({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-paper-2 rounded-lg p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="font-bold text-ink-900 text-sm">{value}</p>
    </div>
  );
}

function Tags({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="mb-3">
      <p className="text-sm font-bold text-ink-700 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((it) => (
          <span
            key={it}
            className="bg-brand-green-50 text-brand-green-900 text-xs px-2.5 py-1 rounded-full font-medium"
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-900">{value}</span>
    </div>
  );
}
