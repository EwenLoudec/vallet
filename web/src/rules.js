var ValletRules = (() => {
  const VGP_VALIDITY_MONTHS = 6;
  const PRIVATE_CUSTOMER = 'particulier';
  const PROFESSIONAL_CUSTOMER = 'professionnel';
  const ONLINE_CHANNEL = 'Réservation en ligne';
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

  const MILLISECONDS_PER_DAY = 86400000;

  const toUtcTime = (isoDate) => {
    const [year, month, day] = isoDate.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };

  const daysBetween = (fromDate, toDate) => Math.round((toUtcTime(toDate) - toUtcTime(fromDate)) / MILLISECONDS_PER_DAY);

  const normalizeName = (name) => (name || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const findKeyAccount = (state, clientName) => (state.keyAccounts || [])
    .find((account) => normalizeName(account.name) === normalizeName(clientName)) || null;

  const isNacelle = (machine) => machine.type.startsWith(NACELLE_TYPE_PREFIX);

  const periodsOverlap = (first, second) => first.start <= second.end && second.start <= first.end;

  const occupiedPeriod = (reservation) => (reservation.stage === 'returned' && reservation.return
    ? { start: reservation.start, end: reservation.return.date }
    : { start: reservation.start, end: reservation.end });

  const isCancelled = (reservation) => reservation.stage === 'cancelled';

  const isSold = (machine) => Boolean(machine.sale) && machine.sale.status === 'sold';

  const findMachine = (state, ref) => state.machines.find((machine) => machine.ref === ref);

  const createReason = (code, message) => ({ code, message });

  const overlapReason = (reservation) => createReason(
    'overlap',
    `Déjà réservée du ${formatDate(reservation.start)} au ${formatDate(occupiedPeriod(reservation).end)} pour ${reservation.client} (saisie par ${reservation.enteredBy}).`,
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
      if (isCancelled(reservation)) {
        return { reservation, status: 'cancelled', reasons: [] };
      }
      if (reservation.stage !== undefined && reservation.stage !== 'booked') {
        keptReservations.push(reservation);
        return { reservation, status: 'kept', reasons: [] };
      }
      const machine = findMachine(state, reservation.ref);
      const overlapReasons = keptReservations
        .filter((kept) => kept.ref === reservation.ref && periodsOverlap(occupiedPeriod(kept), reservation))
        .map(overlapReason);
      const reasons = [...overlapReasons, ...machineRuleReasons(state, machine, reservation)];
      if (reasons.length === 0) {
        keptReservations.push(reservation);
      }
      return { reservation, status: reasons.length === 0 ? 'kept' : 'toRelocate', reasons };
    });
  };

  const withoutReservation = (state, reservationId) => ({
    ...state,
    reservations: state.reservations.filter((reservation) => reservation.id !== reservationId),
  });

  const machineBlockers = (state, ref, start, end, ignoreId) => {
    const machine = findMachine(state, ref);
    if (!machine) {
      return [createReason('unknownMachine', 'Machine inconnue.')];
    }
    if (isSold(machine)) {
      return [createReason('sold', 'Machine vendue : elle ne se loue plus.')];
    }
    const period = { start, end };
    const consideredState = ignoreId === undefined ? state : withoutReservation(state, ignoreId);
    const overlapReasons = consideredState.reservations
      .filter((reservation) => reservation.ref === ref && !isCancelled(reservation) && periodsOverlap(occupiedPeriod(reservation), period))
      .map(overlapReason);
    return [...overlapReasons, ...machineRuleReasons(state, machine, period)];
  };

  const search = (state, type, start, end) => {
    const available = [];
    const unavailable = [];
    state.machines
      .filter((machine) => machine.type === type && !isSold(machine))
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
    const isPrivate = request.customerType === PRIVATE_CUSTOMER;
    const keyAccount = isPrivate ? null : findKeyAccount(state, request.client);
    const reservation = {
      id: nextReservationId(state),
      ref: request.ref,
      client: request.client.trim(),
      start: request.start,
      end: request.end,
      enteredBy: request.enteredBy,
      customerType: isPrivate ? PRIVATE_CUSTOMER : PROFESSIONAL_CUSTOMER,
      contact: request.contact || null,
      keyAccountId: keyAccount ? keyAccount.id : null,
      purchaseOrder: keyAccount && !isBlank(request.purchaseOrder) ? request.purchaseOrder.trim() : null,
      stage: 'booked',
      departure: null,
      return: null,
    };
    return { ok: true, reservation, state: { ...state, reservations: [...state.reservations, reservation] } };
  };

  const bookOnline = (state, request) => {
    if (isBlank(request.name)) {
      return { ok: false, reasons: [createReason('missingField', 'Indiquez votre nom.')] };
    }
    const contacts = [request.phone, request.email].filter((value) => !isBlank(value)).map((value) => value.trim());
    if (contacts.length === 0) {
      return { ok: false, reasons: [createReason('contact', 'Indiquez un téléphone ou un e-mail pour être recontacté.')] };
    }
    return book(state, {
      ref: request.ref,
      client: request.name,
      start: request.start,
      end: request.end,
      enteredBy: ONLINE_CHANNEL,
      customerType: PRIVATE_CUSTOMER,
      contact: contacts.join(' · '),
    });
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
    if (reservation.stage !== undefined && reservation.stage !== 'booked') {
      return { ok: false, reasons: [createReason('stage', 'Seule une réservation pas encore partie peut être transférée.')] };
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
    PRIVATE_CUSTOMER,
    PROFESSIONAL_CUSTOMER,
    ONLINE_CHANNEL,
    daysBetween,
    normalizeName,
    findKeyAccount,
    formatDate,
    vgpExpiry,
    isNacelle,
    isSold,
    isCancelled,
    isBlank,
    hasValidVgpOn,
    createReason,
    findMachine,
    findReservation,
    occupiedPeriod,
    machineBlockers,
    search,
    validatePeriod,
    validateBooking,
    book,
    bookOnline,
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
