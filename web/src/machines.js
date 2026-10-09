var ValletMachines = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');
  const Fleet = typeof ValletFleet !== 'undefined' ? ValletFleet : require('./fleet.js');

  const conditionOf = (state, machine) => {
    if (Rules.isSold(machine)) {
      return 'sold';
    }
    if (machine.workshop && machine.workshop.until >= state.today) {
      return 'workshop';
    }
    if (Fleet.isForSale(machine)) {
      return 'forSale';
    }
    return 'available';
  };

  const history = (state, ref) => {
    const machine = Rules.findMachine(state, ref);
    if (!machine) {
      return null;
    }
    const reservations = Rules.reservationStatuses(state)
      .filter((evaluation) => evaluation.reservation.ref === ref)
      .sort((first, second) => first.reservation.start.localeCompare(second.reservation.start) || first.reservation.id - second.reservation.id)
      .map((evaluation) => ({ reservation: evaluation.reservation, status: evaluation.status }));
    const returned = reservations.map((entry) => entry.reservation).filter((reservation) => reservation.stage === 'returned');
    return {
      machine,
      vgp: Fleet.vgpStatus(state, machine),
      condition: conditionOf(state, machine),
      reservations,
      rentedDays: returned.reduce((total, reservation) => total + Rules.daysBetween(reservation.departure.date, reservation.return.date) + 1, 0),
      damagesTotal: returned.reduce((total, reservation) => total + reservation.return.settlement.damagesTotal, 0),
    };
  };

  return { history };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletMachines;
}
