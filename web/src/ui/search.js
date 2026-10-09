ValletViews.search = (app) => {
  const { createElement, button, submitButton, field, dateInput, textInput, selectInput, checkbox, reasonList, errorMessage, flashMessage, table, cell, refCell, actionCell, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();
  const user = app.getUser();

  const runSearch = () => {
    const { start, end } = view.searchCriteria;
    view.periodReasons = ValletRules.validatePeriod(state, start, end);
    view.hasSearched = true;
  };

  const renderBookingForm = (machine) => {
    const form = createElement('form', {
      className: 'form booking-form',
      onSubmit: (event) => {
        const request = {
          ref: machine.ref,
          client: formValue(event.target, 'client'),
          start: view.searchCriteria.start,
          end: view.searchCriteria.end,
          enteredBy: formValue(event.target, 'enteredBy'),
          customerType: event.target.elements.isPrivate.checked ? ValletRules.PRIVATE_CUSTOMER : ValletRules.PROFESSIONAL_CUSTOMER,
        };
        const result = ValletRules.book(app.getState(), request);
        if (!result.ok) {
          view.bookingReasons = result.reasons;
          app.render();
          return;
        }
        app.setState(result.state);
        view.openBookingRef = null;
        view.bookingReasons = [];
        view.searchMessage = {
          kind: 'success',
          text: `Réservé : ${machine.ref} pour ${result.reservation.client} du ${formatDate(request.start)} au ${formatDate(request.end)}.`,
        };
        app.render();
      },
    }, [
      field('Client', textInput('client')),
      field('Agence qui saisit', selectInput('enteredBy', ValletData.agencies, (user && user.agency) || '', 'Choisissez une agence')),
      checkbox('isPrivate', 'Client particulier', false),
      submitButton(`Confirmer la réservation de ${machine.ref}`),
    ]);
    return createElement('div', {}, [view.bookingReasons.length > 0 ? errorMessage(view.bookingReasons) : null, form]);
  };

  const renderResults = () => {
    if (!view.hasSearched) {
      return [];
    }
    if (view.periodReasons.length > 0) {
      return [errorMessage(view.periodReasons)];
    }
    const { type, start, end } = view.searchCriteria;
    const result = ValletRules.search(state, type, start, end);

    const availableRows = result.available.flatMap((machine) => {
      const isOpen = view.openBookingRef === machine.ref;
      const row = createElement('tr', {}, [
        refCell(machine.ref),
        cell(machine.type),
        cell(machine.agency),
        actionCell(isOpen ? null : button('Réserver', () => {
          view.openBookingRef = machine.ref;
          view.bookingReasons = [];
          view.searchMessage = null;
          app.render();
        }, 'primary')),
      ]);
      if (!isOpen) {
        return [row];
      }
      return [row, createElement('tr', { className: 'booking-row' }, [createElement('td', { colspan: '4' }, [renderBookingForm(machine)])])];
    });

    const unavailableRows = result.unavailable.map((entry) => createElement('tr', {}, [
      refCell(entry.machine.ref),
      cell(entry.machine.agency),
      cell(reasonList(entry.reasons)),
    ]));

    return [
      createElement('h3', { textContent: `Disponibles du ${formatDate(start)} au ${formatDate(end)} (${result.available.length})` }),
      result.available.length === 0
        ? createElement('p', { className: 'empty', textContent: `Aucune machine de ce type n'est disponible du ${formatDate(start)} au ${formatDate(end)}.` })
        : table(['Référence', 'Type', 'Agence', ''], availableRows),
      result.unavailable.length > 0 ? createElement('h3', { textContent: `Indisponibles (${result.unavailable.length})` }) : null,
      result.unavailable.length > 0 ? table(['Référence', 'Agence', 'Raison'], unavailableRows) : null,
    ];
  };

  const form = createElement('form', {
    className: 'form',
    onSubmit: (event) => {
      view.searchCriteria = {
        type: formValue(event.target, 'type'),
        start: formValue(event.target, 'start'),
        end: formValue(event.target, 'end'),
      };
      view.openBookingRef = null;
      view.bookingReasons = [];
      view.searchMessage = null;
      runSearch();
      app.render();
    },
  }, [
    field('Type de machine', selectInput('type', app.machineTypes, view.searchCriteria.type)),
    field('Du', dateInput('start', view.searchCriteria.start)),
    field('Au', dateInput('end', view.searchCriteria.end)),
    submitButton('Rechercher'),
  ]);

  return [
    createElement('h2', { textContent: 'Rechercher une machine dans les 7 agences' }),
    form,
    flashMessage(view.searchMessage),
    ...renderResults(),
  ];
};
