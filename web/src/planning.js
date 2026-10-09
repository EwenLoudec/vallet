var ValletPlanning = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const PLANNING_START = '2026-10-05';
  const PLANNING_DAYS = 28;
  const DAY_NAMES = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];

  const toUtcDate = (isoDate) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  };

  const toIsoDate = (date) => date.toISOString().slice(0, 10);

  const addDays = (isoDate, count) => {
    const date = toUtcDate(isoDate);
    date.setUTCDate(date.getUTCDate() + count);
    return toIsoDate(date);
  };

  const isoWeek = (isoDate) => {
    const date = toUtcDate(isoDate);
    const weekday = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - weekday);
    const yearStart = Date.UTC(date.getUTCFullYear(), 0, 1);
    return Math.ceil(((date.getTime() - yearStart) / 86400000 + 1) / 7);
  };

  const days = (state) => Array.from({ length: PLANNING_DAYS }, (_, index) => {
    const date = addDays(PLANNING_START, index);
    const weekday = toUtcDate(date).getUTCDay();
    return {
      date,
      week: isoWeek(date),
      dayName: DAY_NAMES[weekday],
      dayNumber: date.slice(8, 10),
      isWeekend: weekday === 0 || weekday === 6,
      isToday: date === state.today,
      isPast: date < state.today,
    };
  });

  const covers = (period, date) => period.start <= date && date <= period.end;

  const cellFor = (state, machine, date, statusById) => {
    if (machine.workshop && date >= state.today && date <= machine.workshop.until) {
      return { date, kind: 'workshop', label: 'Atelier', reservationId: null };
    }
    const covering = state.reservations.filter((reservation) => reservation.ref === machine.ref && covers(Rules.occupiedPeriod(reservation), date));
    if (covering.length > 0) {
      const toRelocate = covering.find((reservation) => statusById[reservation.id] === 'toRelocate');
      if (covering.length > 1 || toRelocate) {
        return {
          date,
          kind: 'conflict',
          label: covering.map((reservation) => reservation.client).join(' / '),
          reservationId: (toRelocate || covering[0]).id,
        };
      }
      const [reservation] = covering;
      const kindByStage = { booked: 'booked', out: 'out', returned: 'returned' };
      return { date, kind: kindByStage[reservation.stage] || 'booked', label: reservation.client, reservationId: reservation.id };
    }
    if (Rules.isNacelle(machine) && (!machine.lastVgp || date > Rules.vgpExpiry(machine.lastVgp))) {
      return { date, kind: 'vgpExpired', label: 'VGP échue', reservationId: null };
    }
    return { date, kind: 'free', label: '', reservationId: null };
  };

  const grid = (state, agency) => {
    const statusById = Object.fromEntries(Rules.reservationStatuses(state).map((evaluation) => [evaluation.reservation.id, evaluation.status]));
    const planningDays = days(state);
    return state.machines
      .filter((machine) => !Rules.isSold(machine) && (!agency || machine.agency === agency))
      .map((machine) => ({ machine, cells: planningDays.map((day) => cellFor(state, machine, day.date, statusById)) }));
  };

  const agendaItem = (state, reservation, isDone) => ({
    reservation,
    machine: Rules.findMachine(state, reservation.ref),
    done: isDone,
  });

  const agenda = (state, agency) => {
    const ofAgency = state.reservations.filter((reservation) => Rules.findMachine(state, reservation.ref).agency === agency);
    return {
      departures: ofAgency
        .filter((reservation) => reservation.start === state.today)
        .map((reservation) => agendaItem(state, reservation, reservation.stage !== 'booked')),
      returns: ofAgency
        .filter((reservation) => reservation.end === state.today && reservation.stage !== 'booked')
        .map((reservation) => agendaItem(state, reservation, reservation.stage === 'returned')),
    };
  };

  return { PLANNING_START, PLANNING_DAYS, addDays, days, grid, agenda };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletPlanning;
}
