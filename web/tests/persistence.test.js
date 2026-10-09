const test = require('node:test');
const assert = require('node:assert/strict');
const ValletPersistence = require('../src/persistence.js');
const ValletOperations = require('../src/operations.js');
const ValletJournal = require('../src/journal.js');
const ValletRules = require('../src/rules.js');
const { freshState } = require('./helpers.js');

const PHOTO = { name: 'depart.jpg', url: 'data:image/jpeg;base64,/9j/4AAQ' };
const SIGNATURE = { name: 'Jean Pereira', image: 'data:image/png;base64,iVBORw0KGgo=' };

const busyState = () => {
  const out = ValletOperations.recordDeparture(freshState(), 4, {
    date: '2026-10-12', photos: [PHOTO], notes: 'Bon état', deposit: { amount: '500', method: 'card-hold' }, signature: SIGNATURE,
  }).state;
  const booked = ValletRules.book(out, { ref: 'COMP30', client: 'BTP Rhone', start: '2026-10-13', end: '2026-10-15', enteredBy: 'Annecy' });
  return ValletJournal.record(booked.state, 'Sandrine Morin', ValletJournal.describeBooking(booked.reservation));
};

test('US24-1: the whole state survives a save and a restore', () => {
  const state = busyState();
  const restored = ValletPersistence.restore(ValletPersistence.serialize(state), freshState());

  assert.equal(restored.source, 'saved');
  assert.deepEqual(restored.state, state);
  assert.deepEqual(restored.state.reservations.find((reservation) => reservation.id === 4).departure.signature, SIGNATURE);
});

test('nothing saved yet means the starting data', () => {
  const restored = ValletPersistence.restore(null, freshState());

  assert.equal(restored.source, 'seed');
  assert.equal(restored.problem, null);
  assert.deepEqual(restored.state, freshState());
});

test('US24-3: unreadable, outdated or incomplete data falls back to the starting data', () => {
  const seed = freshState();

  assert.deepEqual(
    [ValletPersistence.restore('{not json', seed).problem, ValletPersistence.restore('{not json', seed).source],
    ['unreadable', 'seed'],
  );
  assert.equal(ValletPersistence.restore(JSON.stringify({ version: 1, state: seed }), seed).problem, 'version');
  assert.equal(ValletPersistence.restore(JSON.stringify({ version: ValletPersistence.DATA_VERSION, state: { machines: [] } }), seed).problem, 'shape');
  assert.equal(ValletPersistence.restore(JSON.stringify('texte'), seed).problem, 'shape');
});

test('the saved envelope carries the data version', () => {
  const envelope = JSON.parse(ValletPersistence.serialize(freshState()));

  assert.equal(envelope.version, ValletPersistence.DATA_VERSION);
  assert.deepEqual(Object.keys(envelope.state).sort(), ['inboxRead', 'journal', 'keyAccounts', 'leads', 'machines', 'reservations', 'today']);
});
