import assert from 'node:assert/strict';
import { sortAdminProperties } from '../src/lib/admin-property-sort';

const items = [
  { id: 1, rent: 20000, createdAt: '2026-01-01T00:00:00.000Z', usableArea: 10 },
  { id: 2, rent: 10000, createdAt: '2026-03-01T00:00:00.000Z', usableArea: 30 },
  { id: 3, rent: 30000, createdAt: '2026-02-01T00:00:00.000Z', usableArea: 20 },
];

assert.deepEqual(
  sortAdminProperties(items, 'created_desc').map((x) => x.id),
  [2, 3, 1],
  'default admin property sort should show latest first'
);

assert.deepEqual(
  sortAdminProperties(items, 'rent_desc').map((x) => x.id),
  [3, 1, 2],
  'rent_desc should show highest rent first'
);

assert.deepEqual(
  sortAdminProperties(items, 'rent_asc').map((x) => x.id),
  [2, 1, 3],
  'rent_asc should show lowest rent first'
);

console.log('admin-property-sort tests passed');
