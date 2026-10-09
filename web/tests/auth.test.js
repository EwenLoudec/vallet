const test = require('node:test');
const assert = require('node:assert/strict');
const ValletAuth = require('../src/auth.js');
const ValletData = require('../src/data.js');

const WRONG_CREDENTIALS = 'E-mail ou mot de passe incorrect.';

test('US5-2: a demo account signs in and exposes name, role and agency', () => {
  const result = ValletAuth.authenticate(ValletData.users, 'sandrine.morin@vallet-location.fr', 'vallet2026');

  assert.equal(result.ok, true);
  assert.equal(result.user.name, 'Sandrine Morin');
  assert.equal(result.user.role, "Responsable d'agence");
  assert.equal(result.user.agency, 'Lyon Est');
  assert.equal('password' in result.user, false);
});

test('US5-2: the e-mail ignores case and surrounding spaces', () => {
  const result = ValletAuth.authenticate(ValletData.users, '  Mehdi.ARFAOUI@vallet-location.fr ', 'vallet2026');

  assert.equal(result.ok, true);
  assert.equal(result.user.name, 'Mehdi Arfaoui');
  assert.equal(result.user.agency, null);
});

test('US5-3: a wrong password and an unknown e-mail give the same message', () => {
  const wrongPassword = ValletAuth.authenticate(ValletData.users, 'julie.ferrand@vallet-location.fr', 'nope');
  const unknownEmail = ValletAuth.authenticate(ValletData.users, 'personne@vallet-location.fr', 'vallet2026');

  assert.deepEqual(wrongPassword, { ok: false, message: WRONG_CREDENTIALS });
  assert.deepEqual(unknownEmail, { ok: false, message: WRONG_CREDENTIALS });
});

test('empty fields are refused', () => {
  assert.equal(ValletAuth.authenticate(ValletData.users, '', '').ok, false);
  assert.equal(ValletAuth.authenticate(ValletData.users, 'brice.vallet@vallet-location.fr', '').ok, false);
});

test('the four demo accounts of the spec exist', () => {
  assert.deepEqual(ValletData.users.map((user) => user.name), ['Sandrine Morin', 'Mehdi Arfaoui', 'Julie Ferrand', 'Brice Vallet']);
});

test('a signed-in user is found again by e-mail, without the password', () => {
  const user = ValletAuth.findUser(ValletData.users, 'brice.vallet@vallet-location.fr');

  assert.equal(user.name, 'Brice Vallet');
  assert.equal('password' in user, false);
  assert.equal(ValletAuth.findUser(ValletData.users, 'personne@vallet-location.fr'), null);
});
