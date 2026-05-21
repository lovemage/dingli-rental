import type { Prisma } from '@/generated/prisma/client';

export type PropertySort =
  | ''
  | 'rent_desc'
  | 'rent_asc'
  | 'created_desc'
  | 'created_asc'
  | 'area_desc'
  | 'area_asc';

export const PROPERTY_SORT_OPTIONS: { labelKey: string; value: Exclude<PropertySort, ''> }[] = [
  { labelKey: 'sortRentDesc', value: 'rent_desc' },
  { labelKey: 'sortRentAsc', value: 'rent_asc' },
  { labelKey: 'sortCreatedDesc', value: 'created_desc' },
  { labelKey: 'sortCreatedAsc', value: 'created_asc' },
  { labelKey: 'sortAreaDesc', value: 'area_desc' },
  { labelKey: 'sortAreaAsc', value: 'area_asc' },
];

export function buildPropertyOrderBy(sort?: string): Prisma.PropertyOrderByWithRelationInput[] {
  const featuredFirst: Prisma.PropertyOrderByWithRelationInput[] = [{ featured: 'desc' }];
  switch (sort) {
    case 'created_desc':
    case 'newest':
      return [...featuredFirst, { createdAt: 'desc' }];
    case 'created_asc':
      return [...featuredFirst, { createdAt: 'asc' }];
    case 'rent_asc':
      return [...featuredFirst, { rent: 'asc' }];
    case 'rent_desc':
      return [...featuredFirst, { rent: 'desc' }];
    case 'area_desc':
      return [...featuredFirst, { usableArea: 'desc' }];
    case 'area_asc':
      return [...featuredFirst, { usableArea: 'asc' }];
    default:
      return featuredFirst;
  }
}
