const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes } = require('./helpers.js');

const bookingRequest = (overrides) => ({
  ref: 'COMP30',
  client: 'BTP Rhône',
  start: '2026-10-13',
  end: '2026-10-15',
  enteredBy: 'Valence',
  ...overrides,
});

test('US2-1: a free machine is booked and is no longer offered on those dates', () => {
  const result = ValletRules.book(freshState(), bookingRequest({}));

  assert.equal(result.ok, true);
  assert.equal(result.reservation.id, 8);
  assert.equal(result.reservation.enteredBy, 'Valence');
  assert.equal(result.reservation.client, 'BTP Rhône');

  const search = ValletRules.search(result.state, 'Compacteur', '2026-10-14', '2026-10-14');
  assert.equal(search.available.some((machine) => machine.ref === 'COMP30'), false);
});

test('US2-2: an overlapping booking is refused and names the conflicting reservation', () => {
  const result = ValletRules.book(freshState(), bookingRequest({ ref: 'NAC112', start: '2026-10-17', end: '2026-10-20' }));

  assert.equal(result.ok, false);
  assert.deepEqual(codes(result.reasons), ['overlap']);
  const message = result.reasons[0].message;
  assert.match(message, /BTP Rhone/);
  assert.match(message, /14\/10\/2026/);
  assert.match(message, /18\/10\/2026/);
  assert.match(message, /Lyon Est/);
});

test('US2-3: a machine in the workshop cannot be booked', () => {
  const result = ValletRules.book(freshState(), bookingRequest({ ref: 'MINI07', start: '2026-10-19', end: '2026-10-22' }));

  assert.equal(result.ok, false);
  assert.deepEqual(codes(result.reasons), ['workshop']);
});

test('US2-4: a nacelle without a valid VGP cannot be booked', () => {
  const result = ValletRules.book(freshState(), bookingRequest({ ref: 'NAC089', start: '2026-10-13', end: '2026-10-14' }));

  assert.equal(result.ok, false);
  assert.deepEqual(codes(result.reasons), ['vgp']);
});

test('US2-5: a booking in the past or with reversed dates is refused', () => {
  const inThePast = ValletRules.book(freshState(), bookingRequest({ start: '2026-10-10', end: '2026-10-11' }));
  assert.equal(inThePast.ok, false);
  assert.deepEqual(codes(inThePast.reasons), ['past']);

  const reversed = ValletRules.book(freshState(), bookingRequest({ start: '2026-10-15', end: '2026-10-13' }));
  assert.equal(reversed.ok, false);
  assert.deepEqual(codes(reversed.reasons), ['dateOrder']);
});

test('a booking without client or agency is refused', () => {
  const withoutClient = ValletRules.book(freshState(), bookingRequest({ client: '   ' }));
  assert.equal(withoutClient.ok, false);
  assert.deepEqual(codes(withoutClient.reasons), ['missingField']);

  const withoutAgency = ValletRules.book(freshState(), bookingRequest({ enteredBy: '' }));
  assert.equal(withoutAgency.ok, false);
  assert.deepEqual(codes(withoutAgency.reasons), ['missingField']);
});

test('a one-day booking is accepted', () => {
  const result = ValletRules.book(freshState(), bookingRequest({ start: '2026-10-12', end: '2026-10-12' }));

  assert.equal(result.ok, true);
});

test('booking never modifies the state it receives', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  ValletRules.book(state, bookingRequest({}));

  assert.equal(JSON.stringify(state), snapshot);
});
