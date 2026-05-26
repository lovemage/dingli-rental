import assert from 'node:assert/strict';
import { buildPropertyOrderBy } from '../src/lib/property-sort';

assert.deepEqual(
  buildPropertyOrderBy('created_desc'),
  [{ createdAt: 'desc' }],
  'front-end new-to-old sort should use listing createdAt descending'
);

assert.deepEqual(
  buildPropertyOrderBy('created_asc'),
  [{ createdAt: 'asc' }],
  'front-end old-to-new sort should use listing createdAt ascending'
);

assert.deepEqual(
  buildPropertyOrderBy('area_desc'),
  [{ usableArea: 'desc' }],
  'area_desc should sort by usable area descending'
);

assert.deepEqual(
  buildPropertyOrderBy(''),
  [{ createdAt: 'desc' }],
  'default sort should use createdAt descending'
);

console.log('property-sort tests passed');
