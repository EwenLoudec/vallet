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

  const ACTIVE_STAGES = ['booked', 'out'];

  const QUICK_FILTERS = {
    noPhoto: (reservation) => Boolean(reservation.departure) && reservation.departure.photos.length === 0,
    keyAccount: (reservation) => Boolean(reservation.keyAccountId) && !Rules.isCancelled(reservation),
    damages: (reservation) => reservation.stage === 'returned' && reservation.return.settlement.damagesTotal > 0,
  };

  const matchesStage = (evaluation, stage) => {
    if (!stage) {
      return true;
    }
    if (stage === 'active') {
      return ACTIVE_STAGES.includes(evaluation.reservation.stage);
    }
    if (stage === 'toRelocate') {
      return evaluation.status === 'toRelocate';
    }
    return evaluation.reservation.stage === stage;
  };

  const searchMachines = (state, criteria) => {
    const types = criteria.type ? [criteria.type] : [...new Set(state.machines.map((machine) => machine.type))];
    const wantedRef = Rules.normalizeName(criteria.ref);
    const matchesRef = (machine) => wantedRef === '' || Rules.normalizeName(machine.ref).includes(wantedRef);
    return types
      .map((type) => Rules.search(state, type, criteria.start, criteria.end))
      .reduce((all, result) => ({
        available: [...all.available, ...result.available.filter(matchesRef)],
        unavailable: [...all.unavailable, ...result.unavailable.filter((entry) => matchesRef(entry.machine))],
      }), { available: [], unavailable: [] });
  };

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
      if (!matchesStage(evaluation, criteria.stage)) {
        return false;
      }
      if (criteria.only && !QUICK_FILTERS[criteria.only](reservation)) {
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

  return { searchMachines, reservations };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletFilters;
}
