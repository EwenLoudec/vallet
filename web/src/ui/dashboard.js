ValletViews.dashboard = (app) => {
  const { createElement, formatEuros } = ValletDom;
  const { formatDate } = ValletRules;
  const state = app.getState();
  const indicators = ValletDashboard.indicators(state);
  const occupancy = ValletDashboard.occupancy(state);

  const tile = (label, value, detail, tone, onOpen) => createElement('button', {
    type: 'button',
    className: `tile tile--link${tone ? ` tile--${tone}` : ''}`,
    'aria-label': `${label} : ${value}. Voir le détail`,
    onClick: onOpen,
  }, [
    createElement('span', { className: 'tile__label', textContent: label }),
    createElement('span', { className: 'tile__value', textContent: value }),
    detail ? createElement('span', { className: 'tile__detail', textContent: detail }) : null,
    createElement('span', { className: 'tile__cta', 'aria-hidden': 'true', textContent: 'Voir le détail →' }),
  ]);

  const showReservations = (filter) => {
    app.view.reservationFilter = { query: '', agency: '', stage: '', only: '', ...filter };
    app.showTab('tab-reservations', '#panel-reservations .filters');
  };

  const showPlanning = (agency) => {
    app.view.planningAgency = agency;
    app.view.planningQuery = '';
    app.showTab('tab-planning', '#panel-planning .planning');
  };

  const JOURNAL_SIZE = 20;

  const renderJournal = () => {
    const entries = ValletJournal.latest(state, JOURNAL_SIZE);
    return createElement('section', { className: 'journal', 'aria-label': "Journal d'activité" }, [
      createElement('h2', { className: 'section-title', textContent: `Journal d'activité (${(state.journal || []).length})` }),
      entries.length === 0
        ? createElement('p', { className: 'empty', textContent: "Aucune action depuis l'ouverture. Chaque réservation, départ, retour, VGP ou vente s'inscrit ici avec son auteur." })
        : createElement('ol', { className: 'journal__list' }, entries.map((entry) => createElement('li', { className: 'journal__item' }, [
          createElement('span', { className: 'journal__number', textContent: `#${entry.id}` }),
          createElement('span', { className: 'journal__author', textContent: entry.author }),
          createElement('span', { className: 'journal__text', textContent: entry.text }),
          createElement('span', { className: 'journal__date', textContent: formatDate(entry.date) }),
        ]))),
    ]);
  };

  const share = indicators.keyAccountShare;
  const sharePercent = share.total === 0 ? 0 : Math.round((share.keyAccount / share.total) * 100);

  const tiles = createElement('div', { className: 'tiles' }, [
    tile('Réservations en cours ou à venir', String(indicators.activeReservations), 'Toutes agences confondues', null, () => showReservations({ stage: 'active' })),
    tile('Réservations à replacer', String(indicators.toRelocate), 'Doubles réservations et règles non respectées', indicators.toRelocate > 0 ? 'warning' : 'ok', () => showReservations({ stage: 'toRelocate' })),
    tile('Nacelles en alerte VGP', String(indicators.vgpAlerts), 'Échues ou à renouveler sous 30 jours', indicators.vgpAlerts > 0 ? 'critical' : 'ok', () => app.showTab('tab-workshop', '#workshop-alerts')),
    tile("Machines à l'atelier", String(indicators.inWorkshop), 'Bloquées à la réservation', null, () => app.showTab('tab-workshop', '#workshop-fleet')),
    tile('Sorties sans photo', String(indicators.departuresWithoutPhoto), 'Reprises du planning Excel ; impossible désormais', indicators.departuresWithoutPhoto > 0 ? 'warning' : 'ok', () => showReservations({ only: 'noPhoto' })),
    tile('Part grands comptes', `${sharePercent} %`, `${share.keyAccount} réservation(s) sur ${share.total}`, null, () => showReservations({ only: 'keyAccount' })),
    tile('Dégâts refacturés', formatEuros(indicators.damagesRecovered), `Contre ${formatEuros(indicators.lastYearLosses)} non refacturés l'an dernier (Doc 4)`, null, () => showReservations({ only: 'damages' })),
  ]);

  const occupancyRows = occupancy.map((line) => {
    const rate = line.capacityDays === 0 ? 0 : line.occupiedDays / line.capacityDays;
    const percent = Math.round(rate * 100);
    const description = `${line.agency} : ${line.occupiedDays} jour(s) occupé(s) sur ${line.capacityDays} (${percent} %)`;
    return createElement('tr', {}, [
      createElement('th', { scope: 'row' }, [createElement('button', {
        type: 'button',
        className: 'machine-link',
        title: `Ouvrir le planning de ${line.agency}`,
        textContent: line.agency,
        onClick: () => showPlanning(line.agency),
      })]),
      createElement('td', { textContent: String(line.machineCount) }),
      createElement('td', { textContent: `${line.occupiedDays} / ${line.capacityDays}` }),
      createElement('td', { className: 'occupancy__bar-cell' }, [
        createElement('div', { className: 'occupancy__track', title: description, role: 'img', 'aria-label': description }, [
          createElement('div', { className: 'occupancy__bar', style: `width: ${Math.max(percent, 0)}%` }),
        ]),
        createElement('span', { className: 'occupancy__value', textContent: `${percent} %` }),
      ]),
    ]);
  });

  return [
    createElement('div', { className: 'section-header section-header--first' }, [
      createElement('div', {}, [
        createElement('h2', { textContent: 'Pilotage' }),
        createElement('p', { className: 'field__hint', textContent: `Situation au ${formatDate(state.today)}, mise à jour à chaque action et conservée dans ce navigateur.` }),
      ]),
      ValletDom.button('Réinitialiser la démonstration', () => {
        if (window.confirm('Remettre toutes les données de démonstration à leur état de départ ? Les réservations, photos, signatures et le journal saisis seront effacés de ce navigateur.')) {
          app.resetDemo();
        }
      }, 'danger'),
    ]),
    ValletDom.flashMessage(app.view.dashboardMessage),
    tiles,
    renderJournal(),
    createElement('h2', { className: 'section-title', textContent: 'Occupation par agence — semaines 42 à 44' }),
    createElement('div', { className: 'table-wrapper' }, [
      createElement('table', { className: 'table occupancy' }, [
        createElement('thead', {}, [createElement('tr', {}, ['Agence', 'Machines', 'Jours occupés / disponibles', 'Taux d\'occupation']
          .map((header) => createElement('th', { textContent: header })))]),
        createElement('tbody', {}, occupancyRows),
      ]),
    ]),
  ];
};
