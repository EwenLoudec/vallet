const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const ValletOperations = require('../src/operations.js');
const { freshState, codes, photo } = require('./helpers.js');

const PEREIRA = 4;
const BTP_NAC112 = 1;

const reservation = (state, id) => state.reservations.find((candidate) => candidate.id === id);

const departPereira = (state, overrides) => ValletOperations.recordDeparture(state, PEREIRA, {
  date: '2026-10-12',
  photos: [photo('depart.jpg')],
  notes: 'Bon état',
  deposit: { amount: '500', method: 'card-hold' },
  ...overrides,
});

const returnPereira = (state, overrides) => ValletOperations.recordReturn(state, PEREIRA, {
  date: '2026-10-12',
  photos: [photo('retour.jpg')],
  notes: '',
  damages: [{ description: 'Rayure capot', amount: '120' }],
  ...overrides,
});

test('US7-1: a departure without photo is refused', () => {
  const result = departPereira(freshState(), { photos: [] });

  assert.deepEqual(codes(result.reasons), ['noPhoto']);
  assert.equal(result.reasons[0].message, 'Ajoutez au moins une photo de la machine au départ.');
});

test('US7-2 and US8: a private customer leaves with a photo and a deposit', () => {
  const result = departPereira(freshState(), {});

  assert.equal(result.ok, true);
  const pereira = reservation(result.state, PEREIRA);
  assert.equal(pereira.stage, 'out');
  assert.deepEqual(pereira.departure, {
    date: '2026-10-12', photos: [photo('depart.jpg')], notes: 'Bon état', deposit: { amount: 500, method: 'card-hold' }, imported: false,
  });
});

test('US8-1: a private customer cannot leave without a valid deposit', () => {
  [null, { amount: '0', method: 'card-hold' }, { amount: '', method: 'cash' }, { amount: '500', method: 'iban' }].forEach((deposit) => {
    const result = departPereira(freshState(), { deposit });
    assert.deepEqual(codes(result.reasons), ['deposit'], JSON.stringify(deposit));
    assert.equal(result.reasons[0].message, 'Enregistrez la caution du client particulier.');
  });
});

test('US8-2: a professional customer leaves without deposit', () => {
  const result = ValletOperations.recordDeparture(freshState(), BTP_NAC112, { date: '2026-10-14', photos: [photo('a.jpg')], notes: '', deposit: null });

  assert.equal(result.ok, true);
  assert.equal(reservation(result.state, BTP_NAC112).departure.deposit, null);
});

test('US7-4: a departure outside the rental period is refused', () => {
  const tooEarly = ValletOperations.recordDeparture(freshState(), BTP_NAC112, { date: '2026-10-13', photos: [photo('a.jpg')], notes: '' });
  const tooLate = ValletOperations.recordDeparture(freshState(), BTP_NAC112, { date: '2026-10-19', photos: [photo('a.jpg')], notes: '' });

  assert.deepEqual(codes(tooEarly.reasons), ['departureDate']);
  assert.deepEqual(codes(tooLate.reasons), ['departureDate']);
});

test('US7-4: a reservation to relocate or already out cannot leave', () => {
  const duclos = ValletOperations.recordDeparture(freshState(), 2, { date: '2026-10-16', photos: [photo('a.jpg')], notes: '' });
  const alreadyOut = ValletOperations.recordDeparture(freshState(), 5, { date: '2026-10-06', photos: [photo('a.jpg')], notes: '' });

  assert.deepEqual(codes(duclos.reasons), ['toRelocate']);
  assert.deepEqual(codes(alreadyOut.reasons), ['stage']);
});

test('a nacelle cannot leave once its VGP has expired on the departure date', () => {
  const booked = ValletRules.book(freshState(), { ref: 'NAC118', client: 'BTP Rhone', start: '2026-10-15', end: '2026-10-20', enteredBy: 'Annecy' });

  const late = ValletOperations.recordDeparture(booked.state, booked.reservation.id, { date: '2026-10-16', photos: [photo('a.jpg')], notes: '' });
  const onTime = ValletOperations.recordDeparture(booked.state, booked.reservation.id, { date: '2026-10-15', photos: [photo('a.jpg')], notes: '' });

  assert.deepEqual(codes(late.reasons), ['vgp']);
  assert.equal(onTime.ok, true);
});

test('US7-3 and US8-3: the return settles the deposit against the damages', () => {
  const out = departPereira(freshState(), {}).state;
  const result = returnPereira(out, {});

  assert.equal(result.ok, true);
  const pereira = reservation(result.state, PEREIRA);
  assert.equal(pereira.stage, 'returned');
  assert.deepEqual(pereira.return.damages, [{ description: 'Rayure capot', amount: 120 }]);
  assert.deepEqual(pereira.return.settlement, { damagesTotal: 120, retained: 120, refunded: 380, toInvoice: 0 });
});

