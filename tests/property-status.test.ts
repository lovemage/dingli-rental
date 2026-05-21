import assert from 'node:assert/strict';
import { listingStatusForPropertyStatus } from '../src/lib/property-status';

assert.equal(
  listingStatusForPropertyStatus('inactive', 'active'),
  'rented',
  'inactive properties should surface as rented on public-facing badges'
);

assert.equal(
  listingStatusForPropertyStatus('active', 'rented'),
  'rented',
  'explicit listing status should be preserved for active properties'
);

assert.equal(
  listingStatusForPropertyStatus('active', 'closed'),
  'closed',
  'closed listing status should be preserved'
);

console.log('property-status tests passed');
