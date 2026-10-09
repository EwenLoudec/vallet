const test = require('node:test');
const assert = require('node:assert/strict');
const ValletFilters = require('../src/filters.js');
const ValletRules = require('../src/rules.js');
const { freshState } = require('./helpers.js');

const ids = (state, criteria) => ValletFilters.reservations(state, criteria).map((evaluation) => evaluation.reservation.id);

test('no criteria keeps every reservation, sorted by start date', () => {
  assert.deepEqual(ids(freshState(), {}), [5, 4, 7, 1, 2, 6, 3]);
});

test('US25-1: a client is found whatever the case or accents', () => {
  ['duclos', 'DUCLOS', 'Maçonnerie', '  maconnerie  '].forEach((query) => {
    assert.deepEqual(ids(freshState(), { query }), [2], query);
  });
});

test('US25-2: a machine reference finds its reservations', () => {
  assert.deepEqual(ids(freshState(), { query: 'nac112' }), [1, 2]);
});

test('US25-2: a number puts the matching reservation first, « n° » only searches numbers', () => {
  assert.equal(ids(freshState(), { query: '4' })[0], 4);
  assert.deepEqual(ids(freshState(), { query: 'n° 4' }), [4]);
  assert.deepEqual(ids(freshState(), { query: '#6' }), [6]);
});

test('US25-3: a purchase order is searchable', () => {
  const booked = ValletRules.book(freshState(), { ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-13', enteredBy: 'Annecy', purchaseOrder: 'BC-2026-118' }).state;

  assert.deepEqual(ids(booked, { query: 'bc-2026-118' }), [8]);
});

test('the entering agency and the contact are searchable', () => {
  const online = ValletRules.bookOnline(freshState(), { ref: 'COMP30', start: '2026-10-13', end: '2026-10-13', name: 'Léa Roux', phone: '06 01 02 03 04', email: '' }).state;

  assert.deepEqual(ids(online, { query: 'villeurbanne' }), [2]);
  assert.deepEqual(ids(online, { query: '06 01 02' }), [8]);
});

test('US25-4: filters by the agency of the machine and by stage', () => {
  assert.deepEqual(ids(freshState(), { agency: 'Grenoble' }), [6]);
  assert.deepEqual(ids(freshState(), { stage: 'out' }), [5]);
  assert.deepEqual(ids(freshState(), { agency: 'Lyon Est', stage: 'booked', query: 'btp' }), [1]);
});

test('US25-5: no match gives an empty list', () => {
  assert.deepEqual(ids(freshState(), { query: 'inconnu' }), []);
});
