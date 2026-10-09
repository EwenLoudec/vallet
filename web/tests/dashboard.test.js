const test = require('node:test');
const assert = require('node:assert/strict');
const ValletDashboard = require('../src/dashboard.js');
const ValletOperations = require('../src/operations.js');
const { freshState, photo } = require('./helpers.js');

test('US18-1: indicators on the starting data', () => {
  const indicators = ValletDashboard.indicators(freshState());

  assert.equal(indicators.activeReservations, 7);
  assert.equal(indicators.toRelocate, 2);
  assert.equal(indicators.vgpAlerts, 2);
  assert.equal(indicators.inWorkshop, 1);
  assert.equal(indicators.departuresWithoutPhoto, 1);
  assert.deepEqual(indicators.keyAccountShare, { keyAccount: 2, total: 7 });
  assert.equal(indicators.damagesRecovered, 0);
  assert.equal(indicators.lastYearLosses, 85000);
});

test('US18-2: recovered damages add the retained deposit and the rest to invoice', () => {
  const out = ValletOperations.recordDeparture(freshState(), 4, { date: '2026-10-12', photos: [photo('a.jpg')], notes: '', deposit: { amount: '500', method: 'cash' } }).state;
  const returned = ValletOperations.recordReturn(out, 4, { date: '2026-10-12', photos: [photo('b.jpg')], notes: '', damages: [{ description: 'Vérin', amount: '800' }] }).state;

  const indicators = ValletDashboard.indicators(returned);
  assert.equal(indicators.damagesRecovered, 800);
  assert.equal(indicators.activeReservations, 6);
});

test('US18-3: occupancy per agency over weeks 42 to 44', () => {
  const occupancy = ValletDashboard.occupancy(freshState());
  const byAgency = Object.fromEntries(occupancy.map((line) => [line.agency, [line.occupiedDays, line.capacityDays]]));

  assert.deepEqual(byAgency['Lyon Est'], [31, 105]);
  assert.deepEqual(byAgency.Grenoble, [5, 21]);
  assert.deepEqual(byAgency['Saint-Étienne'], [2, 21]);
  assert.deepEqual(byAgency.Annecy, [0, 42]);
  assert.equal(occupancy.length, 7);
});
