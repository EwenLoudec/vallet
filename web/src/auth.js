var ValletAuth = (() => {
  const WRONG_CREDENTIALS = 'E-mail ou mot de passe incorrect.';

  const normalizeEmail = (email) => (email || '').trim().toLowerCase();

  const withoutPassword = (user) => ({
    email: user.email,
    name: user.name,
    role: user.role,
    agency: user.agency,
  });

  const findUser = (users, email) => {
    const user = users.find((candidate) => candidate.email === normalizeEmail(email));
    return user ? withoutPassword(user) : null;
  };

  const authenticate = (users, email, password) => {
    const user = users.find((candidate) => candidate.email === normalizeEmail(email));
    if (!user || !password || user.password !== password) {
      return { ok: false, message: WRONG_CREDENTIALS };
    }
    return { ok: true, user: withoutPassword(user) };
  };

  return { authenticate, findUser };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletAuth;
}
