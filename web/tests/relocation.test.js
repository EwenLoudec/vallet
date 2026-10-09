const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes } = require('./helpers.js');

const statusOf = (state, reservationId) => ValletRules.reservationStatuses(state)
  .find((evaluation) => evaluation.reservation.id === reservationId);

test('US4-1: the inherited double booking and the expired VGP are to relocate, nothing else', () => {
  const statuses = ValletRules.reservationStatuses(freshState());
  const toRelocate = statuses.filter((evaluation) => evaluation.status === 'toRelocate');

  assert.deepEqual(toRelocate.map((evaluation) => evaluation.reservation.id), [2, 3]);
  assert.deepEqual(codes(toRelocate[0].reasons), ['overlap']);
  assert.match(toRelocate[0].reasons[0].message, /BTP Rhone/);
  assert.deepEqual(codes(toRelocate[1].reasons), ['vgp']);
  assert.match(toRelocate[1].reasons[0].message, /05\/09\/2026/);
  assert.equal(statuses.filter((evaluation) => evaluation.status === 'kept').length, 5);
});

test('US4-1: Duclos can move to NAC140', () => {
  assert.deepEqual(ValletRules.alternatives(freshState(), 2).map((machine) => machine.ref), ['NAC140']);
});

test('US4-2: Façades Martin has no other 16 m nacelle', () => {
  assert.deepEqual(ValletRules.alternatives(freshState(), 3), []);
});

test('US4-3: a relocated reservation keeps its client, dates and agency and is kept', () => {
  const result = ValletRules.relocate(freshState(), 2, 'NAC140');

  assert.equal(result.ok, true);
  const duclos = statusOf(result.state, 2);
  assert.equal(duclos.status, 'kept');
  assert.equal(duclos.reservation.ref, 'NAC140');
  assert.equal(duclos.reservation.client, 'Maconnerie Duclos');
  assert.equal(duclos.reservation.start, '2026-10-16');
  assert.equal(duclos.reservation.end, '2026-10-17');
  assert.equal(duclos.reservation.enteredBy, 'Villeurbanne');
});

test('a relocation onto a machine without a valid VGP is refused', () => {
  const result = ValletRules.relocate(freshState(), 2, 'NAC118');

  assert.equal(result.ok, false);
  assert.deepEqual(codes(result.reasons), ['vgp']);
});

test('a relocation onto another type of machine is refused', () => {
  const result = ValletRules.relocate(freshState(), 2, 'NAC201');

  assert.equal(result.ok, false);
  assert.deepEqual(codes(result.reasons), ['otherType']);
});

test('relocating never modifies the state it receives', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  ValletRules.relocate(state, 2, 'NAC140');

  assert.equal(JSON.stringify(state), snapshot);
});
