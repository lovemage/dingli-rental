import assert from 'node:assert/strict';
import { buildPropertyOrderBy } from '../src/lib/property-sort';

assert.deepEqual(
  buildPropertyOrderBy('created_desc'),
  [{ featured: 'desc' }, { createdAt: 'desc' }],
  'front-end new-to-old sort should use listing createdAt descending'
);

assert.deepEqual(
  buildPropertyOrderBy('created_asc'),
  [{ featured: 'desc' }, { createdAt: 'asc' }],
  'front-end old-to-new sort should use listing createdAt ascending'
);

assert.deepEqual(
  buildPropertyOrderBy('area_desc'),
  [{ featured: 'desc' }, { usableArea: 'desc' }],
  'area_desc should sort by usable area descending'
);

console.log('property-sort tests passed');
