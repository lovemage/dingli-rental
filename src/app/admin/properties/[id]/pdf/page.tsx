import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { localizePropertyForDetail } from '@/lib/property-translate';
import { lookupDistrict, lookupFixed } from '@/lib/property-i18n';
import { formatFloorLine } from '@/lib/property-floor';
import { isVideoUrl } from '@/lib/property-media';
import { getContactContent } from '@/lib/contact-content';
import {
  formatArea,
  formatMinLeaseDisplay,
  isParkingExtraFee,
  pingToFt2,
  pingToM2,
} from '@/data/taiwan-addresses';
import { OFFICIAL_LINE_QR_SRC } from '@/data/contact-defaults';
import PdfToolbar from './PdfToolbar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '匯出 PDF',
  robots: { index: false, follow: false },
};

type Lang = 'zh' | 'en' | 'ja';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://dingli-rental.com').replace(/\/$/, '');

/** PDF 最多放幾張照片（主圖 1 張＋縮圖） */
const MAX_PDF_PHOTOS = 15;

/**
 * Cloudinary 圖片改抓縮小、壓縮過的 JPG，PDF 檔案才不會太大
 * （原圖 1920px WebP 直接列印，15 張就會到十幾 MB）。非 Cloudinary 網址原樣回傳。
 */
function pdfImageUrl(url: string, width: number): string {
  if (!/res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url)) return url;
  return url.replace('/image/upload/', `/image/upload/c_limit,w_${width},q_auto:eco,f_jpg/`);
}

/** 完整門牌（中文，定位地圖用） */
function zhFullAddress(p: any, full: boolean): string {
  const base = `${p.region}${p.district}${p.street || ''}`;
  if (!full) return base;
  return `${base}${p.lane ? `${p.lane}巷` : ''}${p.alley ? `${p.alley}弄` : ''}${p.number ? `${p.number}號` : ''}${
    p.numberSub ? `之${p.numberSub}` : ''
  }`;
}

/** 依語言顯示的地址：英文採「No. 12, Ln. 3, Street, District, City」格式 */
function displayAddress(raw: any, localized: any, lang: Lang, full: boolean): string {
  if (lang === 'zh') return zhFullAddress(raw, full);
  const city = lookupFixed('region', raw.region, lang) ?? localized.region;
  const district = lookupDistrict(raw.district, lang) ?? localized.district;
  const street = localized.street || raw.street || '';
  if (lang === 'en') {
    const parts: string[] = [];
    if (full) {
      if (raw.number) parts.push(`No. ${raw.number}${raw.numberSub ? `-${raw.numberSub}` : ''}`);
      if (raw.alley) parts.push(`Aly. ${raw.alley}`);
      if (raw.lane) parts.push(`Ln. ${raw.lane}`);
    }
    if (street) parts.push(street);
    parts.push(district, city);
    return parts.filter(Boolean).join(', ');
  }
  // ja：漢字地名可直接閱讀，巷／弄／號保留原文
  const tail = full
    ? `${raw.lane ? `${raw.lane}巷` : ''}${raw.alley ? `${raw.alley}弄` : ''}${raw.number ? `${raw.number}号` : ''}${
        raw.numberSub ? `之${raw.numberSub}` : ''
      }`
    : '';
  return `${city}${district}${raw.street || ''}${tail}`;
}

