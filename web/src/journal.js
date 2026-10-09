var ValletJournal = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const record = (state, author, text) => {
    const entries = state.journal || [];
    const entry = {
      id: entries.reduce((highestId, existing) => Math.max(highestId, existing.id), 0) + 1,
      date: state.today,
      author,
      text,
    };
    return { ...state, journal: [...entries, entry] };
  };

  const latest = (state, count) => [...(state.journal || [])].sort((first, second) => second.id - first.id).slice(0, count);

  const describeBooking = (reservation) => `Réservation n° ${reservation.id} : ${reservation.ref} pour ${reservation.client} du ${Rules.formatDate(reservation.start)} au ${Rules.formatDate(reservation.end)}`;

  return { record, latest, describeBooking };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletJournal;
}
