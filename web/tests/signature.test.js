const test = require('node:test');
const assert = require('node:assert/strict');
const ValletOperations = require('../src/operations.js');
const { freshState, codes, photo } = require('./helpers.js');

const SIGNATURE_IMAGE = 'data:image/png;base64,iVBORw0KGgo=';

const departPereira = (signature) => ValletOperations.recordDeparture(freshState(), 4, {
  date: '2026-10-12', photos: [photo('a.jpg')], notes: '', deposit: { amount: '500', method: 'cash' }, signature,
});

test('US20-1: the customer signature and name are recorded at departure', () => {
  const result = departPereira({ name: ' M. Pereira ', image: SIGNATURE_IMAGE });
  const departure = result.state.reservations.find((reservation) => reservation.id === 4).departure;

  assert.deepEqual(departure.signature, { name: 'M. Pereira', image: SIGNATURE_IMAGE });
  assert.equal(ValletOperations.isSigned(departure), true);
});

test('US20-2: a signature without the signer name is refused', () => {
  const result = departPereira({ name: '', image: SIGNATURE_IMAGE });

  assert.deepEqual(codes(result.reasons), ['signature']);
  assert.equal(result.reasons[0].message, 'Indiquez le nom de la personne qui signe.');
});

test('US20-3: the signature stays optional and its absence is visible', () => {
  const withoutSignature = departPereira(undefined).state.reservations.find((reservation) => reservation.id === 4).departure;
  const nameOnly = departPereira({ name: 'M. Pereira', image: '' }).state.reservations.find((reservation) => reservation.id === 4).departure;

  assert.equal('signature' in withoutSignature, false);
  assert.equal(ValletOperations.isSigned(withoutSignature), false);
  assert.equal('signature' in nameOnly, false);
});

test('the customer can sign the return too', () => {
  const out = departPereira(undefined).state;
  const result = ValletOperations.recordReturn(out, 4, {
    date: '2026-10-12', photos: [photo('b.jpg')], notes: '', damages: [], signature: { name: 'M. Pereira', image: SIGNATURE_IMAGE },
  });

  assert.deepEqual(result.state.reservations.find((reservation) => reservation.id === 4).return.signature, { name: 'M. Pereira', image: SIGNATURE_IMAGE });
});

test('a return signature without name is refused', () => {
  const out = departPereira(undefined).state;
  const result = ValletOperations.recordReturn(out, 4, {
    date: '2026-10-12', photos: [photo('b.jpg')], notes: '', damages: [], signature: { name: ' ', image: SIGNATURE_IMAGE },
  });

  assert.deepEqual(codes(result.reasons), ['signature']);
});
