ValletViews.dashboard = (app) => {
  const { createElement, formatEuros } = ValletDom;
  const { formatDate } = ValletRules;
  const state = app.getState();
  const indicators = ValletDashboard.indicators(state);
  const occupancy = ValletDashboard.occupancy(state);

  const tile = (label, value, detail, tone) => createElement('article', { className: `tile${tone ? ` tile--${tone}` : ''}` }, [
    createElement('p', { className: 'tile__label', textContent: label }),
    createElement('p', { className: 'tile__value', textContent: value }),
    detail ? createElement('p', { className: 'tile__detail', textContent: detail }) : null,
  ]);

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
    tile('Réservations en cours ou à venir', String(indicators.activeReservations), 'Toutes agences confondues'),
    tile('Réservations à replacer', String(indicators.toRelocate), 'Doubles réservations et règles non respectées', indicators.toRelocate > 0 ? 'warning' : 'ok'),
    tile('Nacelles en alerte VGP', String(indicators.vgpAlerts), 'Échues ou à renouveler sous 30 jours', indicators.vgpAlerts > 0 ? 'critical' : 'ok'),
    tile("Machines à l'atelier", String(indicators.inWorkshop), 'Bloquées à la réservation'),
    tile('Sorties sans photo', String(indicators.departuresWithoutPhoto), 'Reprises du planning Excel ; impossible désormais', indicators.departuresWithoutPhoto > 0 ? 'warning' : 'ok'),
    tile('Part grands comptes', `${sharePercent} %`, `${share.keyAccount} réservation(s) sur ${share.total}`),
    tile('Dégâts refacturés', formatEuros(indicators.damagesRecovered), `Contre ${formatEuros(indicators.lastYearLosses)} non refacturés l'an dernier (Doc 4)`),
  ]);

  const occupancyRows = occupancy.map((line) => {
    const rate = line.capacityDays === 0 ? 0 : line.occupiedDays / line.capacityDays;
    const percent = Math.round(rate * 100);
    const description = `${line.agency} : ${line.occupiedDays} jour(s) occupé(s) sur ${line.capacityDays} (${percent} %)`;
    return createElement('tr', {}, [
      createElement('th', { scope: 'row', textContent: line.agency }),
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
