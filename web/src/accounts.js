var ValletAccounts = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const missingPurchaseOrder = (reservation) => Boolean(reservation.keyAccountId) && Rules.isBlank(reservation.purchaseOrder);

  const findAccount = (state, accountId) => (state.keyAccounts || []).find((account) => account.id === accountId) || null;

  const reservationsOf = (state, accountId) => state.reservations
    .filter((reservation) => reservation.keyAccountId === accountId)
    .sort((first, second) => first.start.localeCompare(second.start) || first.id - second.id);

  return { missingPurchaseOrder, findAccount, reservationsOf };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletAccounts;
}
