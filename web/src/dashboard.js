var ValletDashboard = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');
  const Fleet = typeof ValletFleet !== 'undefined' ? ValletFleet : require('./fleet.js');
  const Planning = typeof ValletPlanning !== 'undefined' ? ValletPlanning : require('./planning.js');
  const Data = typeof ValletData !== 'undefined' ? ValletData : require('./data.js');

  const LAST_YEAR_UNBILLED_REPAIRS = 85000;
  const OCCUPIED_KINDS = ['booked', 'out', 'returned', 'conflict'];

  const indicators = (state) => {
    const statuses = Rules.reservationStatuses(state);
    const returned = state.reservations.filter((reservation) => reservation.stage === 'returned');
    const notCancelled = state.reservations.filter((reservation) => !Rules.isCancelled(reservation));
    return {
      activeReservations: notCancelled.filter((reservation) => reservation.stage !== 'returned').length,
      toRelocate: statuses.filter((evaluation) => evaluation.status === 'toRelocate').length,
      vgpAlerts: Fleet.vgpAlerts(state).length,
      inWorkshop: state.machines.filter((machine) => !Rules.isSold(machine) && machine.workshop && machine.workshop.until >= state.today).length,
      departuresWithoutPhoto: state.reservations.filter((reservation) => reservation.departure && reservation.departure.photos.length === 0).length,
      keyAccountShare: {
        keyAccount: notCancelled.filter((reservation) => reservation.keyAccountId).length,
        total: notCancelled.length,
      },
      damagesRecovered: returned.reduce((total, reservation) => total + reservation.return.settlement.damagesTotal, 0),
      lastYearLosses: LAST_YEAR_UNBILLED_REPAIRS,
    };
  };

  const occupancy = (state) => {
    const rows = Planning.grid(state, null);
    return Data.agencies.map((agency) => {
      const agencyRows = rows.filter((row) => row.machine.agency === agency);
      const cellsFromToday = agencyRows.flatMap((row) => row.cells.filter((cell) => cell.date >= state.today));
      const daysFromToday = agencyRows.length === 0 ? 0 : cellsFromToday.length / agencyRows.length;
      return {
        agency,
        machineCount: agencyRows.length,
        occupiedDays: cellsFromToday.filter((cell) => OCCUPIED_KINDS.includes(cell.kind)).length,
        capacityDays: agencyRows.length * daysFromToday,
      };
    });
  };

  return { indicators, occupancy };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletDashboard;
}
