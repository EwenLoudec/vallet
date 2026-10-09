const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletAccounts = require('../src/accounts.js');
const ValletOperations = require('../src/operations.js');
const { freshState, photo } = require('./helpers.js');

const booking = (overrides) => ({
  ref: 'COMP30', client: 'BTP Rhône', start: '2026-10-13', end: '2026-10-13', enteredBy: 'Annecy', ...overrides,
});

test('US16-1: a key account is recognised whatever the case, accents or spaces', () => {
  ['BTP Rhone', 'BTP Rhône', '  btp   rhone ', 'BTP RHÔNE'].forEach((name) => {
    assert.equal(ValletRules.findKeyAccount(freshState(), name).id, 'btp-rhone', name);
  });
  assert.equal(ValletRules.findKeyAccount(freshState(), 'Artisan Ferreira'), null);
});

test('US16-1: a booking for a key account records the account and the purchase order', () => {
  const result = ValletRules.book(freshState(), booking({ purchaseOrder: ' BC-2026-118 ' }));

  assert.equal(result.reservation.keyAccountId, 'btp-rhone');
  assert.equal(result.reservation.purchaseOrder, 'BC-2026-118');
  assert.equal(ValletAccounts.missingPurchaseOrder(result.reservation), false);
});

test('US16-2: a key account booking without purchase order is accepted but flagged', () => {
  const result = ValletRules.book(freshState(), booking({}));

  assert.equal(result.ok, true);
  assert.equal(result.reservation.purchaseOrder, null);
  assert.equal(ValletAccounts.missingPurchaseOrder(result.reservation), true);
});

test('other customers have no key account and no purchase order, even if one is typed', () => {
  const artisan = ValletRules.book(freshState(), booking({ client: 'Artisan Ferreira', purchaseOrder: 'X1' })).reservation;
  const privateNamesake = ValletRules.book(freshState(), booking({ customerType: 'particulier' })).reservation;

  assert.equal(artisan.keyAccountId, null);
  assert.equal(artisan.purchaseOrder, null);
  assert.equal(ValletAccounts.missingPurchaseOrder(artisan), false);
  assert.equal(privateNamesake.keyAccountId, null);
});

test('US17-1: a key account only sees its own reservations', () => {
  const reservations = ValletAccounts.reservationsOf(freshState(), 'btp-rhone');

  assert.deepEqual(reservations.map((reservation) => [reservation.id, reservation.ref]), [[1, 'NAC112'], [6, 'NAC140']]);
});

test('US16-3: a nacelle leaving for a key account sends its VGP certificate', () => {
  const result = ValletOperations.recordDeparture(freshState(), 1, { date: '2026-10-14', photos: [photo('a.jpg')], notes: '' });
  const nac112 = result.state.reservations.find((reservation) => reservation.id === 1);

  assert.deepEqual(nac112.departure.certificateSentTo, { email: 'conducteurs@btp-rhone.fr', date: '2026-10-12' });
});

test('US16-4: no certificate is sent for a machine that is not a nacelle or a private customer', () => {
  const comp = ValletRules.book(freshState(), booking({}));
  const compOut = ValletOperations.recordDeparture(comp.state, comp.reservation.id, { date: '2026-10-13', photos: [photo('a.jpg')], notes: '' }).state;
  const pereira = ValletOperations.recordDeparture(freshState(), 4, { date: '2026-10-12', photos: [photo('a.jpg')], notes: '', deposit: { amount: '500', method: 'cash' } }).state;

  assert.equal('certificateSentTo' in compOut.reservations.find((reservation) => reservation.id === comp.reservation.id).departure, false);
  assert.equal('certificateSentTo' in pereira.reservations.find((reservation) => reservation.id === 4).departure, false);
});