export default async function PropertyPdfPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; full?: string; photos?: string }>;
}) {
  const me = await getCurrentAdmin();
  if (!me) redirect('/admin/login');

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!id) notFound();
  const sp = await searchParams;
  const lang: Lang = sp.lang === 'en' || sp.lang === 'ja' ? sp.lang : 'zh';
  const full = sp.full !== '0';

  const raw = await prisma.property
    .findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        translations: lang === 'zh' ? false : { where: { locale: { in: lang === 'ja' ? ['ja', 'jp'] : ['en'] } } },
      },
    })
    .catch(() => null);
  if (!raw) notFound();

  const p = localizePropertyForDetail(raw, lang);
  const t = await getTranslations({ locale: lang, namespace: 'propertyDetail' });
  const contact = await getContactContent(lang).catch(() => null);

  // 可選照片（影片不算）；?photos=圖片id,id… 指定要放進 PDF 的照片，未指定則取前 15 張
  const allPhotos = raw.images.filter((i) => !isVideoUrl(i.url)).map((i) => ({ id: i.id, url: i.url }));
  const pickedIds = (sp.photos || '')
    .split(',')
    .map((x) => Number(x))
    .filter((x) => Number.isInteger(x) && x > 0);
  const picked = pickedIds.length
    ? allPhotos.filter((ph) => pickedIds.includes(ph.id))
    : allPhotos;
  const photos = picked.slice(0, MAX_PDF_PHOTOS);
  const cover = photos[0] ? pdfImageUrl(photos[0].url, 1200) : undefined;
  const thumbs = photos.slice(1).map((ph) => pdfImageUrl(ph.url, 480));

  const dash = t('dash');
  const layoutStr = raw.openLayout
    ? t('openLayout')
    : t('layoutValue', { rooms: raw.rooms, living: raw.livingRooms, bath: raw.bathrooms, balcony: raw.balconies });
  const areaStr =
    raw.usableArea > 0
      ? `${t('areaPing', { count: raw.usableArea })}${lang === 'en' ? ' (' : '（'}${t('areaConverted', {
          m2: formatArea(pingToM2(raw.usableArea)),
          ft2: formatArea(pingToFt2(raw.usableArea)),
        })}${lang === 'en' ? ')' : '）'}`
      : dash;
  const parkingStr = !p.parkingType
    ? t('parkingNone')
    : isParkingExtraFee(raw.parkingType) && raw.parkingFee
      ? t('parkingWithFee', { type: p.parkingType, amount: raw.parkingFee.toLocaleString() })
      : p.parkingType;
  const managementFeeStr = raw.noManagementFee
    ? t('managementFeeNone')
    : raw.managementFee
      ? t('managementFeeAmount', { amount: raw.managementFee.toLocaleString() })
      : dash;
  const ageStr = raw.ageUnknown
    ? t('ageUnknown')
    : raw.buildingAge
      ? t('ageYears', { count: raw.buildingAge })
      : dash;
  const moveInStr = raw.anytimeMoveIn
    ? t('moveInAnytime')
    : raw.moveInDate
      ? new Date(raw.moveInDate).toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'zh-TW')
      : dash;

  const address = displayAddress(raw, p, lang, full);
  const mapLang = lang === 'en' ? 'en' : lang === 'ja' ? 'ja' : 'zh-TW';
  // 地圖查詢用中文地址定位最準；hl 控制地圖上地名的語言
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(zhFullAddress(raw, full))}&z=${full ? 17 : 15}&hl=${mapLang}&output=embed`;

  const info: Array<[string, string]> = [
    [t('layout'), layoutStr],
    [t('usableArea'), areaStr],
    [t('floor'), formatFloorLine(raw.floorType, raw.floor, raw.totalFloor, lang) || dash],
    [t('buildingAge'), ageStr],
    [t('direction'), p.direction || dash],
    [t('community'), p.community || dash],
    [t('parking'), parkingStr],
    [t('elevator'), raw.hasElevator ? t('elevatorYes') : t('elevatorNo')],
    [t('cooking'), raw.cookingAllowed ? t('cookingYes') : t('cookingNo')],
    [t('pets'), raw.petsAllowed ? t('cookingYes') : t('cookingNo')],
    [t('minLease'), formatMinLeaseDisplay(p.minLease) || dash],
    [t('moveIn'), moveInStr],
  ];
  const priceRows: Array<[string, string]> = [
    [t('depositLabel'), p.deposit || dash],
    [t('managementFee'), managementFeeStr],
  ];
  if (p.rentTax) priceRows.push([t('rentTaxLabel'), p.rentTax]);

  const tagGroups: Array<[string, string[]]> = [
    [t('rentIncludes'), p.rentIncludes ?? []],
    [t('equipmentLabel'), p.equipment ?? []],
    [t('furnitureLabel'), p.furniture ?? []],
    [t('facilitiesLabel'), p.facilities ?? []],
    [t('tenantTypes'), p.tenantTypes ?? []],
  ];

  const company = contact?.companyInfo;

  return (
    <div className="pdf-page min-h-screen bg-paper-2">
      <style>{`
        @page { size: A4; margin: 12mm; }
        @media print {
          html, body { background: #fff !important; }
          .pdf-page { background: #fff !important; min-height: 0 !important; }
          .pdf-toolbar { display: none !important; }
          .pdf-sheet { box-shadow: none !important; margin: 0 !important; padding: 0 !important; max-width: none !important; }
          .pdf-avoid { break-inside: avoid; }
          .pdf-thumb { break-inside: avoid; }
          .pdf-sheet h2 { break-after: avoid; page-break-after: avoid; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <PdfToolbar
        id={id}
        lang={lang}
        full={full}
        allPhotos={allPhotos.map((ph) => ({ id: ph.id, url: pdfImageUrl(ph.url, 240) }))}
        selectedIds={photos.map((ph) => ph.id)}
        customSelection={pickedIds.length > 0}
        maxPhotos={MAX_PDF_PHOTOS}
      />

      <article className="pdf-sheet mx-auto max-w-[820px] bg-white p-4 text-ink-900 shadow-sm sm:my-6 sm:p-8" lang={mapLang}>
        {/* 手機：Logo 在上、標題地址佔滿整行（Logo 很寬，並排會把標題擠成窄條）；平板以上與列印：左右並排 */}
        <header className="flex flex-col-reverse items-start gap-3 border-b-2 border-ink-900 pb-3 sm:flex-row sm:justify-between sm:gap-4 print:flex-row print:justify-between print:gap-4">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-black leading-snug sm:text-2xl print:text-2xl">{p.title}</h1>
            <p className="mt-1 text-sm text-ink-600">{address}</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/LOGO_0.png" alt="Dingli Rental Service" className="h-8 w-auto max-w-full shrink-0 sm:h-9 print:h-9" />
        </header>

        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-black sm:text-3xl print:text-3xl">
            NT$ {raw.rent.toLocaleString()}
            <span className="ml-1.5 text-base font-medium text-ink-500">{t('rentSuffix')}</span>
          </p>
          {raw.code && (
            <p className="font-mono text-sm text-ink-600">
              {t('pdfCode')} #{raw.code}
            </p>
          )}
        </div>

        {cover && (
          <div className="mt-4">
            {/* 主圖縮成 2:1（列印 5:2），縮圖一排 5 張（列印 7 張，14 張剛好 2 列），讓整份 PDF 控制在 2 頁 */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={cover} alt={p.title} className="pdf-avoid aspect-[2/1] w-full object-cover print:aspect-[5/2]" />
            {thumbs.length > 0 && (
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-5 print:grid-cols-7">
                {thumbs.map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt="" className="pdf-thumb aspect-[4/3] w-full object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        <section className="pdf-avoid mt-5 print:mt-4">
          <h2 className="mb-2 bg-ink-900 px-3 py-1.5 text-sm font-bold text-white">{t('basicInfo')}</h2>
          <dl className="grid grid-cols-1 gap-x-6 text-sm sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:text-xs">
            {[...priceRows, ...info].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-line py-1.5 print:py-1">
                <dt className="max-w-[45%] text-ink-500">{k}</dt>
                <dd className="min-w-0 break-words text-right font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {tagGroups.some(([, items]) => items.length > 0) && (
          <section className="pdf-avoid mt-5 space-y-2 text-sm print:mt-4 print:space-y-1 print:text-xs">
            {tagGroups
              .filter(([, items]) => items.length > 0)
              .map(([label, items]) => (
                <div key={label} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3 print:flex-row print:gap-3">
                  <p className="font-bold text-ink-700 sm:w-28 sm:shrink-0 print:w-28 print:shrink-0">{label}</p>
                  <p className="min-w-0 flex-1">{items.join(lang === 'zh' ? '、' : lang === 'ja' ? '・' : ', ')}</p>
                </div>
              ))}
          </section>
        )}

        {p.description && (
          <section className="mt-6 print:mt-4">
            <h2 className="mb-2 bg-ink-900 px-3 py-1.5 text-sm font-bold text-white">{t('descriptionHeading')}</h2>
            {/* 列印時分兩欄、字縮小，長描述也能控制在第 2 頁內 */}
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-700 print:columns-2 print:gap-6 print:text-[10.5px] print:leading-snug">{p.description}</p>
          </section>
        )}

        <section className="pdf-avoid mt-6 print:mt-4">
          <h2 className="mb-2 bg-ink-900 px-3 py-1.5 text-sm font-bold text-white">{t('mapHeading')}</h2>
          <p className="mb-2 break-words text-sm">
            <span className="font-bold">{t('addressLabel')}：</span>
            {address}
          </p>
          {/*
            地圖固定 700×200：列印時版面寬度跟螢幕不同，若用 100% 寬，Google 地圖會在列印當下重畫，
            常常只畫出一部分、定位圖釘也不見（英文／日文最明顯）。固定尺寸就不會重畫；
            手機螢幕較窄時置中裁切，圖釘仍在畫面中央。
          */}
          <div className="relative h-[200px] w-full overflow-hidden">
            <iframe
              title={t('mapHeading')}
              src={mapSrc}
              width={700}
              height={200}
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute left-1/2 top-0 -translate-x-1/2"
              style={{ border: 0, display: 'block', width: 700, height: 200, maxWidth: 'none' }}
            />
            {/* Google 地圖的定位圖釘印不出來：列印時在正中央（嵌入地圖以查詢地址為中心）補一個 */}
            <svg
              aria-hidden
              viewBox="0 0 24 36"
              className="pointer-events-none absolute left-1/2 top-1/2 hidden h-9 w-6 -translate-x-1/2 -translate-y-full print:block"
            >
              <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="#EA4335" stroke="#B31412" strokeWidth="1" />
              <circle cx="12" cy="12" r="4.5" fill="#B31412" />
            </svg>
          </div>
        </section>

        <footer className="pdf-avoid mt-6 flex items-center gap-3 border-t-2 border-ink-900 pt-4 text-sm sm:gap-4 print:mt-4 print:pt-3 print:text-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={OFFICIAL_LINE_QR_SRC} alt="LINE QR" className="h-20 w-20 shrink-0 print:h-16 print:w-16" />
          <div className="min-w-0 break-words">
            <p className="font-bold">{t('pdfContact')}</p>
            {company?.companyName && <p>{company.companyName}</p>}
            {company?.customerEmail && <p>{company.customerEmail}</p>}
            {company?.serviceHours && <p className="text-ink-500">{company.serviceHours}</p>}
            <p className="text-ink-500">{SITE_URL.replace(/^https?:\/\//, '')}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
