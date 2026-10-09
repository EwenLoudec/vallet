const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes } = require('./helpers.js');

const onlineRequest = (overrides) => ({
  ref: 'COMP30', start: '2026-10-13', end: '2026-10-13', name: 'Léa Roux', phone: '06 01 02 03 04', email: '', ...overrides,
});

test('US11-3: an online booking is a private customer entered online', () => {
  const result = ValletRules.bookOnline(freshState(), onlineRequest({}));

  assert.equal(result.ok, true);
  assert.equal(result.reservation.client, 'Léa Roux');
  assert.equal(result.reservation.customerType, 'particulier');
  assert.equal(result.reservation.enteredBy, 'Réservation en ligne');
  assert.equal(result.reservation.contact, '06 01 02 03 04');
});

test('the online contact keeps both the phone and the e-mail', () => {
  const result = ValletRules.bookOnline(freshState(), onlineRequest({ email: 'lea@exemple.fr' }));

  assert.equal(result.reservation.contact, '06 01 02 03 04 · lea@exemple.fr');
});

test('US11-5: an online booking needs a name and a phone or an e-mail', () => {
  assert.deepEqual(codes(ValletRules.bookOnline(freshState(), onlineRequest({ name: ' ' })).reasons), ['missingField']);
  assert.deepEqual(codes(ValletRules.bookOnline(freshState(), onlineRequest({ phone: '', email: '' })).reasons), ['contact']);
});

test('US11-4: an online booking blocks the machine for the agencies', () => {
  const online = ValletRules.bookOnline(freshState(), onlineRequest({})).state;
  const agency = ValletRules.book(online, { ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-13', enteredBy: 'Annecy' });

  assert.deepEqual(codes(agency.reasons), ['overlap']);
});

test('US11-2: online customers cannot book a machine already booked, in the workshop or in the past', () => {
  assert.deepEqual(codes(ValletRules.bookOnline(freshState(), onlineRequest({ ref: 'NAC112', start: '2026-10-16', end: '2026-10-17' })).reasons), ['overlap', 'overlap']);
  assert.deepEqual(codes(ValletRules.bookOnline(freshState(), onlineRequest({ ref: 'MINI07', start: '2026-10-15', end: '2026-10-15' })).reasons), ['workshop']);
  assert.deepEqual(codes(ValletRules.bookOnline(freshState(), onlineRequest({ start: '2026-10-10', end: '2026-10-10' })).reasons), ['past']);
});
