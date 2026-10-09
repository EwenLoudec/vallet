const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletData = require('../src/data.js');
const { freshState } = require('./helpers.js');

const ACTION_COUNT = 2000;
const OCTOBER_DAYS = Array.from({ length: 20 }, (_, index) => `2026-10-${String(12 + index).padStart(2, '0')}`);

const createRandom = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648;
    return value / 2147483648;
  };
};

const overlapsAnotherReservation = (state, reservation) => state.reservations.some((other) => other.id !== reservation.id
  && other.ref === reservation.ref
  && other.start <= reservation.end
  && reservation.start <= other.end);

test('no sequence of bookings, workshop blocks and relocations ever creates a double booking', () => {
  const random = createRandom(42);
  const pick = (items) => items[Math.floor(random() * items.length)];
  const refs = ValletData.machines.map((machine) => machine.ref);
  let state = freshState();

  for (let step = 0; step < ACTION_COUNT; step += 1) {
    const action = pick(['book', 'book', 'book', 'block', 'unblock', 'relocate']);
    const [first, second] = [pick(OCTOBER_DAYS), pick(OCTOBER_DAYS)].sort();

    if (action === 'book') {
      const result = ValletRules.book(state, { ref: pick(refs), client: `Client ${step}`, start: first, end: second, enteredBy: pick(ValletData.agencies) });
      if (result.ok) {
        assert.equal(overlapsAnotherReservation(state, result.reservation), false, `step ${step}: booking ${JSON.stringify(result.reservation)}`);
        state = result.state;
      }
    }
    if (action === 'block') {
      const result = ValletRules.blockMachine(state, pick(refs), first, 'contrôle');
      state = result.ok ? result.state : state;
    }
    if (action === 'unblock') {
      state = ValletRules.unblockMachine(state, pick(refs)).state;
    }
    if (action === 'relocate') {
      const reservation = pick(state.reservations);
      const result = ValletRules.relocate(state, reservation.id, pick(refs));
      if (result.ok) {
        const moved = result.state.reservations.find((candidate) => candidate.id === reservation.id);
        assert.equal(overlapsAnotherReservation(result.state, moved), false, `step ${step}: relocation ${JSON.stringify(moved)}`);
        state = result.state;
      }
    }
  }
});
