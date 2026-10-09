const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletChanges = require('../src/changes.js');
const ValletPlanning = require('../src/planning.js');
const ValletInbox = require('../src/inbox.js');
const ValletDashboard = require('../src/dashboard.js');
const ValletFleet = require('../src/fleet.js');
const ValletAccounts = require('../src/accounts.js');
const { freshState, codes } = require('./helpers.js');

const reservation = (state, id) => state.reservations.find((candidate) => candidate.id === id);
const statusOf = (state, id) => ValletRules.reservationStatuses(state).find((evaluation) => evaluation.reservation.id === id).status;

test('US19-1: moving BTP Rhone off NAC112 frees Duclos from the conflict', () => {
  const result = ValletChanges.reschedule(freshState(), 1, { start: '2026-10-19', end: '2026-10-20' });

  assert.equal(result.ok, true);
  assert.deepEqual([reservation(result.state, 1).start, reservation(result.state, 1).end], ['2026-10-19', '2026-10-20']);
  assert.equal(statusOf(result.state, 2), 'kept');
});

test('US19-2: a new period follows the booking rules and ignores the reservation itself', () => {
  assert.equal(ValletChanges.reschedule(freshState(), 6, { start: '2026-10-14', end: '2026-10-15' }).ok, true);
  assert.deepEqual(codes(ValletChanges.reschedule(freshState(), 1, { start: '2026-10-13', end: '2026-10-16' }).reasons), ['overlap']);
  assert.deepEqual(codes(ValletChanges.reschedule(freshState(), 1, { start: '2026-10-10', end: '2026-10-16' }).reasons), ['past']);
  assert.deepEqual(codes(ValletChanges.reschedule(freshState(), 1, { start: '2026-10-16', end: '2026-10-14' }).reasons), ['dateOrder']);
  assert.equal(ValletChanges.reschedule(freshState(), 1, { start: '2026-10-15', end: '2026-10-18' }).ok, false);
  assert.equal(ValletChanges.reschedule(freshState(), 1, { start: '2026-10-13', end: '2026-10-15' }).ok, true);
});

test('US19-3: a cancelled reservation frees its machine everywhere but stays listed', () => {
  const result = ValletChanges.cancel(freshState(), 4, { reason: 'Chantier reporté', by: 'Sandrine Morin' });

  assert.equal(result.ok, true);
  const pereira = reservation(result.state, 4);
  assert.equal(pereira.stage, 'cancelled');
  assert.deepEqual(pereira.cancellation, { date: '2026-10-12', reason: 'Chantier reporté', by: 'Sandrine Morin' });
  assert.equal(ValletRules.isCancelled(pereira), true);
  assert.equal(statusOf(result.state, 4), 'cancelled');
  assert.equal(ValletRules.search(result.state, 'Compacteur', '2026-10-12', '2026-10-12').available.some((machine) => machine.ref === 'COMP21'), true);
  const comp21 = ValletPlanning.grid(result.state, null).find((row) => row.machine.ref === 'COMP21');
  assert.equal(comp21.cells.find((cell) => cell.date === '2026-10-12').kind, 'free');
  assert.deepEqual(ValletPlanning.agenda(result.state, 'Lyon Est').departures, []);
  assert.equal(ValletDashboard.indicators(result.state).activeReservations, 6);
  assert.equal(result.state.reservations.length, 7);
});

test('a cancelled reservation to relocate is no longer to relocate and no longer blocks a sale', () => {
  const cancelled = ValletChanges.cancel(freshState(), 3, { reason: 'VGP échue', by: 'Mehdi Arfaoui' }).state;
  const onSale = ValletFleet.putOnSale(cancelled, 'NAC089', '9000').state;

  assert.equal(ValletDashboard.indicators(cancelled).toRelocate, 1);
  assert.equal(ValletFleet.markSold(onSale, 'NAC089').ok, true);
  assert.equal(ValletInbox.messagesFor(cancelled, 'Lyon Est').some((message) => message.kind === 'relocate'), false);
});

