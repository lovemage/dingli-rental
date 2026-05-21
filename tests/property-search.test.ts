import assert from 'node:assert/strict';
import { buildAdminPropertyWhere, buildPublicPropertyWhere } from '../src/lib/property-search';

const publicOneRoomWhere = buildPublicPropertyWhere({ rooms: '1' }, 'zh');
assert.deepEqual(publicOneRoomWhere.rooms, 1, 'public rooms=1 should match exactly 1 room');

const publicFourPlusWhere = buildPublicPropertyWhere({ rooms: '4' }, 'zh');
assert.deepEqual(publicFourPlusWhere.rooms, { gte: 4 }, 'public rooms=4 should keep 4+ behavior');

const adminAddressWhere = buildAdminPropertyWhere('天母西路') as any;
const adminFields = adminAddressWhere.OR.map((clause: Record<string, unknown>) => Object.keys(clause)[0]);
for (const field of ['street', 'lane', 'alley', 'number', 'numberSub']) {
  assert.ok(adminFields.includes(field), `admin keyword search should include ${field}`);
}

console.log('property-search tests passed');
