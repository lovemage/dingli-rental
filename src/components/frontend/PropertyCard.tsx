'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import MaterialIcon from '@/components/MaterialIcon';
import { formatFloorLine } from '@/lib/property-floor';
import {
  classifyFeatureTags,
  getDerivedTags,
  mergeTags,
  TONE_CLASS,
  type Tag,
} from '@/lib/property-tags';
import {
  listingStatusForPropertyStatus,
  type ListingStatus,
} from '@/lib/property-status';

export const LISTING_STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: 'active', label: '出租中' },
  { value: 'rented', label: '已出租' },
  { value: 'sold',   label: '售出' },
  { value: 'closed', label: '結束' },
];

const LISTING_STATUS_CLASS: Record<ListingStatus, string> = {
  active: 'bg-brand-green-700 text-white',
  rented: 'bg-ink-700 text-white',
  sold:   'bg-brand-orange-600 text-white',
  closed: 'bg-ink-300 text-ink-700',
};

export type PropertyCardData = {
  id: number;
  code?: string | null;
  title: string;
  region: string;
  district: string;
  street?: string | null;
  community?: string | null;
  typeMid: string;
  buildingType?: string | null;
  rooms: number;
  bathrooms: number;
  livingRooms?: number;
  openLayout?: boolean | null;
  usableArea: number;
  rent: number;
  imageUrl: string | null;
  featureTags?: string[];
  buildingAge?: number | null;
  hasElevator?: boolean | null;
  petsAllowed?: boolean | null;
  cookingAllowed?: boolean | null;
  description?: string | null;
  hideAddress?: boolean | null;
  featured?: boolean | null;
  status?: string | null;
  listingStatus?: ListingStatus | string | null;
  parkingType?: string | null;
  floorType?: string | null;
  floor?: string | null;
  totalFloor?: string | null;
};

type Props = {
  property: PropertyCardData;
  /** 顯示多少個標籤，預設 3 */
  maxTags?: number;
  variant?: 'card' | 'mobileList';
  /** 隱藏「中/小分類」與「可開伙/電梯/寵物」這兩列標籤；首頁使用 */
  hideTags?: boolean;
};

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

