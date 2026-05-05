'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  classifyFeatureTags,
  getDerivedTags,
  mergeTags,
  TONE_CLASS,
  type Tag,
} from '@/lib/property-tags';

export type ListingStatus = 'active' | 'rented' | 'sold' | 'closed';

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

// 兼容既有引用
export const LISTING_STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  active: { label: '出租中', className: LISTING_STATUS_CLASS.active },
  rented: { label: '已出租', className: LISTING_STATUS_CLASS.rented },
  sold:   { label: '售出',   className: LISTING_STATUS_CLASS.sold },
  closed: { label: '結束',   className: LISTING_STATUS_CLASS.closed },
};

export type PropertyCardData = {
  id: number;
  title: string;
  region: string;
  district: string;
  street?: string | null;
  community?: string | null;
  typeMid: string;
  rooms: number;
  bathrooms: number;
  livingRooms?: number;
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
  listingStatus?: ListingStatus | string | null;
};

type Props = {
  property: PropertyCardData;
  /** 顯示多少個標籤，預設 3 */
  maxTags?: number;
};

function localePath(locale: string, path: string) {
  if (locale === 'zh') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

export default function PropertyCard({ property: p, maxTags = 3 }: Props) {
  const t = useTranslations('propertyCard');
  const locale = useLocale();

  const locParts = [p.region, p.district];
  if (!p.hideAddress) {
    if (p.community) locParts.push(p.community);
    else if (p.street) locParts.push(p.street);
  }
  const locationLine = locParts.filter(Boolean).join('・');

  const policyAndCustom = classifyFeatureTags(p.featureTags);
  const derived = getDerivedTags(p);
  const allTags = mergeTags(
    policyAndCustom.filter((t) => t.tone === 'green'),
    derived,
    policyAndCustom.filter((t) => t.tone !== 'green'),
  ).slice(0, maxTags);

  const statusKey = (p.listingStatus ?? 'active') as ListingStatus;
  const statusLabelKey =
    statusKey === 'rented' ? 'statusRented'
    : statusKey === 'sold'   ? 'statusSold'
    : statusKey === 'closed' ? 'statusClosed'
    : 'statusActive';
  const statusClassName = LISTING_STATUS_CLASS[statusKey] ?? LISTING_STATUS_CLASS.active;

  return (
    <Link
      href={localePath(locale, `/properties/${p.id}`)}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col border border-line"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-paper-2">
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

        <span className={`absolute top-3 left-3 ${statusClassName} text-xs font-bold px-3 py-1 rounded-full shadow-sm`}>
          {t(statusLabelKey)}
        </span>

        {p.featured && (
          <span className="absolute top-3 left-[84px] bg-brand-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            ★ {t('featured')}
          </span>
        )}

        <span className="absolute top-3 right-3 bg-white/95 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          {p.typeMid}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-2xl font-black text-brand-green-900 mb-1 tracking-tight">
          {t('currencyPrefix')} {p.rent.toLocaleString()}
          <span className="text-sm text-ink-500 font-medium">{t('rentSuffix')}</span>
        </h3>
        <h4 className="text-base font-bold mb-1.5 line-clamp-1 group-hover:text-brand-green-700 transition">
          {p.title}
        </h4>
        <p className="text-sm text-ink-500 mb-3 flex items-center gap-1 line-clamp-1">
          <span>📍</span>
          <span className="truncate">{locationLine}</span>
        </p>

        {allTags.length > 0 && (
          <TagPills tags={allTags} className="mb-4" />
        )}

        <div className="flex gap-4 pt-4 border-t border-line text-xs text-ink-700 mt-auto">
          <span className="flex items-center gap-1">🛏 {t('rooms', { count: p.rooms })}</span>
          <span className="flex items-center gap-1">🚿 {t('bathrooms', { count: p.bathrooms })}</span>
          <span className="flex items-center gap-1">📐 {t('ping', { count: p.usableArea })}</span>
        </div>
      </div>
    </Link>
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
