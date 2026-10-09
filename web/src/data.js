var ValletData = {
  today: '2026-10-12',
  agencies: [
    'Lyon Est',
    'Villeurbanne',
    'Grenoble',
    'Saint-Étienne',
    'Clermont-Ferrand',
    'Annecy',
    'Valence',
  ],
  machines: [
    { ref: 'NAC112', type: 'Nacelle 12 m', agency: 'Lyon Est', lastVgp: '2026-07-10', workshop: null },
    { ref: 'NAC140', type: 'Nacelle 12 m', agency: 'Grenoble', lastVgp: '2026-08-20', workshop: null },
    { ref: 'NAC118', type: 'Nacelle 12 m', agency: 'Annecy', lastVgp: '2026-04-15', workshop: null },
    { ref: 'NAC089', type: 'Nacelle 16 m', agency: 'Lyon Est', lastVgp: '2026-03-05', workshop: null },
    { ref: 'NAC201', type: 'Nacelle 20 m', agency: 'Villeurbanne', lastVgp: '2026-09-02', workshop: null },
    { ref: 'MINI07', type: 'Mini-pelle 1.8 t', agency: 'Lyon Est', lastVgp: null, workshop: { until: '2026-10-20', reason: 'verin casse' } },
    { ref: 'MINI12', type: 'Mini-pelle 1.8 t', agency: 'Saint-Étienne', lastVgp: null, workshop: null },
    { ref: 'MINI15', type: 'Mini-pelle 3.5 t', agency: 'Clermont-Ferrand', lastVgp: null, workshop: null },
    { ref: 'COMP21', type: 'Compacteur', agency: 'Lyon Est', lastVgp: null, workshop: null },
    { ref: 'COMP30', type: 'Compacteur', agency: 'Annecy', lastVgp: null, workshop: null },
    { ref: 'ECH40', type: 'Echafaudage 40 m2', agency: 'Lyon Est', lastVgp: null, workshop: null },
    { ref: 'ECH41', type: 'Echafaudage 40 m2', agency: 'Valence', lastVgp: null, workshop: null },
  ],
  reservations: [
    { id: 1, ref: 'NAC112', client: 'BTP Rhone', start: '2026-10-14', end: '2026-10-18', enteredBy: 'Lyon Est' },
    { id: 2, ref: 'NAC112', client: 'Maconnerie Duclos', start: '2026-10-16', end: '2026-10-17', enteredBy: 'Villeurbanne' },
    { id: 3, ref: 'NAC089', client: 'Facades Martin', start: '2026-10-20', end: '2026-10-31', enteredBy: 'Lyon Est' },
    { id: 4, ref: 'COMP21', client: 'M. Pereira (particulier)', start: '2026-10-12', end: '2026-10-12', enteredBy: 'Lyon Est' },
    { id: 5, ref: 'ECH40', client: 'Constructions Alpes', start: '2026-10-06', end: '2026-10-24', enteredBy: 'Lyon Est' },
    { id: 6, ref: 'NAC140', client: 'BTP Rhone', start: '2026-10-19', end: '2026-10-23', enteredBy: 'Grenoble' },
    { id: 7, ref: 'MINI12', client: 'Artisan Ferreira', start: '2026-10-13', end: '2026-10-14', enteredBy: 'Saint-Étienne' },
  ],
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletData;
}
