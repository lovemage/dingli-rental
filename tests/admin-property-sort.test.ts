import assert from 'node:assert/strict';
import { sortAdminProperties } from '../src/lib/admin-property-sort';

const items = [
  { id: 1, rent: 20000, createdAt: '2026-01-01T00:00:00.000Z', usableArea: 10, buildingAge: 3 },
  { id: 2, rent: 10000, createdAt: '2026-03-01T00:00:00.000Z', usableArea: 30, buildingAge: 12 },
  { id: 3, rent: 30000, createdAt: '2026-02-01T00:00:00.000Z', usableArea: 20, buildingAge: 8 },
];

assert.deepEqual(
  sortAdminProperties(items, 'created_desc').map((x) => x.id),
  [2, 3, 1],
  'created_desc should sort new to old by listing createdAt'
);

assert.deepEqual(
  sortAdminProperties(items, 'created_asc').map((x) => x.id),
  [1, 3, 2],
  'created_asc should sort old to new by listing createdAt'
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

assert.deepEqual(
  sortAdminProperties(items, 'area_desc').map((x) => x.id),
  [2, 3, 1],
  'area_desc should show largest usable area first'
);

assert.deepEqual(
  sortAdminProperties(items, 'area_asc').map((x) => x.id),
  [1, 3, 2],
  'area_asc should show smallest usable area first'
);

console.log('admin-property-sort tests passed');
