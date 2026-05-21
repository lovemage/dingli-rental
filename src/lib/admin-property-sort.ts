export type AdminPropertySort = 'created_desc' | 'rent_desc' | 'rent_asc';

export type AdminSortableProperty = {
  rent: number;
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
      case 'created_desc':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });
  return sorted;
}
