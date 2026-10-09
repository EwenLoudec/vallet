var ValletRules = (() => {
  const VGP_VALIDITY_MONTHS = 6;
  const NACELLE_TYPE_PREFIX = 'Nacelle';

  const padTwoDigits = (number) => String(number).padStart(2, '0');

  const formatDate = (isoDate) => {
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  const vgpExpiry = (lastVgp) => {
    const [year, month, day] = lastVgp.split('-').map(Number);
    const monthIndex = month - 1 + VGP_VALIDITY_MONTHS;
    const expiryYear = year + Math.floor(monthIndex / 12);
    const expiryMonth = (monthIndex % 12) + 1;
    const lastDayOfExpiryMonth = new Date(Date.UTC(expiryYear, expiryMonth, 0)).getUTCDate();
    return `${expiryYear}-${padTwoDigits(expiryMonth)}-${padTwoDigits(Math.min(day, lastDayOfExpiryMonth))}`;
  };

  const isNacelle = (machine) => machine.type.startsWith(NACELLE_TYPE_PREFIX);

  const periodsOverlap = (first, second) => first.start <= second.end && second.start <= first.end;

  const findMachine = (state, ref) => state.machines.find((machine) => machine.ref === ref);

  const createReason = (code, message) => ({ code, message });

  const overlapReason = (reservation) => createReason(
    'overlap',
    `Déjà réservée du ${formatDate(reservation.start)} au ${formatDate(reservation.end)} pour ${reservation.client} (saisie par ${reservation.enteredBy}).`,
  );

  const workshopReason = (workshop) => createReason(
    'workshop',
    `À l'atelier jusqu'au ${formatDate(workshop.until)} (${workshop.reason}).`,
  );

  const vgpReason = (machine) => {
    if (!machine.lastVgp) {
      return createReason('vgp', 'VGP non à jour : aucune VGP enregistrée.');
    }
    return createReason('vgp', `VGP non à jour : échue le ${formatDate(vgpExpiry(machine.lastVgp))}.`);
  };

  const isInWorkshopDuring = (state, machine, period) => machine.workshop !== null
    && periodsOverlap({ start: state.today, end: machine.workshop.until }, period);

  const hasValidVgpOn = (machine, departureDate) => !isNacelle(machine)
    || (machine.lastVgp !== null && departureDate <= vgpExpiry(machine.lastVgp));

  const machineRuleReasons = (state, machine, period) => {
    const reasons = [];
    if (isInWorkshopDuring(state, machine, period)) {
      reasons.push(workshopReason(machine.workshop));
    }
    if (!hasValidVgpOn(machine, period.start)) {
      reasons.push(vgpReason(machine));
    }
    return reasons;
  };

  const evaluateReservations = (state) => {
    const keptReservations = [];
    const sortedReservations = [...state.reservations].sort((first, second) => first.id - second.id);
    return sortedReservations.map((reservation) => {
      const machine = findMachine(state, reservation.ref);
      const overlapReasons = keptReservations
        .filter((kept) => kept.ref === reservation.ref && periodsOverlap(kept, reservation))
        .map(overlapReason);
      const reasons = [...overlapReasons, ...machineRuleReasons(state, machine, reservation)];
      if (reasons.length === 0) {
        keptReservations.push(reservation);
      }
      return { reservation, status: reasons.length === 0 ? 'kept' : 'toRelocate', reasons };
    });
  };

  const keptReservationsOf = (state) => evaluateReservations(state)
    .filter((evaluation) => evaluation.status === 'kept')
    .map((evaluation) => evaluation.reservation);

  const withoutReservation = (state, reservationId) => ({
    ...state,
    reservations: state.reservations.filter((reservation) => reservation.id !== reservationId),
  });

  const machineBlockers = (state, ref, start, end, ignoreId) => {
    const machine = findMachine(state, ref);
    if (!machine) {
      return [createReason('unknownMachine', 'Machine inconnue.')];
    }
    const period = { start, end };
    const consideredState = ignoreId === undefined ? state : withoutReservation(state, ignoreId);
    const overlapReasons = keptReservationsOf(consideredState)
      .filter((reservation) => reservation.ref === ref && periodsOverlap(reservation, period))
      .map(overlapReason);
    return [...overlapReasons, ...machineRuleReasons(state, machine, period)];
  };

  const search = (state, type, start, end) => {
    const available = [];
    const unavailable = [];
    state.machines
      .filter((machine) => machine.type === type)
      .forEach((machine) => {
        const reasons = machineBlockers(state, machine.ref, start, end);
        if (reasons.length === 0) {
          available.push(machine);
          return;
        }
        unavailable.push({ machine, reasons });
      });
    return { available, unavailable };
  };

  const isBlank = (value) => !value || value.trim() === '';

  const validatePeriod = (state, start, end) => {
    if (isBlank(start) || isBlank(end)) {
      return [createReason('missingField', 'Indiquez les dates.')];
    }
    const reasons = [];
    if (start < state.today) {
      reasons.push(createReason('past', `La date de début ne peut pas être avant aujourd'hui (${formatDate(state.today)}).`));
    }
    if (end < start) {
      reasons.push(createReason('dateOrder', 'La date de fin doit être après la date de début ou le même jour.'));
    }
    return reasons;
  };

  const missingFieldReasons = (request) => {
    const reasons = [];
    if (isBlank(request.client)) {
      reasons.push(createReason('missingField', 'Indiquez le client.'));
    }
    if (isBlank(request.enteredBy)) {
      reasons.push(createReason('missingField', "Indiquez l'agence qui saisit."));
    }
    return reasons;
  };

  const validateBooking = (state, request) => {
    const missingReasons = missingFieldReasons(request);
    if (missingReasons.length > 0) {
      return { ok: false, reasons: missingReasons };
    }
    const periodReasons = validatePeriod(state, request.start, request.end);
    if (periodReasons.length > 0) {
      return { ok: false, reasons: periodReasons };
    }
    const blockers = machineBlockers(state, request.ref, request.start, request.end);
    if (blockers.length > 0) {
      return { ok: false, reasons: blockers };
    }
    return { ok: true };
  };

  const nextReservationId = (state) => state.reservations
    .reduce((highestId, reservation) => Math.max(highestId, reservation.id), 0) + 1;

  const book = (state, request) => {
    const validation = validateBooking(state, request);
    if (!validation.ok) {
      return validation;
    }
    const reservation = {
      id: nextReservationId(state),
      ref: request.ref,
      client: request.client.trim(),
      start: request.start,
      end: request.end,
      enteredBy: request.enteredBy,
    };
    return { ok: true, reservation, state: { ...state, reservations: [...state.reservations, reservation] } };
  };

  const replaceMachine = (state, ref, changes) => ({
    ...state,
    machines: state.machines.map((machine) => (machine.ref === ref ? { ...machine, ...changes } : machine)),
  });

  const blockMachine = (state, ref, until, reason) => {
    if (!findMachine(state, ref)) {
      return { ok: false, reasons: [createReason('unknownMachine', 'Machine inconnue.')] };
    }
    const reasons = [];
    if (isBlank(until)) {
      reasons.push(createReason('missingField', "Indiquez la date de fin d'immobilisation."));
    }
    if (isBlank(reason)) {
      reasons.push(createReason('missingField', 'Indiquez le motif.'));
    }
    if (!isBlank(until) && until < state.today) {
      reasons.push(createReason('past', `La date de fin d'immobilisation ne peut pas être avant aujourd'hui (${formatDate(state.today)}).`));
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    }
    return { ok: true, state: replaceMachine(state, ref, { workshop: { until, reason: reason.trim() } }) };
  };

  const unblockMachine = (state, ref) => ({ ok: true, state: replaceMachine(state, ref, { workshop: null }) });

  const findReservation = (state, reservationId) => state.reservations
    .find((reservation) => reservation.id === reservationId);

  const alternatives = (state, reservationId) => {
    const reservation = findReservation(state, reservationId);
    const currentMachine = findMachine(state, reservation.ref);
    return state.machines.filter((machine) => machine.type === currentMachine.type
      && machine.ref !== reservation.ref
      && machineBlockers(state, machine.ref, reservation.start, reservation.end, reservationId).length === 0);
  };

  const relocate = (state, reservationId, ref) => {
    const reservation = findReservation(state, reservationId);
    const targetMachine = findMachine(state, ref);
    if (!reservation || !targetMachine) {
      return { ok: false, reasons: [createReason('unknownMachine', 'Machine inconnue.')] };
    }
    const currentType = findMachine(state, reservation.ref).type;
    if (targetMachine.type !== currentType) {
      return { ok: false, reasons: [createReason('otherType', `Cette machine n'est pas du même type (${currentType}).`)] };
    }
    const blockers = machineBlockers(state, ref, reservation.start, reservation.end, reservationId);
    if (blockers.length > 0) {
      return { ok: false, reasons: blockers };
    }
    return {
      ok: true,
      state: {
        ...state,
        reservations: state.reservations.map((candidate) => (candidate.id === reservationId ? { ...candidate, ref } : candidate)),
      },
    };
  };

  return {
    formatDate,
    vgpExpiry,
    isNacelle,
    machineBlockers,
    search,
    validatePeriod,
    validateBooking,
    book,
    blockMachine,
    unblockMachine,
    reservationStatuses: evaluateReservations,
    alternatives,
    relocate,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletRules;
}