export default function PropertyCard({ property: p, maxTags = 3, variant = 'card', hideTags = false }: Props) {
  const t = useTranslations('propertyCard');
  const locale = useLocale();
  const [copied, setCopied] = useState(false);

  const locParts = [p.region, p.district];
  if (p.street) locParts.push(p.street);
  const locationLine = locParts.filter(Boolean).join('・');
  const categoryTags = [...new Set([p.typeMid, p.buildingType].filter(Boolean) as string[])];

  const policyAndCustom = classifyFeatureTags(p.featureTags);
  const derived = getDerivedTags(p);
  const allTags = mergeTags(
    policyAndCustom.filter((t) => t.tone === 'green'),
    derived,
    policyAndCustom.filter((t) => t.tone !== 'green'),
  ).slice(0, maxTags);

  const statusKey = listingStatusForPropertyStatus(p.status, p.listingStatus);
  const statusLabelKey =
    statusKey === 'rented' ? 'statusRented'
    : statusKey === 'sold'   ? 'statusSold'
    : statusKey === 'closed' ? 'statusClosed'
    : 'statusActive';
  const statusClassName = LISTING_STATUS_CLASS[statusKey] ?? LISTING_STATUS_CLASS.active;
  const isMobileList = variant === 'mobileList';

  async function copyCode(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (!p.code) return;
    try {
      await navigator.clipboard.writeText(p.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Link
      href={localePath(locale, `/properties/${p.id}`)}
      className={isMobileList
        ? 'group flex flex-row overflow-hidden border border-line bg-white shadow-none transition-all duration-300 hover:bg-paper-2/60 sm:flex-col sm:rounded-xl sm:shadow-sm sm:hover:-translate-y-1 sm:hover:shadow-lg'
        : 'group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col border border-line'}
    >
      <div className={isMobileList
        ? 'relative aspect-square w-[42%] shrink-0 overflow-hidden bg-paper-2 sm:w-full sm:aspect-[4/3]'
        : 'relative aspect-[4/3] overflow-hidden bg-paper-2'}>
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
            alt={p.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink-300 text-sm">—</div>
        )}

        <div className={isMobileList
          ? 'absolute left-2 right-2 top-2 flex items-start justify-between gap-1.5 pointer-events-none sm:left-3 sm:right-3 sm:top-3 sm:gap-2'
          : 'absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none'}>
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className={`${statusClassName} text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-sm whitespace-nowrap`}>
              {t(statusLabelKey)}
            </span>
            {p.featured && (
              <span className="bg-brand-orange-500 text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full shadow-sm whitespace-nowrap">
                ★ {t('featured')}
              </span>
            )}
          </div>
          <span className="hidden bg-white/95 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap shrink-0 sm:inline-flex">
            {p.typeMid}
          </span>
        </div>
      </div>

      <div className={isMobileList ? 'min-w-0 flex flex-1 flex-col p-3 sm:p-5' : 'p-5 flex flex-col flex-1'}>
        {p.code && (
          <div className="mb-1 flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold tracking-wider text-ink-400">編號 {p.code}</span>
            <button
              type="button"
              onClick={copyCode}
              className="inline-flex items-center justify-center rounded-full border border-line bg-white text-ink-500 hover:text-brand-green-700 hover:border-brand-green-500 w-5 h-5 transition"
              aria-label="複製物件編號"
              title="複製物件編號"
            >
              <MaterialIcon name={copied ? 'check' : 'content_copy'} className="!text-xs" />
            </button>
          </div>
        )}
        <h3 className="text-lg sm:text-2xl font-black text-brand-green-900 mb-1 tracking-tight whitespace-nowrap">
          {t('currencyPrefix')} {p.rent.toLocaleString()}
          <span className="text-xs sm:text-sm text-ink-500 font-medium">{t('rentSuffix')}</span>
        </h3>
        <h4 className="text-sm sm:text-base font-bold mb-1.5 line-clamp-2 sm:line-clamp-1 group-hover:text-brand-green-700 transition">
          {p.title}
        </h4>
        <p className="text-xs sm:text-sm text-ink-500 mb-2 flex items-center gap-1 line-clamp-1">
          <span>📍</span>
          <span className="truncate">{locationLine}</span>
        </p>
        {!hideTags && categoryTags.length > 0 && (
          <div className={isMobileList ? 'mb-2 hidden flex-wrap gap-1.5 sm:flex' : 'mb-3 flex flex-wrap gap-1.5'}>
            {categoryTags.map((tag) => (
              <span key={tag} className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-paper text-ink-700 border-line">
                {tag}
              </span>
            ))}
          </div>
        )}

        {!hideTags && allTags.length > 0 && (
          <TagPills tags={allTags} className={isMobileList ? 'mb-3 hidden sm:flex' : 'mb-4'} />
        )}

        <div className={isMobileList
          ? 'mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-2 text-[11px] text-ink-700 sm:gap-x-4 sm:gap-y-2 sm:pt-4 sm:text-xs'
          : 'flex flex-wrap gap-x-4 gap-y-2 pt-4 border-t border-line text-xs text-ink-700 mt-auto'}>
          <span className="flex items-center gap-1">
            <SpecIcon type="rooms" />
            {p.openLayout ? '開放式' : `${t('rooms', { count: p.rooms })}${t('livingRooms', { count: p.livingRooms ?? 0 })}`}
          </span>
          {!p.openLayout && (
            <span className="flex items-center gap-1">
              <SpecIcon type="bathrooms" />
              {t('bathrooms', { count: p.bathrooms })}
            </span>
          )}
          <span className="flex items-center gap-1">
            <SpecIcon type="area" />
            {t('ping', { count: p.usableArea })}
          </span>
          {p.parkingType && (
            <span className="flex items-center gap-1">
              <SpecIcon type="parking" />
              有
            </span>
          )}
          {p.floor && (
            <span className="flex items-center gap-1">
              <SpecIcon type="floor" />
              {formatFloorLine(p.floorType, p.floor, p.totalFloor)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// 樓層格式化工具改放在 src/lib/property-floor.ts，
// 以便 server component 與 client component 都能安全 import（見下方 import）。
// 此處保留 re-export 以維持既有外部呼叫端的相容性。
export { formatFloorLine, splitMultiFloor } from '@/lib/property-floor';

function SpecIcon({ type }: { type: 'rooms' | 'bathrooms' | 'area' | 'parking' | 'floor' }) {
  if (type === 'rooms') {
    return (
      <svg className="h-4 w-4 shrink-0 text-ink-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M4 19v-7.375L3 12.4q-.35.25-.75.2t-.65-.4t-.187-.75t.387-.65l8.975-6.875q.275-.2.588-.3t.637-.1t.638.1t.587.3l9 6.875q.325.25.375.65t-.2.75q-.25.325-.65.375t-.725-.2L20 11.625V19q0 .825-.587 1.413T18 21H6q-.825 0-1.412-.587T4 19m2 0h12v-8.9l-6-4.575L6 10.1zm2-4q.425 0 .713-.288T9 14t-.288-.712T8 13t-.712.288T7 14t.288.713T8 15m4 0q.425 0 .713-.288T13 14t-.288-.712T12 13t-.712.288T11 14t.288.713T12 15m4 0q.425 0 .713-.288T17 14t-.288-.712T16 13t-.712.288T15 14t.288.713T16 15M6 19h12z"
        />
      </svg>
    );
  }
  if (type === 'bathrooms') {
    return (
      <svg className="h-4 w-4 shrink-0 text-ink-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 18q-.425 0-.712-.288T7 17t.288-.712T8 16t.713.288T9 17t-.288.713T8 18m4 0q-.425 0-.712-.288T11 17t.288-.712T12 16t.713.288T13 17t-.288.713T12 18m4 0q-.425 0-.712-.288T15 17t.288-.712T16 16t.713.288T17 17t-.288.713T16 18M5 14v-2q0-2.65 1.7-4.6T11 5.1V3h2v2.1q2.6.35 4.3 2.3T19 12v2zm2-2h10q0-2.075-1.463-3.537T12 7T8.463 8.463T7 12m1 9q-.425 0-.712-.288T7 20t.288-.712T8 19t.713.288T9 20t-.288.713T8 21m4 0q-.425 0-.712-.288T11 20t.288-.712T12 19t.713.288T13 20t-.288.713T12 21m4 0q-.425 0-.712-.288T15 20t.288-.712T16 19t.713.288T17 20t-.288.713T16 21m-4-9"
        />
      </svg>
    );
  }
  if (type === 'area') {
    return (
      <svg className="h-4 w-4 shrink-0 text-ink-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 11v8a1 1 0 0 0 1 1h8M4 6V5a1 1 0 0 1 1-1h1m5 0h2m5 0h1a1 1 0 0 1 1 1v1m0 5v2m0 5v1a1 1 0 0 1-1 1h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 12h7a1 1 0 0 1 1 1v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'floor') {
    // 樓高/樓層 icon：兩棟並排的窗格大樓
    return (
      <svg
        className="h-4 w-4 shrink-0 text-ink-700"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M3 21V7h4V3h10v8h4v10h-8v-4h-2v4zm2-2h2v-2H5zm0-4h2v-2H5zm0-4h2V9H5zm4 4h2v-2H9zm0-4h2V9H9zm0-4h2V5H9zm4 8h2v-2h-2zm0-4h2V9h-2zm0-4h2V5h-2zm4 12h2v-2h-2zm0-4h2v-2h-2z"
        />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4 shrink-0 text-ink-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 20a2 2 0 1 0 4 0a2 2 0 0 0-4 0m10 0a2 2 0 1 0 4 0a2 2 0 0 0-4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9m-6-6h15m-6 0V9M3 6l9-4l9 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TagPills({ tags, className = '' }: { tags: Tag[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <span
          key={t.label}
          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${TONE_CLASS[t.tone]}`}
        >
          {t.label}
        </span>
      ))}
    </div>
  );
}
