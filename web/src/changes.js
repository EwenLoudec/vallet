var ValletChanges = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');
  const Planning = typeof ValletPlanning !== 'undefined' ? ValletPlanning : require('./planning.js');

  const AVAILABILITY_HORIZON_DAYS = 60;

  const { createReason, formatDate, isBlank } = Rules;

  const refuse = (code, message) => ({ ok: false, reasons: [createReason(code, message)] });

  const replaceReservation = (state, id, changes) => ({
    ...state,
    reservations: state.reservations.map((reservation) => (reservation.id === id ? { ...reservation, ...changes } : reservation)),
  });

  const bookedReservation = (state, id) => {
    const reservation = Rules.findReservation(state, id);
    if (!reservation) {
      return { error: refuse('unknownReservation', 'Réservation inconnue.') };
    }
    if (reservation.stage !== 'booked') {
      return { error: refuse('stage', 'Seule une réservation pas encore partie peut être modifiée ou annulée.') };
    }
    return { reservation };
  };

  const reschedule = (state, id, period) => {
    const { reservation, error } = bookedReservation(state, id);
    if (error) {
      return error;
    }
    const periodReasons = Rules.validatePeriod(state, period.start, period.end);
    if (periodReasons.length > 0) {
      return { ok: false, reasons: periodReasons };
    }
    const blockers = Rules.machineBlockers(state, reservation.ref, period.start, period.end, id);
    if (blockers.length > 0) {
      return { ok: false, reasons: blockers };
    }
    return { ok: true, state: replaceReservation(state, id, { start: period.start, end: period.end }) };
  };

  const cancel = (state, id, cancellation) => {
    const { error } = bookedReservation(state, id);
    if (error) {
      return error;
    }
    if (isBlank(cancellation.reason)) {
      return refuse('missingField', "Indiquez le motif de l'annulation.");
    }
    return {
      ok: true,
      state: replaceReservation(state, id, {
        stage: 'cancelled',
        cancellation: { date: state.today, reason: cancellation.reason.trim(), by: cancellation.by },
      }),
    };
  };

  const setPurchaseOrder = (state, id, purchaseOrder) => {
    const reservation = Rules.findReservation(state, id);
    if (!reservation || !reservation.keyAccountId) {
      return refuse('notKeyAccount', 'Le bon de commande ne concerne que les grands comptes.');
    }
    if (isBlank(purchaseOrder)) {
      return refuse('missingField', 'Indiquez le numéro de bon de commande.');
    }
    return { ok: true, state: replaceReservation(state, id, { purchaseOrder: purchaseOrder.trim() }) };
  };

  const nextAvailability = (state, ref, start, end) => {
    const length = Rules.daysBetween(start, end);
    const firstStart = start < state.today ? state.today : start;
    for (let offset = 0; offset <= AVAILABILITY_HORIZON_DAYS; offset += 1) {
      const candidateStart = Planning.addDays(firstStart, offset);
      const candidateEnd = Planning.addDays(candidateStart, length);
      if (Rules.machineBlockers(state, ref, candidateStart, candidateEnd).length === 0) {
        return { start: candidateStart, end: candidateEnd };
      }
    }
    return null;
  };

  const describePeriod = (period) => `du ${formatDate(period.start)} au ${formatDate(period.end)}`;

  return { AVAILABILITY_HORIZON_DAYS, reschedule, cancel, setPurchaseOrder, nextAvailability, describePeriod };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletChanges;
}
