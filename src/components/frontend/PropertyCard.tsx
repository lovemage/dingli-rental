import Link from 'next/link';
import {
  classifyFeatureTags,
  getDerivedTags,
  mergeTags,
  TONE_CLASS,
  type Tag,
} from '@/lib/property-tags';

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
};

type Props = {
  property: PropertyCardData;
  /** 顯示多少個標籤，預設 3 */
  maxTags?: number;
};

export default function PropertyCard({ property: p, maxTags = 3 }: Props) {
  const locParts = [p.region, p.district];
  if (!p.hideAddress) {
    if (p.community) locParts.push(p.community);
    else if (p.street) locParts.push(p.street);
  }
  const locationLine = locParts.filter(Boolean).join('・');

  const policyAndCustom = classifyFeatureTags(p.featureTags);
  const derived = getDerivedTags(p);
  // 制度標籤優先 → 衍生標籤 → 自由特色，限制顯示數量
  const allTags = mergeTags(
    policyAndCustom.filter((t) => t.tone === 'green'),
    derived,
    policyAndCustom.filter((t) => t.tone !== 'green'),
  ).slice(0, maxTags);

  return (
    <Link
      href={`/properties/${p.id}`}
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
          <div className="w-full h-full grid place-items-center text-ink-300 text-sm">暫無圖片</div>
        )}

        {/* 左上：出租 badge */}
        <span className="absolute top-3 left-3 bg-brand-green-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
          出租
        </span>

        {/* 精選標記（疊在出租右側） */}
        {p.featured && (
          <span className="absolute top-3 left-[72px] bg-brand-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
            ★ 精選
          </span>
        )}

        {/* 右上：類型 */}
        <span className="absolute top-3 right-3 bg-white/95 text-ink-700 text-xs font-medium px-2.5 py-1 rounded-full shadow-sm">
          {p.typeMid}
        </span>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-2xl font-black text-brand-green-900 mb-1 tracking-tight">
          NT$ {p.rent.toLocaleString()}
          <span className="text-sm text-ink-500 font-medium"> / 月</span>
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
          <span className="flex items-center gap-1">🛏 {p.rooms} 房</span>
          <span className="flex items-center gap-1">🚿 {p.bathrooms} 衛</span>
          <span className="flex items-center gap-1">📐 {p.usableArea} 坪</span>
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
