const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes } = require('./helpers.js');

const refsOf = (machines) => machines.map((machine) => machine.ref);

const unavailableEntry = (result, ref) => result.unavailable.find((entry) => entry.machine.ref === ref);

test('US1-1: a 12 m nacelle from 16/10 to 17/10 is only available at Grenoble', () => {
  const result = ValletRules.search(freshState(), 'Nacelle 12 m', '2026-10-16', '2026-10-17');

  assert.deepEqual(refsOf(result.available), ['NAC140']);
  assert.equal(result.available[0].agency, 'Grenoble');

  const nac112 = unavailableEntry(result, 'NAC112');
  assert.deepEqual(codes(nac112.reasons), ['overlap']);
  assert.match(nac112.reasons[0].message, /BTP Rhone/);

  assert.deepEqual(codes(unavailableEntry(result, 'NAC118').reasons), ['vgp']);
});

test('US1-2: MINI07 in the workshop is not offered, MINI12 is', () => {
  const result = ValletRules.search(freshState(), 'Mini-pelle 1.8 t', '2026-10-15', '2026-10-16');

  assert.deepEqual(refsOf(result.available), ['MINI12']);
  const mini07 = unavailableEntry(result, 'MINI07');
  assert.deepEqual(codes(mini07.reasons), ['workshop']);
  assert.match(mini07.reasons[0].message, /20\/10\/2026/);
});

test('US1-3: NAC089 without a valid VGP is never offered', () => {
  const result = ValletRules.search(freshState(), 'Nacelle 16 m', '2026-10-13', '2026-10-14');

  assert.deepEqual(result.available, []);
  assert.deepEqual(codes(unavailableEntry(result, 'NAC089').reasons), ['vgp']);
});

test('a search covers the machines of every agency', () => {
  const result = ValletRules.search(freshState(), 'Compacteur', '2026-10-13', '2026-10-13');

  assert.deepEqual(refsOf(result.available), ['COMP21', 'COMP30']);
  assert.deepEqual(result.available.map((machine) => machine.agency), ['Lyon Est', 'Annecy']);
});

test('a search period must have both dates, start today or later and end after its start', () => {
  assert.deepEqual(ValletRules.validatePeriod(freshState(), '2026-10-13', '2026-10-13'), []);
  assert.deepEqual(codes(ValletRules.validatePeriod(freshState(), '', '2026-10-13')), ['missingField']);
  assert.deepEqual(codes(ValletRules.validatePeriod(freshState(), '2026-10-10', '2026-10-13')), ['past']);
  assert.deepEqual(codes(ValletRules.validatePeriod(freshState(), '2026-10-15', '2026-10-13')), ['dateOrder']);
});

test('a search matches the exact type only', () => {
  const result = ValletRules.search(freshState(), 'Nacelle 12 m', '2026-11-02', '2026-11-03');
  const allRefs = [...refsOf(result.available), ...result.unavailable.map((entry) => entry.machine.ref)];

  assert.deepEqual(allRefs.sort(), ['NAC112', 'NAC118', 'NAC140']);
});
