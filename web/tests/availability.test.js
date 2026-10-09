const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes, updateReservation, updateMachine } = require('./helpers.js');

const isOffered = (state, type, start, end, ref) => ValletRules.search(state, type, start, end)
  .available.some((machine) => machine.ref === ref);

const statusOf = (state, id) => ValletRules.reservationStatuses(state)
  .find((evaluation) => evaluation.reservation.id === id);

test('US7-7: an early return frees the machine from the day after the return', () => {
  const booked = ValletRules.book(freshState(), {
    ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-15', enteredBy: 'Annecy',
  }).state;
  assert.equal(isOffered(booked, 'Compacteur', '2026-10-14', '2026-10-14', 'COMP30'), false);

  const returnedEarly = updateReservation(booked, 8, { stage: 'returned', return: { date: '2026-10-13' } });

  assert.equal(isOffered(returnedEarly, 'Compacteur', '2026-10-13', '2026-10-13', 'COMP30'), false);
  assert.equal(isOffered(returnedEarly, 'Compacteur', '2026-10-14', '2026-10-14', 'COMP30'), true);
});

test('a reservation already out or returned is never to relocate', () => {
  const blocked = ValletRules.blockMachine(freshState(), 'ECH40', '2026-10-20', 'contrôle').state;

  assert.equal(statusOf(blocked, 5).status, 'kept');
});

test('a booked reservation still becomes to relocate when its machine is blocked', () => {
  const blocked = ValletRules.blockMachine(freshState(), 'MINI12', '2026-10-14', 'fuite').state;

  assert.equal(statusOf(blocked, 7).status, 'toRelocate');
});

test('a sold machine disappears from search and cannot be booked', () => {
  const state = updateMachine(freshState(), 'ECH41', { sale: { price: 2500, status: 'sold' } });
  const result = ValletRules.search(state, 'Echafaudage 40 m2', '2026-10-13', '2026-10-13');

  assert.equal([...result.available, ...result.unavailable.map((entry) => entry.machine)].some((machine) => machine.ref === 'ECH41'), false);
  const booking = ValletRules.book(state, { ref: 'ECH41', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-13', enteredBy: 'Valence' });
  assert.deepEqual(codes(booking.reasons), ['sold']);
});

test('a machine for sale but not sold yet stays bookable', () => {
  const state = updateMachine(freshState(), 'ECH41', { sale: { price: 2500, status: 'forSale' } });

  assert.equal(isOffered(state, 'Echafaudage 40 m2', '2026-10-13', '2026-10-13', 'ECH41'), true);
});

test('a booking records the customer type, professional by default, and starts as booked', () => {
  const professional = ValletRules.book(freshState(), { ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-13', enteredBy: 'Annecy' });
  const individual = ValletRules.book(freshState(), { ref: 'COMP30', client: 'Mme Roux', start: '2026-10-13', end: '2026-10-13', enteredBy: 'Annecy', customerType: 'particulier' });

  assert.equal(professional.reservation.customerType, 'professionnel');
  assert.equal(professional.reservation.stage, 'booked');
  assert.equal(professional.reservation.departure, null);
  assert.equal(individual.reservation.customerType, 'particulier');
});
