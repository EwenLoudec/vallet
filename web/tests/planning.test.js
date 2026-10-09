const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletPlanning = require('../src/planning.js');
const ValletOperations = require('../src/operations.js');
const { freshState, updateMachine, photo } = require('./helpers.js');

const rowOf = (grid, ref) => grid.find((row) => row.machine.ref === ref);
const kindsBetween = (row, from, to) => row.cells.filter((cell) => cell.date >= from && cell.date <= to).map((cell) => cell.kind);

test('US13-1: the planning covers weeks 41 to 44 and marks today', () => {
  const days = ValletPlanning.days(freshState());

  assert.equal(days.length, 28);
  assert.equal(days[0].date, '2026-10-05');
  assert.equal(days[27].date, '2026-11-01');
  assert.deepEqual([...new Set(days.map((day) => day.week))], [41, 42, 43, 44]);
  assert.deepEqual(days.filter((day) => day.isToday).map((day) => day.date), ['2026-10-12']);
  assert.equal(days[0].isPast, true);
});

test('US13-2: NAC112 is booked for BTP Rhone and in conflict on the inherited double booking', () => {
  const row = rowOf(ValletPlanning.grid(freshState(), null), 'NAC112');

  assert.deepEqual(kindsBetween(row, '2026-10-13', '2026-10-19'), ['free', 'booked', 'booked', 'conflict', 'conflict', 'booked', 'free']);
  assert.equal(row.cells.find((cell) => cell.date === '2026-10-14').label, 'BTP Rhone');
  assert.equal(row.cells.find((cell) => cell.date === '2026-10-16').reservationId, 2);
});

test('US13-3: workshop days and expired VGP days', () => {
  const grid = ValletPlanning.grid(freshState(), null);

  assert.deepEqual([...new Set(kindsBetween(rowOf(grid, 'MINI07'), '2026-10-12', '2026-10-20'))], ['workshop']);
  assert.equal(rowOf(grid, 'MINI07').cells.find((cell) => cell.date === '2026-10-21').kind, 'free');
  assert.deepEqual([...new Set(kindsBetween(rowOf(grid, 'NAC089'), '2026-10-05', '2026-10-19'))], ['vgpExpired']);
  assert.deepEqual([...new Set(kindsBetween(rowOf(grid, 'NAC089'), '2026-10-20', '2026-10-31'))], ['conflict']);
  assert.equal(rowOf(grid, 'NAC089').cells.find((cell) => cell.date === '2026-11-01').kind, 'vgpExpired');
});

test('a machine already out shows as out', () => {
  const row = rowOf(ValletPlanning.grid(freshState(), null), 'ECH40');

  assert.deepEqual([...new Set(kindsBetween(row, '2026-10-06', '2026-10-24'))], ['out']);
  assert.equal(row.cells.find((cell) => cell.date === '2026-10-25').kind, 'free');
});

test('US13-4: the planning can be filtered by agency', () => {
  const lyon = ValletPlanning.grid(freshState(), 'Lyon Est');

  assert.deepEqual(lyon.map((row) => row.machine.ref), ['NAC112', 'NAC089', 'MINI07', 'COMP21', 'ECH40']);
  assert.equal(ValletPlanning.grid(freshState(), null).length, 12);
});

test('a sold machine leaves the planning', () => {
  const state = updateMachine(freshState(), 'ECH41', { sale: { price: 2500, status: 'sold' } });

  assert.equal(rowOf(ValletPlanning.grid(state, null), 'ECH41'), undefined);
});

test('US15-1: today at Lyon Est, one departure and no return', () => {
  const agenda = ValletPlanning.agenda(freshState(), 'Lyon Est');

  assert.deepEqual(agenda.departures.map((item) => [item.reservation.id, item.done]), [[4, false]]);
  assert.deepEqual(agenda.returns, []);
  assert.deepEqual(ValletPlanning.agenda(freshState(), 'Grenoble'), { departures: [], returns: [] });
});

test('US15-2: once out, the departure is done and the return is expected today', () => {
  const out = ValletOperations.recordDeparture(freshState(), 4, { date: '2026-10-12', photos: [photo('a.jpg')], notes: '', deposit: { amount: '500', method: 'cash' } }).state;
  const agenda = ValletPlanning.agenda(out, 'Lyon Est');

  assert.deepEqual(agenda.departures.map((item) => [item.reservation.id, item.done]), [[4, true]]);
  assert.deepEqual(agenda.returns.map((item) => [item.reservation.id, item.done]), [[4, false]]);
});

test('an early return frees the planning after the return day', () => {
  const booked = ValletRules.book(freshState(), { ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-15', enteredBy: 'Annecy' });
  const out = ValletOperations.recordDeparture(booked.state, 8, { date: '2026-10-13', photos: [photo('a.jpg')], notes: '' }).state;
  const returned = ValletOperations.recordReturn(out, 8, { date: '2026-10-13', photos: [photo('b.jpg')], notes: '', damages: [] }).state;

  assert.deepEqual(kindsBetween(rowOf(ValletPlanning.grid(returned, null), 'COMP30'), '2026-10-13', '2026-10-15'), ['returned', 'free', 'free']);
});