test('US19-4: only a booked reservation can be moved or cancelled, and a reason is required', () => {
  const cancelled = ValletChanges.cancel(freshState(), 4, { reason: 'Annulé', by: 'Sandrine Morin' }).state;

  assert.deepEqual(codes(ValletChanges.reschedule(freshState(), 5, { start: '2026-10-20', end: '2026-10-21' }).reasons), ['stage']);
  assert.deepEqual(codes(ValletChanges.cancel(freshState(), 5, { reason: 'x', by: 'y' }).reasons), ['stage']);
  assert.deepEqual(codes(ValletChanges.cancel(cancelled, 4, { reason: 'x', by: 'y' }).reasons), ['stage']);
  assert.deepEqual(codes(ValletChanges.reschedule(cancelled, 4, { start: '2026-10-13', end: '2026-10-13' }).reasons), ['stage']);
  assert.deepEqual(codes(ValletChanges.cancel(freshState(), 4, { reason: '  ', by: 'Sandrine Morin' }).reasons), ['missingField']);
});

test('US19-5: the purchase order of a key account can be filled in afterwards', () => {
  const result = ValletChanges.setPurchaseOrder(freshState(), 1, ' BC-2026-077 ');

  assert.equal(reservation(result.state, 1).purchaseOrder, 'BC-2026-077');
  assert.equal(ValletAccounts.missingPurchaseOrder(reservation(result.state, 1)), false);
  assert.deepEqual(codes(ValletChanges.setPurchaseOrder(freshState(), 4, 'BC-1').reasons), ['notKeyAccount']);
  assert.deepEqual(codes(ValletChanges.setPurchaseOrder(freshState(), 1, '').reasons), ['missingField']);
});

test('US19-6: the owner agency is told when another agency cancels', () => {
  const cancelled = ValletChanges.cancel(freshState(), 2, { reason: 'Doublon', by: 'Villeurbanne' }).state;
  const messages = ValletInbox.messagesFor(cancelled, 'Lyon Est');

  assert.equal(messages.some((message) => message.kind === 'booking' && message.reservationId === 2), false);
  assert.equal(messages.some((message) => message.kind === 'cancellation'
    && message.text === 'Villeurbanne a annulé la réservation de Maconnerie Duclos sur votre NAC112 (du 16/10/2026 au 17/10/2026) : Doublon.'), true);
});

test('an agency is not told about its own cancellations', () => {
  const cancelled = ValletChanges.cancel(freshState(), 4, { reason: 'Annulé', by: 'Lyon Est' }).state;

  assert.equal(ValletInbox.messagesFor(cancelled, 'Lyon Est').some((message) => message.kind === 'cancellation'), false);
});

test('US22-1: the next free period of the same length is proposed', () => {
  assert.deepEqual(ValletChanges.nextAvailability(freshState(), 'NAC112', '2026-10-17', '2026-10-20'), { start: '2026-10-19', end: '2026-10-22' });
  assert.deepEqual(ValletChanges.nextAvailability(freshState(), 'NAC140', '2026-10-17', '2026-10-20'), { start: '2026-10-24', end: '2026-10-27' });
});

test('US22-2: a machine in the workshop is proposed after its return', () => {
  assert.deepEqual(ValletChanges.nextAvailability(freshState(), 'MINI07', '2026-10-15', '2026-10-16'), { start: '2026-10-21', end: '2026-10-22' });
});

test('US22-3: a nacelle without valid VGP has no availability within 60 days', () => {
  assert.equal(ValletChanges.nextAvailability(freshState(), 'NAC118', '2026-10-17', '2026-10-20'), null);
  assert.equal(ValletChanges.nextAvailability(freshState(), 'NAC089', '2026-10-13', '2026-10-14'), null);
});

test('the search for availability never starts in the past', () => {
  assert.deepEqual(ValletChanges.nextAvailability(freshState(), 'COMP30', '2026-10-01', '2026-10-02'), { start: '2026-10-12', end: '2026-10-13' });
});

test('changes never modify the state they receive', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  ValletChanges.reschedule(state, 1, { start: '2026-10-19', end: '2026-10-20' });
  ValletChanges.cancel(state, 4, { reason: 'x', by: 'y' });
  ValletChanges.setPurchaseOrder(state, 1, 'BC');

  assert.equal(JSON.stringify(state), snapshot);
});
