var ValletPersistence = (() => {
  const DATA_VERSION = 5;
  const STATE_KEYS = ['today', 'machines', 'reservations', 'leads', 'keyAccounts', 'inboxRead', 'journal'];
  const ARRAY_KEYS = ['machines', 'reservations', 'leads', 'keyAccounts', 'journal'];

  const serialize = (state) => JSON.stringify({
    version: DATA_VERSION,
    state: Object.fromEntries(STATE_KEYS.map((key) => [key, state[key]])),
  });

  const hasExpectedShape = (state) => Boolean(state)
    && typeof state === 'object'
    && typeof state.today === 'string'
    && ARRAY_KEYS.every((key) => Array.isArray(state[key]))
    && Boolean(state.inboxRead) && typeof state.inboxRead === 'object';

  const fallback = (seed, problem) => ({ state: seed, source: 'seed', problem });

  const restore = (raw, seed) => {
    if (raw === null || raw === undefined || raw === '') {
      return fallback(seed, null);
    }
    let envelope;
    try {
      envelope = JSON.parse(raw);
    } catch (error) {
      return fallback(seed, 'unreadable');
    }
    if (!envelope || typeof envelope !== 'object') {
      return fallback(seed, 'shape');
    }
    if (envelope.version !== DATA_VERSION) {
      return fallback(seed, 'version');
    }
    if (!hasExpectedShape(envelope.state)) {
      return fallback(seed, 'shape');
    }
    return { state: envelope.state, source: 'saved', problem: null };
  };

  return { DATA_VERSION, serialize, restore };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletPersistence;
}
