const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletFleet = require('../src/fleet.js');
const { freshState, codes } = require('./helpers.js');

const machine = (state, ref) => state.machines.find((candidate) => candidate.ref === ref);

test('US6-1: VGP statuses on 12/10/2026', () => {
  const state = freshState();

  assert.deepEqual(ValletFleet.vgpStatus(state, machine(state, 'NAC089')), { status: 'expired', expiry: '2026-09-05', daysLeft: -37 });
  assert.deepEqual(ValletFleet.vgpStatus(state, machine(state, 'NAC118')), { status: 'dueSoon', expiry: '2026-10-15', daysLeft: 3 });
  assert.equal(ValletFleet.vgpStatus(state, machine(state, 'NAC112')).status, 'valid');
  assert.equal(ValletFleet.vgpStatus(state, machine(state, 'COMP21')), null);
});

test('US6-1: alerts list expired nacelles first, then those due within 30 days', () => {
  const alerts = ValletFleet.vgpAlerts(freshState());

  assert.deepEqual(alerts.map((alert) => [alert.machine.ref, alert.status]), [['NAC089', 'expired'], ['NAC118', 'dueSoon']]);
});

test('a nacelle due in exactly 30 days is in alert, in 31 days it is not', () => {
  const in30 = { ...freshState(), today: '2026-12-11' };
  const in31 = { ...freshState(), today: '2026-12-10' };

  assert.equal(ValletFleet.vgpStatus(in30, machine(in30, 'NAC112')).status, 'dueSoon');
  assert.equal(ValletFleet.vgpStatus(in31, machine(in31, 'NAC112')).status, 'valid');
});

test('US6-2: recording a VGP renews the nacelle and unblocks its reservation', () => {
  const result = ValletFleet.recordVgp(freshState(), 'NAC089', '2026-10-12');

  assert.equal(result.ok, true);
  assert.deepEqual(ValletFleet.vgpStatus(result.state, machine(result.state, 'NAC089')), { status: 'valid', expiry: '2027-04-12', daysLeft: 182 });
  assert.deepEqual(ValletFleet.vgpAlerts(result.state).map((alert) => alert.machine.ref), ['NAC118']);
  const martin = ValletRules.reservationStatuses(result.state).find((evaluation) => evaluation.reservation.id === 3);
  assert.equal(martin.status, 'kept');
});

test('US6-3: a VGP in the future, before the last one, or empty is refused', () => {
  assert.deepEqual(codes(ValletFleet.recordVgp(freshState(), 'NAC112', '2026-10-13').reasons), ['vgpDate']);
  assert.deepEqual(codes(ValletFleet.recordVgp(freshState(), 'NAC112', '2026-07-01').reasons), ['vgpDate']);
  assert.deepEqual(codes(ValletFleet.recordVgp(freshState(), 'NAC112', '').reasons), ['missingField']);
});

test('US6-4: a VGP can only be recorded on a nacelle', () => {
  assert.deepEqual(codes(ValletFleet.recordVgp(freshState(), 'COMP21', '2026-10-12').reasons), ['notNacelle']);
});

test('US12-1: a machine put on sale shows in the catalogue and stays bookable', () => {
  const result = ValletFleet.putOnSale(freshState(), 'ECH41', '2500');

  assert.equal(result.ok, true);
  assert.deepEqual(machine(result.state, 'ECH41').sale, { price: 2500, status: 'forSale' });
  assert.deepEqual(ValletFleet.catalogue(result.state).map((item) => item.ref), ['ECH41']);
  assert.equal(ValletRules.search(result.state, 'Echafaudage 40 m2', '2026-10-13', '2026-10-13').available.some((item) => item.ref === 'ECH41'), true);
});

test('US12-5: an empty, zero, negative or non numeric price is refused', () => {
  ['', '0', '-5', 'abc'].forEach((price) => {
    assert.deepEqual(codes(ValletFleet.putOnSale(freshState(), 'ECH41', price).reasons), ['price'], `price ${price}`);
  });
});

test('US12-2: a purchase request is recorded for a machine on sale', () => {
  const onSale = ValletFleet.putOnSale(freshState(), 'ECH41', '2500').state;
  const result = ValletFleet.requestPurchase(onSale, { ref: 'ECH41', name: 'Paul Girard', contact: '06 01 02 03 04' });

  assert.equal(result.ok, true);
  assert.deepEqual(result.state.leads, [{ id: 1, ref: 'ECH41', name: 'Paul Girard', contact: '06 01 02 03 04', date: '2026-10-12' }]);
});

test('a purchase request needs a name, a contact and a machine on sale', () => {
  const onSale = ValletFleet.putOnSale(freshState(), 'ECH41', '2500').state;

  assert.deepEqual(codes(ValletFleet.requestPurchase(onSale, { ref: 'ECH41', name: '', contact: '0601' }).reasons), ['missingField']);
  assert.deepEqual(codes(ValletFleet.requestPurchase(onSale, { ref: 'ECH41', name: 'Paul', contact: ' ' }).reasons), ['contact']);
  assert.deepEqual(codes(ValletFleet.requestPurchase(freshState(), { ref: 'ECH41', name: 'Paul', contact: '0601' }).reasons), ['notForSale']);
});

test('a machine can be withdrawn from sale', () => {
  const onSale = ValletFleet.putOnSale(freshState(), 'ECH41', '2500').state;

  assert.equal(machine(ValletFleet.withdrawSale(onSale, 'ECH41').state, 'ECH41').sale, null);
});

test('US12-3: a sold machine leaves the catalogue and the search', () => {
  const onSale = ValletFleet.putOnSale(freshState(), 'ECH41', '2500').state;
  const result = ValletFleet.markSold(onSale, 'ECH41');

  assert.equal(result.ok, true);
  assert.deepEqual(ValletFleet.catalogue(result.state), []);
  const search = ValletRules.search(result.state, 'Echafaudage 40 m2', '2026-10-25', '2026-10-25');
  assert.equal([...search.available, ...search.unavailable.map((entry) => entry.machine)].some((item) => item.ref === 'ECH41'), false);
});

test('US12-4: a machine with a reservation not returned yet cannot be sold', () => {
  const nac112 = ValletFleet.putOnSale(freshState(), 'NAC112', '18000').state;
  const ech40 = ValletFleet.putOnSale(freshState(), 'ECH40', '3000').state;

  assert.deepEqual(codes(ValletFleet.markSold(nac112, 'NAC112').reasons), ['activeReservation']);
  assert.deepEqual(codes(ValletFleet.markSold(ech40, 'ECH40').reasons), ['activeReservation']);
});

test('a machine must be on sale before being marked sold', () => {
  assert.deepEqual(codes(ValletFleet.markSold(freshState(), 'ECH41').reasons), ['notForSale']);
});

test('fleet operations never modify the state they receive', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  ValletFleet.recordVgp(state, 'NAC089', '2026-10-12');
  ValletFleet.putOnSale(state, 'ECH41', '2500');

  assert.equal(JSON.stringify(state), snapshot);
});
