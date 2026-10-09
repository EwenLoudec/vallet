const test = require('node:test');
const assert = require('node:assert/strict');
const ValletRules = require('../src/rules.js');
const { freshState, codes } = require('./helpers.js');

test('VGP expires six calendar months after the last check', () => {
  assert.equal(ValletRules.vgpExpiry('2026-04-15'), '2026-10-15');
  assert.equal(ValletRules.vgpExpiry('2026-03-05'), '2026-09-05');
});

test('VGP expiry falls back to the last day of a shorter month', () => {
  assert.equal(ValletRules.vgpExpiry('2026-08-31'), '2027-02-28');
});

test('a machine is blocked by an overlapping reservation, even by one day', () => {
  const reasons = ValletRules.machineBlockers(freshState(), 'NAC112', '2026-10-18', '2026-10-20');
  assert.deepEqual(codes(reasons), ['overlap']);
});

test('a machine returned on the 18th is free from the 19th', () => {
  assert.deepEqual(ValletRules.machineBlockers(freshState(), 'NAC112', '2026-10-19', '2026-10-20'), []);
  assert.deepEqual(codes(ValletRules.machineBlockers(freshState(), 'NAC112', '2026-10-18', '2026-10-20')), ['overlap']);
});

test('a machine in the workshop is blocked until its end date included', () => {
  const reasons = ValletRules.machineBlockers(freshState(), 'MINI07', '2026-10-19', '2026-10-22');
  assert.deepEqual(codes(reasons), ['workshop']);
  assert.deepEqual(ValletRules.machineBlockers(freshState(), 'MINI07', '2026-10-21', '2026-10-22'), []);
});

test('a nacelle needs a valid VGP on the departure day only', () => {
  assert.deepEqual(codes(ValletRules.machineBlockers(freshState(), 'NAC118', '2026-10-16', '2026-10-17')), ['vgp']);
  assert.deepEqual(ValletRules.machineBlockers(freshState(), 'NAC118', '2026-10-15', '2026-10-25'), []);
});

test('the VGP rule only applies to nacelles', () => {
  assert.deepEqual(ValletRules.machineBlockers(freshState(), 'COMP30', '2026-10-13', '2026-10-30'), []);
});
