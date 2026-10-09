ValletViews.client = (app) => {
  const { createElement, button, submitButton, field, dateInput, selectInput, errorMessage, table, cell, refCell, actionCell, badge, emptyState, avatar, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();
  const user = app.getUser();
  const account = ValletAccounts.findAccount(state, user.keyAccountId);

  const STAGE_LABELS = { booked: ['Réservée', 'neutral'], out: ['Sortie', 'info'], returned: ['Rendue', 'ok'] };

  const header = createElement('header', { className: 'header' }, [
    createElement('div', { className: 'brand' }, [
      createElement('span', { className: 'brand__mark', 'aria-hidden': 'true', textContent: 'VL' }),
      createElement('div', { className: 'brand__text' }, [
        createElement('h1', { className: 'brand__title', textContent: 'Vallet Location' }),
        createElement('p', { className: 'brand__subtitle', textContent: `Espace grands comptes · ${account.name}` }),
      ]),
    ]),
    createElement('p', { className: 'header__today', textContent: `Aujourd'hui : ${formatDate(state.today)}` }),
    createElement('div', { className: 'user' }, [
      avatar(user.name, 'user__avatar'),
      createElement('div', { className: 'user__identity' }, [
        createElement('span', { className: 'user__name', textContent: user.name }),
        createElement('span', { className: 'user__role', textContent: user.role }),
      ]),
      button('Se déconnecter', () => app.signOut()),
    ]),
  ]);

  const reservations = ValletAccounts.reservationsOf(state, account.id);
  const reservationRows = reservations.map((reservation) => {
    const machine = ValletRules.findMachine(state, reservation.ref);
    const [stageLabel, stageKind] = STAGE_LABELS[reservation.stage];
    return createElement('tr', {}, [
      refCell(machine.ref),
      cell(machine.type),
      cell(machine.agency),
      cell(formatDate(reservation.start)),
      cell(formatDate(reservation.end)),
      cell(reservation.purchaseOrder || '—'),
      cell(badge(stageLabel, stageKind)),
      actionCell(ValletRules.isNacelle(machine) ? button('Attestation VGP', () => app.openCertificate(reservation.id)) : null),
    ]);
  });

  const availabilityForm = createElement('form', {
    className: 'form',
    onSubmit: (event) => {
      view.clientCriteria = { type: formValue(event.target, 'type'), start: formValue(event.target, 'start'), end: formValue(event.target, 'end') };
      view.clientSearched = true;
      app.render();
    },
  }, [
    field('Type de machine', selectInput('type', app.machineTypes, view.clientCriteria.type)),
    field('Du', dateInput('start', view.clientCriteria.start)),
    field('Au', dateInput('end', view.clientCriteria.end)),
    submitButton('Voir les disponibilités'),
  ]);

  const availability = () => {
    if (!view.clientSearched) {
      return [];
    }
    const { type, start, end } = view.clientCriteria;
    const periodReasons = ValletRules.validatePeriod(state, start, end);
    if (periodReasons.length > 0) {
      return [errorMessage(periodReasons)];
    }
    const { available } = ValletRules.search(state, type, start, end);
    return [
      createElement('h3', { textContent: `${available.length} disponible(s) du ${formatDate(start)} au ${formatDate(end)}` }),
      available.length === 0
        ? emptyState('Aucune machine de ce type n\'est libre sur ces dates.')
        : table(['Référence', 'Type', 'Agence'], available.map((machine) => createElement('tr', {}, [refCell(machine.ref), cell(machine.type), cell(machine.agency)]))),
    ];
  };

  return [
    header,
    createElement('main', { className: 'main' }, [
      createElement('div', { className: 'public-hero' }, [
        createElement('h2', { textContent: `Bonjour, ${account.name}` }),
        createElement('p', { textContent: `Vos locations, vos attestations VGP et les disponibilités en temps réel. Pour réserver, contactez ${account.salesRep}, votre commerciale.` }),
      ]),
      createElement('h2', { textContent: `Vos réservations (${reservations.length})` }),
      reservations.length === 0
        ? emptyState('Aucune réservation en cours.')
        : table(['Référence', 'Type', 'Agence', 'Du', 'Au', 'Bon de commande', 'Étape', ''], reservationRows),
      createElement('h2', { className: 'section-title', textContent: 'Disponibilités en temps réel' }),
      availabilityForm,
      ...availability(),
    ]),
  ];
};
