export const HOMEPAGE_FEATURED_LIMIT = 6;

export function selectHomepageFeaturedItems<T>(
  items: T[],
  limit = HOMEPAGE_FEATURED_LIMIT,
  random = Math.random,
): T[] {
  if (items.length <= limit) return items;

  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, limit);
}
