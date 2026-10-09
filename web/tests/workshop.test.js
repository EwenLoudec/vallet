const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes } = require('./helpers.js');

const isOffered = (state, type, start, end, ref) => ValletRules.search(state, type, start, end)
  .available.some((machine) => machine.ref === ref);

const statusOf = (state, reservationId) => ValletRules.reservationStatuses(state)
  .find((evaluation) => evaluation.reservation.id === reservationId);

test('US3-1: a machine blocked by the workshop is not offered until the day after', () => {
  const result = ValletRules.blockMachine(freshState(), 'ECH41', '2026-10-16', 'bâche déchirée');

  assert.equal(result.ok, true);
  assert.equal(isOffered(result.state, 'Echafaudage 40 m2', '2026-10-14', '2026-10-15', 'ECH41'), false);
  assert.equal(isOffered(result.state, 'Echafaudage 40 m2', '2026-10-17', '2026-10-18', 'ECH41'), true);
});

test('US3-2: a machine back in service is offered again', () => {
  const result = ValletRules.unblockMachine(freshState(), 'MINI07');

  assert.equal(result.ok, true);
  assert.equal(isOffered(result.state, 'Mini-pelle 1.8 t', '2026-10-15', '2026-10-16', 'MINI07'), true);
});

test('US3-3: blocking a booked machine puts its reservation to relocate', () => {
  const result = ValletRules.blockMachine(freshState(), 'MINI12', '2026-10-14', 'fuite hydraulique');

  const ferreira = statusOf(result.state, 7);
  assert.equal(ferreira.status, 'toRelocate');
  assert.deepEqual(codes(ferreira.reasons), ['workshop']);
});

test('the workshop cannot block a machine without a date or until a past date', () => {
  const withoutDate = ValletRules.blockMachine(freshState(), 'ECH41', '', 'bâche déchirée');
  assert.equal(withoutDate.ok, false);
  assert.deepEqual(codes(withoutDate.reasons), ['missingField']);

  const inThePast = ValletRules.blockMachine(freshState(), 'ECH41', '2026-10-11', 'bâche déchirée');
  assert.equal(inThePast.ok, false);
  assert.deepEqual(codes(inThePast.reasons), ['past']);
});

test('blocking never modifies the state it receives', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  ValletRules.blockMachine(state, 'ECH41', '2026-10-16', 'bâche déchirée');
  ValletRules.unblockMachine(state, 'MINI07');

  assert.equal(JSON.stringify(state), snapshot);
});
