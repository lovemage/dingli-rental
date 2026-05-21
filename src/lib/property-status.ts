export type ListingStatus = 'active' | 'rented' | 'sold' | 'closed';

const LISTING_STATUS_CLASS: Record<ListingStatus, string> = {
  active: 'bg-brand-green-700 text-white',
  rented: 'bg-ink-700 text-white',
  sold: 'bg-brand-orange-600 text-white',
  closed: 'bg-ink-300 text-ink-700',
};

export const LISTING_STATUS_BADGE: Record<ListingStatus, { label: string; className: string }> = {
  active: { label: '出租中', className: LISTING_STATUS_CLASS.active },
  rented: { label: '已出租', className: LISTING_STATUS_CLASS.rented },
  sold: { label: '售出', className: LISTING_STATUS_CLASS.sold },
  closed: { label: '結束', className: LISTING_STATUS_CLASS.closed },
};

export function listingStatusForPropertyStatus(
  status?: string | null,
  listingStatus?: string | null
): ListingStatus {
  if (status === 'inactive') return 'rented';
  if (listingStatus === 'rented' || listingStatus === 'sold' || listingStatus === 'closed') {
    return listingStatus;
  }
  return 'active';
}
