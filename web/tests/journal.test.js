const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletJournal = require('../src/journal.js');
const { freshState } = require('./helpers.js');

test('US23-3: the journal starts empty', () => {
  assert.deepEqual(ValletJournal.latest(freshState(), 20), []);
});

test('US23-1: an entry records its author, the day and the action, newest first', () => {
  const booked = ValletRules.book(freshState(), { ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-15', enteredBy: 'Lyon Est' });
  const first = ValletJournal.record(booked.state, 'Sandrine Morin', ValletJournal.describeBooking(booked.reservation));
  const second = ValletJournal.record(first, 'Mehdi Arfaoui', 'VGP enregistrée : NAC089 le 12/10/2026');

  assert.deepEqual(ValletJournal.latest(second, 20), [
    { id: 2, date: '2026-10-12', author: 'Mehdi Arfaoui', text: 'VGP enregistrée : NAC089 le 12/10/2026' },
    { id: 1, date: '2026-10-12', author: 'Sandrine Morin', text: 'Réservation n° 8 : COMP30 pour BTP Rhone du 13/10/2026 au 15/10/2026' },
  ]);
});

test('the journal keeps only the requested number of latest entries', () => {
  let state = freshState();
  for (let index = 1; index <= 25; index += 1) {
    state = ValletJournal.record(state, 'Brice Vallet', `Action ${index}`);
  }

  const latest = ValletJournal.latest(state, 20);
  assert.equal(latest.length, 20);
  assert.equal(latest[0].text, 'Action 25');
  assert.equal(state.journal.length, 25);
});

test('recording never modifies the state it receives', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  ValletJournal.record(state, 'Brice Vallet', 'Action');

  assert.equal(JSON.stringify(state), snapshot);
});
