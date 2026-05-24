'use client';

import { useState } from 'react';
import PropertyCard, { type PropertyCardData } from '@/components/frontend/PropertyCard';
import PropertyFilters, { type MobilePropertyViewMode } from '@/components/frontend/PropertyFilters';
import type { Taxonomies } from '@/lib/taxonomies-shared';

type Props = {
  cards: PropertyCardData[];
  total: number;
  taxonomies: Partial<Taxonomies>;
};

export default function PropertyResults({ cards, total, taxonomies }: Props) {
  const [mobileViewMode, setMobileViewMode] = useState<MobilePropertyViewMode>('double');

  return (
    <>
      <PropertyFilters
        total={total}
        taxonomies={taxonomies}
        mobileViewMode={mobileViewMode}
        onMobileViewModeChange={setMobileViewMode}
      />

      <div
        id="properties-grid"
        className={`scroll-mt-24 grid sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-7 mt-8 ${
          mobileViewMode === 'single' ? 'grid-cols-1 gap-3' : 'grid-cols-1 gap-0'
        }`}
      >
        {cards.map((p) => (
          <PropertyCard key={p.id} property={p} variant={mobileViewMode === 'double' ? 'mobileList' : 'card'} />
        ))}
      </div>
    </>
  );
}
