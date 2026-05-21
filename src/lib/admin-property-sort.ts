import type { PropertySort } from '@/lib/property-sort';

export type AdminPropertySort = Exclude<PropertySort, ''>;

export type AdminSortableProperty = {
  rent: number;
  usableArea: number;
  createdAt: string;
};

export function sortAdminProperties<T extends AdminSortableProperty>(
  items: readonly T[],
  sort: AdminPropertySort
): T[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    switch (sort) {
      case 'rent_desc':
        return b.rent - a.rent;
      case 'rent_asc':
        return a.rent - b.rent;
      case 'created_asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'area_desc':
        return b.usableArea - a.usableArea;
      case 'area_asc':
        return a.usableArea - b.usableArea;
      case 'created_desc':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  return sorted;
}