test('US8-4: damages above the deposit leave the rest to invoice', () => {
  const out = departPereira(freshState(), {}).state;
  const result = returnPereira(out, { damages: [{ description: 'Vérin tordu', amount: '800' }] });

  assert.deepEqual(reservation(result.state, PEREIRA).return.settlement, { damagesTotal: 800, retained: 500, refunded: 0, toInvoice: 300 });
});

test('a professional customer has every damage to invoice', () => {
  const out = ValletOperations.recordDeparture(freshState(), BTP_NAC112, { date: '2026-10-14', photos: [photo('a.jpg')], notes: '' }).state;
  const result = ValletOperations.recordReturn(out, BTP_NAC112, { date: '2026-10-18', photos: [photo('b.jpg')], notes: '', damages: [{ description: 'Panier rayé', amount: '200' }] });

  assert.deepEqual(reservation(result.state, BTP_NAC112).return.settlement, { damagesTotal: 200, retained: 0, refunded: 0, toInvoice: 200 });
});

test('a return without damage refunds the whole deposit', () => {
  const out = departPereira(freshState(), {}).state;
  const result = returnPereira(out, { damages: [] });

  assert.deepEqual(reservation(result.state, PEREIRA).return.settlement, { damagesTotal: 0, retained: 0, refunded: 500, toInvoice: 0 });
});

test('US7-5: an invalid return is refused', () => {
  const out = departPereira(freshState(), {}).state;

  assert.deepEqual(codes(returnPereira(out, { date: '2026-10-11' }).reasons), ['returnDate']);
  assert.deepEqual(codes(returnPereira(out, { photos: [] }).reasons), ['noPhoto']);
  assert.deepEqual(codes(returnPereira(out, { damages: [{ description: ' ', amount: '10' }] }).reasons), ['damage']);
  assert.deepEqual(codes(returnPereira(out, { damages: [{ description: 'Choc', amount: '-1' }] }).reasons), ['damage']);
  assert.deepEqual(codes(returnPereira(freshState(), {}).reasons), ['stage']);
});

test('US7-6: the imported departure of ECH40 is out without photo', () => {
  const ech40 = reservation(freshState(), 5);

  assert.equal(ech40.stage, 'out');
  assert.equal(ech40.departure.imported, true);
  assert.deepEqual(ech40.departure.photos, []);
});

test('US9-1: a nacelle rental has a VGP certificate', () => {
  const certificate = ValletOperations.certificate(freshState(), BTP_NAC112);

  assert.deepEqual(certificate, {
    client: 'BTP Rhone',
    ref: 'NAC112',
    type: 'Nacelle 12 m',
    agency: 'Lyon Est',
    start: '2026-10-14',
    end: '2026-10-18',
    lastVgp: '2026-07-10',
    expiry: '2027-01-10',
    coversRental: true,
    statement: 'VGP valide pendant toute la période de location.',
  });
});

test('US9-1: a certificate warns when the VGP expires during the rental', () => {
  const booked = ValletRules.book(freshState(), { ref: 'NAC118', client: 'BTP Rhone', start: '2026-10-15', end: '2026-10-20', enteredBy: 'Annecy' });
  const certificate = ValletOperations.certificate(booked.state, booked.reservation.id);

  assert.equal(certificate.coversRental, false);
  assert.equal(certificate.statement, 'VGP à renouveler le 15/10/2026, avant la fin de la location.');
});

test('US9-2: a machine that is not a nacelle has no certificate', () => {
  assert.equal(ValletOperations.certificate(freshState(), PEREIRA), null);
});

test('US10-2: nothing to export before any return', () => {
  assert.deepEqual(ValletOperations.billingCsv(freshState()), { ok: false, message: 'Aucune location rendue à exporter.' });
});

test('US10-1: returned rentals are exported for the billing software', () => {
  const returned = returnPereira(departPereira(freshState(), {}).state, {}).state;
  const result = ValletOperations.billingCsv(returned);

  assert.equal(result.ok, true);
  assert.equal(result.rowCount, 1);
  assert.equal(result.content.startsWith('﻿'), true);
  const lines = result.content.slice(1).split('\r\n');
  assert.equal(lines[0], 'Réservation;Client;Type de client;Machine;Agence;Départ;Retour;Jours;Dégâts à refacturer (€);Caution retenue (€);Reste à facturer (€)');
  assert.equal(lines[1], '4;M. Pereira (particulier);Particulier;COMP21 (Compacteur);Lyon Est;12/10/2026;12/10/2026;1;120,00;120,00;0,00');
});

test('a value containing the separator is quoted in the export', () => {
  const state = freshState();
  state.reservations[3].client = 'Durand; fils';
  const returned = returnPereira(departPereira(state, {}).state, {}).state;

  assert.match(ValletOperations.billingCsv(returned).content, /;"Durand; fils";/);
});

test('operations never modify the state they receive', () => {
  const state = freshState();
  const snapshot = JSON.stringify(state);

  const out = departPereira(state, {}).state;
  const outSnapshot = JSON.stringify(out);
  returnPereira(out, {});

  assert.equal(JSON.stringify(state), snapshot);
  assert.equal(JSON.stringify(out), outSnapshot);
});
