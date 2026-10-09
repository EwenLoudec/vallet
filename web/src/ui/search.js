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
    const accountHint = createElement('span', { className: 'field__hint', textContent: 'Saisissez le client : les grands comptes sont reconnus automatiquement.' });
    const clientInput = textInput('client');
    clientInput.addEventListener('input', () => {
      const account = ValletRules.findKeyAccount(app.getState(), clientInput.value);
      accountHint.textContent = account
        ? `Grand compte reconnu : ${account.name} (commerciale : ${account.salesRep}). Indiquez le bon de commande.`
        : 'Saisissez le client : les grands comptes sont reconnus automatiquement.';
      accountHint.classList.toggle('field__hint--strong', Boolean(account));
    });
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
          purchaseOrder: formValue(event.target, 'purchaseOrder'),
        };
        const result = ValletRules.book(app.getState(), request);
        if (!result.ok) {
          view.bookingReasons = result.reasons;
          app.render();
          return;
        }
        app.commit(result.state, ValletJournal.describeBooking(result.reservation));
        view.openBookingRef = null;
        view.bookingReasons = [];
        const missingOrder = ValletAccounts.missingPurchaseOrder(result.reservation);
        view.searchMessage = {
          kind: missingOrder ? 'warning' : 'success',
          text: `Réservé : ${machine.ref} pour ${result.reservation.client} du ${formatDate(request.start)} au ${formatDate(request.end)}.${missingOrder ? ' Bon de commande à fournir (grand compte).' : ''}`,
        };
        app.render();
      },
    }, [
      createElement('div', { className: 'field field--wide' }, [
        createElement('span', { className: 'field__label', textContent: 'Client' }),
        clientInput,
        accountHint,
      ]),
      field('Bon de commande', textInput('purchaseOrder'), 'Grands comptes'),
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
    const ref = view.searchCriteria.ref || '';
    const result = ValletFilters.searchMachines(state, { type, ref, start, end });
    if (result.available.length === 0 && result.unavailable.length === 0) {
      return [createElement('p', { className: 'empty', textContent: 'Aucune machine ne correspond à ce type et à cette référence.' })];
    }
    const showType = !type;

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

    const proposeNextPeriod = (machine) => {
      const next = ValletChanges.nextAvailability(state, machine.ref, start, end);
      if (!next) {
        return createElement('span', { className: 'field__hint', textContent: `Pas de disponibilité dans les ${ValletChanges.AVAILABILITY_HORIZON_DAYS} jours` });
      }
      return createElement('div', { className: 'next-slot' }, [
        createElement('span', { className: 'next-slot__text', textContent: `Disponible ${ValletChanges.describePeriod(next)}` }),
        button('Réserver ces dates', () => {
          view.searchCriteria = { ...view.searchCriteria, start: next.start, end: next.end };
          runSearch();
          view.openBookingRef = machine.ref;
          view.bookingReasons = [];
          view.searchMessage = null;
          app.render();
        }),
      ]);
    };

    const unavailableRows = result.unavailable.map((entry) => createElement('tr', {}, [
      refCell(entry.machine.ref),
      showType ? cell(entry.machine.type) : null,
      cell(entry.machine.agency),
      cell(reasonList(entry.reasons)),
      cell(proposeNextPeriod(entry.machine)),
    ]));

    return [
      createElement('h3', { textContent: `Disponibles du ${formatDate(start)} au ${formatDate(end)} (${result.available.length})` }),
      result.available.length === 0
        ? createElement('p', { className: 'empty', textContent: `Aucune machine ${type ? 'de ce type ' : ''}n'est disponible du ${formatDate(start)} au ${formatDate(end)}.` })
        : table(['Référence', 'Type', 'Agence', ''], availableRows),
      result.unavailable.length > 0 ? createElement('h3', { textContent: `Indisponibles (${result.unavailable.length})` }) : null,
      result.unavailable.length > 0
        ? table(['Référence', ...(showType ? ['Type'] : []), 'Agence', 'Raison', 'Prochaine disponibilité'], unavailableRows)
        : null,
    ];
  };

  const form = createElement('form', {
    className: 'form',
    onSubmit: (event) => {
      view.searchCriteria = {
        type: formValue(event.target, 'type'),
        ref: formValue(event.target, 'ref').trim(),
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
    field('Type de machine', selectInput('type', app.machineTypes, view.searchCriteria.type, 'Tous les types')),
    field('Référence (facultatif)', createElement('input', {
      className: 'field__input', type: 'text', name: 'ref', value: view.searchCriteria.ref || '',
      list: 'machine-references', placeholder: 'Ex. NAC112 ou NAC1', autocomplete: 'off',
    })),
    createElement('datalist', { id: 'machine-references' }, state.machines
      .filter((machine) => !ValletRules.isSold(machine))
      .map((machine) => createElement('option', { value: machine.ref, textContent: `${machine.type} · ${machine.agency}` }))),
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
