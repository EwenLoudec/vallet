var ValletInbox = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const { formatDate, normalizeName } = Rules;

  const sameAgency = (first, second) => normalizeName(first) === normalizeName(second);

  const period = (reservation) => `du ${formatDate(reservation.start)} au ${formatDate(reservation.end)}`;

  const bookingMessage = (state, reservation) => {
    const author = reservation.enteredBy === Rules.ONLINE_CHANNEL ? 'Un client en ligne' : reservation.enteredBy;
    return {
      key: `booking:${reservation.id}:${reservation.ref}`,
      kind: 'booking',
      reservationId: reservation.id,
      text: `${author} a réservé votre ${reservation.ref} ${period(reservation)} pour ${reservation.client}.`,
    };
  };

  const relocateMessage = (evaluation) => {
    const { reservation } = evaluation;
    return {
      key: `relocate:${reservation.id}:${reservation.ref}:${evaluation.reasons.map((reason) => reason.code).join('+')}`,
      kind: 'relocate',
      reservationId: reservation.id,
      text: `Votre réservation de ${reservation.client} sur ${reservation.ref} (${period(reservation)}) est à replacer : ${evaluation.reasons.map((reason) => reason.message).join(' ')}`,
    };
  };

  const cancellationMessage = (reservation) => ({
    key: `cancellation:${reservation.id}`,
    kind: 'cancellation',
    reservationId: reservation.id,
    text: `${reservation.cancellation.by} a annulé la réservation de ${reservation.client} sur votre ${reservation.ref} (${period(reservation)}) : ${reservation.cancellation.reason}.`,
  });

  const readKeys = (state, agency) => ((state.inboxRead || {})[agency] || []);

  const messagesFor = (state, agency) => {
    const relocations = Rules.reservationStatuses(state)
      .filter((evaluation) => evaluation.status === 'toRelocate' && sameAgency(evaluation.reservation.enteredBy, agency))
      .map(relocateMessage);
    const ownedByAgency = (reservation) => sameAgency(Rules.findMachine(state, reservation.ref).agency, agency);
    const cancellations = state.reservations
      .filter((reservation) => Rules.isCancelled(reservation) && ownedByAgency(reservation) && !sameAgency(reservation.cancellation.by, agency))
      .sort((first, second) => second.id - first.id)
      .map(cancellationMessage);
    const bookings = state.reservations
      .filter((reservation) => reservation.stage !== 'returned'
        && !Rules.isCancelled(reservation)
        && ownedByAgency(reservation)
        && !sameAgency(reservation.enteredBy, agency))
      .sort((first, second) => second.id - first.id)
      .map((reservation) => bookingMessage(state, reservation));
    const read = readKeys(state, agency);
    return [...relocations, ...cancellations, ...bookings].map((message) => ({ ...message, read: read.includes(message.key) }));
  };

  const unreadCount = (state, agency) => messagesFor(state, agency).filter((message) => !message.read).length;

  const withRead = (state, agency, keys) => ({
    ...state,
    inboxRead: { ...(state.inboxRead || {}), [agency]: [...new Set([...readKeys(state, agency), ...keys])] },
  });

  const markRead = (state, agency, key) => withRead(state, agency, [key]);

  const markAllRead = (state, agency) => withRead(state, agency, messagesFor(state, agency).map((message) => message.key));

  return { messagesFor, unreadCount, markRead, markAllRead };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletInbox;
}
