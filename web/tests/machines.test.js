const test = require('node:test');
const assert = require('node:assert/strict');
const ValletMachines = require('../src/machines.js');
const ValletOperations = require('../src/operations.js');
const ValletFleet = require('../src/fleet.js');
const { freshState, photo } = require('./helpers.js');

test('US26-1: the record of NAC112 shows its VGP, condition and reservations', () => {
  const history = ValletMachines.history(freshState(), 'NAC112');

  assert.equal(history.machine.ref, 'NAC112');
  assert.deepEqual(history.vgp, { status: 'valid', expiry: '2027-01-10', daysLeft: 90 });
  assert.equal(history.condition, 'available');
  assert.deepEqual(history.reservations.map((entry) => [entry.reservation.id, entry.status]), [[1, 'kept'], [2, 'toRelocate']]);
  assert.equal(history.rentedDays, 0);
  assert.equal(history.damagesTotal, 0);
});

test('US26-2: returned rentals add their days and damages', () => {
  const out = ValletOperations.recordDeparture(freshState(), 4, { date: '2026-10-12', photos: [photo('a.jpg')], notes: '', deposit: { amount: '500', method: 'cash' } }).state;
  const returned = ValletOperations.recordReturn(out, 4, { date: '2026-10-12', photos: [photo('b.jpg')], notes: '', damages: [{ description: 'Rayure', amount: '120' }] }).state;

  const history = ValletMachines.history(returned, 'COMP21');
  assert.equal(history.rentedDays, 1);
  assert.equal(history.damagesTotal, 120);
});

test('the condition follows the workshop and the sale', () => {
  const onSale = ValletFleet.putOnSale(freshState(), 'ECH41', '2500').state;
  const sold = ValletFleet.markSold(onSale, 'ECH41').state;

  assert.equal(ValletMachines.history(freshState(), 'MINI07').condition, 'workshop');
  assert.equal(ValletMachines.history(onSale, 'ECH41').condition, 'forSale');
  assert.equal(ValletMachines.history(sold, 'ECH41').condition, 'sold');
  assert.equal(ValletMachines.history(freshState(), 'COMP21').vgp, null);
});

test('an unknown machine has no record', () => {
  assert.equal(ValletMachines.history(freshState(), 'XXX'), null);
});
