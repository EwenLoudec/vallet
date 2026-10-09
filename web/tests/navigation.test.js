const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletFilters = require('../src/filters.js');
const ValletPlanning = require('../src/planning.js');
const ValletDashboard = require('../src/dashboard.js');
const ValletOperations = require('../src/operations.js');
const ValletChanges = require('../src/changes.js');
const { freshState, photo } = require('./helpers.js');

const refs = (machines) => machines.map((machine) => machine.ref);
const unavailableRefs = (result) => result.unavailable.map((entry) => entry.machine.ref);
const ids = (state, criteria) => ValletFilters.reservations(state, criteria).map((evaluation) => evaluation.reservation.id);

test('US27-1: a type without reference gives exactly the 001 result', () => {
  const criteria = { type: 'Nacelle 12 m', ref: '', start: '2026-10-16', end: '2026-10-17' };

  assert.deepEqual(ValletFilters.searchMachines(freshState(), criteria), ValletRules.search(freshState(), 'Nacelle 12 m', '2026-10-16', '2026-10-17'));
});

test('US27-2: a partial reference over every type, whatever the case', () => {
  ['nac1', 'NAC1', ' Nac1 '].forEach((ref) => {
    const result = ValletFilters.searchMachines(freshState(), { type: '', ref, start: '2026-10-16', end: '2026-10-17' });
    assert.deepEqual(refs(result.available), ['NAC140'], ref);
    assert.deepEqual(unavailableRefs(result), ['NAC112', 'NAC118'], ref);
  });
});

test('US27-3: every type and no reference lists every machine not sold', () => {
  const result = ValletFilters.searchMachines(freshState(), { type: '', ref: '', start: '2026-11-02', end: '2026-11-02' });

  assert.equal(result.available.length + result.unavailable.length, 12);
});

test('US27-4: a type and a reference that do not match give nothing', () => {
  const result = ValletFilters.searchMachines(freshState(), { type: 'Nacelle 12 m', ref: 'COMP', start: '2026-10-16', end: '2026-10-17' });

  assert.deepEqual(result, { available: [], unavailable: [] });
});

test('US28-1 and US28-2: list filters match the dashboard indicators', () => {
  const state = freshState();
  const indicators = ValletDashboard.indicators(state);

  assert.equal(ids(state, { stage: 'active' }).length, indicators.activeReservations);
  assert.deepEqual(ids(state, { stage: 'toRelocate' }), [2, 3]);
  assert.equal(ids(state, { stage: 'toRelocate' }).length, indicators.toRelocate);
});

test('US28-4: quick filters for missing photos, key accounts and damages', () => {
  const state = freshState();
  const indicators = ValletDashboard.indicators(state);

  assert.deepEqual(ids(state, { only: 'noPhoto' }), [5]);
  assert.equal(ids(state, { only: 'noPhoto' }).length, indicators.departuresWithoutPhoto);
  assert.deepEqual(ids(state, { only: 'keyAccount' }), [1, 6]);
  assert.equal(ids(state, { only: 'keyAccount' }).length, indicators.keyAccountShare.keyAccount);
  assert.deepEqual(ids(state, { only: 'damages' }), []);

  const out = ValletOperations.recordDeparture(state, 4, { date: '2026-10-12', photos: [photo('a.jpg')], notes: '', deposit: { amount: '500', method: 'cash' } }).state;
  const returned = ValletOperations.recordReturn(out, 4, { date: '2026-10-12', photos: [photo('b.jpg')], notes: '', damages: [{ description: 'Rayure', amount: '120' }] }).state;
  assert.deepEqual(ids(returned, { only: 'damages' }), [4]);
  assert.equal(ids(returned, { stage: 'active' }).length, ValletDashboard.indicators(returned).activeReservations);
});

test('a cancelled key account reservation leaves the key account filter', () => {
  const cancelled = ValletChanges.cancel(freshState(), 6, { reason: 'Reporté', by: 'Grenoble' }).state;

  assert.deepEqual(ids(cancelled, { only: 'keyAccount' }), [1]);
  assert.equal(ids(cancelled, { stage: 'active' }).length, ValletDashboard.indicators(cancelled).activeReservations);
});

test('US29-1: a company name keeps its machines and marks its days', () => {
  ['btp', 'BTP Rhône', '  btp rhone '].forEach((query) => {
    const rows = ValletPlanning.filterByClient(ValletPlanning.grid(freshState(), null), query);
    assert.deepEqual(rows.map((row) => row.machine.ref), ['NAC112', 'NAC140'], query);
    const nac112 = rows[0];
    assert.equal(nac112.cells.find((cell) => cell.date === '2026-10-14').matches, true);
    assert.equal(nac112.cells.find((cell) => cell.date === '2026-10-16').matches, true);
    assert.equal(nac112.cells.find((cell) => cell.date === '2026-10-20').matches, false);
  });
});

test('an empty company search keeps the planning untouched', () => {
  const grid = ValletPlanning.grid(freshState(), null);

  assert.deepEqual(ValletPlanning.filterByClient(grid, '  '), grid);
});

test('US29-2: the company search combines with the agency filter', () => {
  const rows = ValletPlanning.filterByClient(ValletPlanning.grid(freshState(), 'Grenoble'), 'btp');

  assert.deepEqual(rows.map((row) => row.machine.ref), ['NAC140']);
});

test('US29-3: no company match, and cancelled reservations are not found', () => {
  const cancelled = ValletChanges.cancel(freshState(), 6, { reason: 'Reporté', by: 'Grenoble' }).state;

  assert.deepEqual(ValletPlanning.filterByClient(ValletPlanning.grid(freshState(), null), 'inconnu'), []);
  assert.deepEqual(ValletPlanning.filterByClient(ValletPlanning.grid(cancelled, null), 'btp').map((row) => row.machine.ref), ['NAC112']);
});
