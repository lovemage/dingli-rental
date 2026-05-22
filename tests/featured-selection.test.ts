import assert from 'node:assert/strict';
import { HOMEPAGE_FEATURED_LIMIT, selectHomepageFeaturedItems } from '../src/lib/featured-selection';

const small = [1, 2, 3];
assert.deepEqual(
  selectHomepageFeaturedItems(small, HOMEPAGE_FEATURED_LIMIT, () => 0.5),
  small,
  'items below limit should keep original order'
);

const large = [1, 2, 3, 4, 5, 6, 7, 8];
const picked = selectHomepageFeaturedItems(large, 6, () => 0);
assert.equal(picked.length, 6, 'items above limit should be truncated to homepage limit');
assert.equal(new Set(picked).size, 6, 'random selection should not duplicate featured items');
assert.deepEqual(picked, [2, 3, 4, 5, 6, 7], 'selection should use shuffled ordering when featured count exceeds limit');

console.log('featured-selection tests passed');
