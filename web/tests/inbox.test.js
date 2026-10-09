const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletInbox = require('../src/inbox.js');
const { freshState } = require('./helpers.js');

const keysOf = (messages) => messages.map((message) => message.key);

test('US14-1: Lyon Est is told that Villeurbanne booked its NAC112', () => {
  const messages = ValletInbox.messagesFor(freshState(), 'Lyon Est');
  const duclos = messages.find((message) => message.reservationId === 2);

  assert.equal(duclos.kind, 'booking');
  assert.equal(duclos.text, 'Villeurbanne a réservé votre NAC112 du 16/10/2026 au 17/10/2026 pour Maconnerie Duclos.');
  assert.equal(duclos.read, false);
});

test('US14-3: Lyon Est is told that its Facades Martin reservation is to relocate', () => {
  const messages = ValletInbox.messagesFor(freshState(), 'Lyon Est');

  assert.deepEqual(messages.map((message) => [message.kind, message.reservationId]), [['relocate', 3], ['booking', 2]]);
  assert.match(messages[0].text, /Facades Martin/);
  assert.match(messages[0].text, /VGP non à jour/);
});

test('the agency that entered a reservation is not told about its own booking', () => {
  assert.deepEqual(ValletInbox.messagesFor(freshState(), 'Grenoble'), []);
  assert.deepEqual(ValletInbox.messagesFor(freshState(), 'Saint-Étienne'), []);
});

test('US14-2: a booking by another agency adds a new unread message', () => {
  const before = ValletInbox.unreadCount(freshState(), 'Lyon Est');
  const booked = ValletRules.book(freshState(), { ref: 'COMP21', client: 'Artisan Ferreira', start: '2026-10-14', end: '2026-10-14', enteredBy: 'Grenoble' }).state;

  assert.equal(ValletInbox.unreadCount(booked, 'Lyon Est'), before + 1);
  assert.equal(ValletInbox.messagesFor(booked, 'Lyon Est').some((message) => message.text === 'Grenoble a réservé votre COMP21 du 14/10/2026 au 14/10/2026 pour Artisan Ferreira.'), true);
});

test('an online booking is notified to the agency of the machine', () => {
  const booked = ValletRules.bookOnline(freshState(), { ref: 'COMP30', start: '2026-10-13', end: '2026-10-13', name: 'Léa Roux', phone: '0601', email: '' }).state;

  assert.equal(ValletInbox.messagesFor(booked, 'Annecy')[0].text, 'Un client en ligne a réservé votre COMP30 du 13/10/2026 au 13/10/2026 pour Léa Roux.');
});

test('US14-3: a reservation that becomes to relocate warns the agency that entered it', () => {
  const blocked = ValletRules.blockMachine(freshState(), 'MINI12', '2026-10-14', 'fuite').state;

  assert.equal(ValletInbox.messagesFor(blocked, 'Saint-Étienne').some((message) => message.kind === 'relocate' && message.reservationId === 7), true);
});

test('US14-4: messages are marked read one by one or all at once', () => {
  const state = freshState();
  const [first] = ValletInbox.messagesFor(state, 'Lyon Est');

  const oneRead = ValletInbox.markRead(state, 'Lyon Est', first.key);
  assert.equal(ValletInbox.unreadCount(oneRead, 'Lyon Est'), 1);
  assert.equal(ValletInbox.messagesFor(oneRead, 'Lyon Est')[0].read, true);

  const allRead = ValletInbox.markAllRead(state, 'Lyon Est');
  assert.equal(ValletInbox.unreadCount(allRead, 'Lyon Est'), 0);
  assert.deepEqual(keysOf(ValletInbox.messagesFor(allRead, 'Lyon Est')), keysOf(ValletInbox.messagesFor(state, 'Lyon Est')));
  assert.equal(ValletInbox.unreadCount(state, 'Lyon Est'), 2);
});

test('a relocated reservation notifies the owner of the new machine', () => {
  const relocated = ValletRules.relocate(freshState(), 2, 'NAC140').state;

  assert.equal(ValletInbox.messagesFor(relocated, 'Grenoble').some((message) => message.reservationId === 2 && message.kind === 'booking'), true);
  assert.equal(ValletInbox.messagesFor(relocated, 'Lyon Est').some((message) => message.reservationId === 2), false);
});
