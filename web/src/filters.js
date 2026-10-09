var ValletFilters = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const NUMBER_ONLY = /^(?:n°|no|#)\s*(\d+)$/;
  const BARE_NUMBER = /^(\d+)$/;

  const byStartThenId = (first, second) => first.reservation.start.localeCompare(second.reservation.start)
    || first.reservation.id - second.reservation.id;

  const searchableText = (state, reservation) => Rules.normalizeName([
    reservation.client,
    reservation.ref,
    Rules.findMachine(state, reservation.ref).type,
    reservation.contact,
    reservation.purchaseOrder,
    reservation.enteredBy,
  ].filter(Boolean).join(' | '));

  const reservations = (state, criteria) => {
    const query = Rules.normalizeName(criteria.query);
    const numberOnly = query.match(NUMBER_ONLY);
    const bareNumber = query.match(BARE_NUMBER);
    const wantedId = numberOnly || bareNumber ? Number((numberOnly || bareNumber)[1]) : null;

    const matches = Rules.reservationStatuses(state).filter((evaluation) => {
      const { reservation } = evaluation;
      if (criteria.agency && Rules.findMachine(state, reservation.ref).agency !== criteria.agency) {
        return false;
      }
      if (criteria.stage && reservation.stage !== criteria.stage) {
        return false;
      }
      if (query === '') {
        return true;
      }
      if (numberOnly) {
        return reservation.id === wantedId;
      }
      return reservation.id === wantedId || searchableText(state, reservation).includes(query);
    });

    return matches.sort((first, second) => {
      const firstExact = first.reservation.id === wantedId ? 0 : 1;
      const secondExact = second.reservation.id === wantedId ? 0 : 1;
      return firstExact - secondExact || byStartThenId(first, second);
    });
  };

  return { reservations };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletFilters;
}
