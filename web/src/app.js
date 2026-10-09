(() => {
  const formatDate = ValletRules.formatDate;

  let state = JSON.parse(JSON.stringify({
    today: ValletData.today,
    machines: ValletData.machines,
    reservations: ValletData.reservations,
  }));

  const machineTypes = [...new Set(ValletData.machines.map((machine) => machine.type))];

  const view = {
    searchCriteria: { type: machineTypes[0], start: ValletData.today, end: ValletData.today },
    hasSearched: false,
    periodReasons: [],
    openBookingRef: null,
    bookingReasons: [],
    searchMessage: null,
    reservationsMessage: null,
    workshopMessage: null,
    workshopReasonsByRef: {},
  };

  const createElement = (tag, properties, children) => {
    const element = document.createElement(tag);
    Object.entries(properties || {}).forEach(([name, value]) => {
      if (name === 'onClick') {
        element.addEventListener('click', value);
        return;
      }
      if (name === 'onSubmit') {
        element.addEventListener('submit', (event) => {
          event.preventDefault();
          value(event);
        });
        return;
      }
      if (name === 'className' || name === 'textContent' || name === 'value' || name === 'type' || name === 'id' || name === 'name') {
        element[name] = value;
        return;
      }
      element.setAttribute(name, value);
    });
    (children || []).forEach((child) => {
      if (child === null || child === undefined || child === false) {
        return;
      }
      element.append(typeof child === 'string' ? document.createTextNode(child) : child);
    });
    return element;
  };

  const button = (label, onClick, isPrimary) => createElement('button', {
    type: 'button',
    className: isPrimary ? 'button button--primary' : 'button',
    textContent: label,
    onClick,
  });

  const submitButton = (label) => createElement('button', {
    type: 'submit',
    className: 'button button--primary',
    textContent: label,
  });

  const field = (label, input) => createElement('label', { className: 'field' }, [
    createElement('span', { className: 'field__label', textContent: label }),
    input,
  ]);

  const dateInput = (name, value) => createElement('input', { className: 'field__input', type: 'date', name, value: value || '' });

  const textInput = (name, value) => createElement('input', { className: 'field__input', type: 'text', name, value: value || '' });

  const selectInput = (name, options, selectedValue, placeholder) => createElement('select', { className: 'field__input', name }, [
    placeholder ? createElement('option', { value: '', textContent: placeholder }) : null,
    ...options.map((option) => {
      const optionElement = createElement('option', { value: option, textContent: option });
      optionElement.selected = option === selectedValue;
      return optionElement;
    }),
  ]);

  const reasonList = (reasons) => createElement('ul', { className: 'reasons' }, reasons.map((reason) => createElement('li', { textContent: reason.message })));

  const errorMessage = (reasons) => createElement('div', { className: 'message message--error', role: 'alert' }, [
    createElement('strong', { textContent: 'Refusé :' }),
    reasonList(reasons),
  ]);

  const flashMessage = (message) => {
    if (!message) {
      return null;
    }
    return createElement('div', { className: `message message--${message.kind}`, role: 'status', textContent: message.text });
  };

  const table = (headers, rows) => createElement('table', { className: 'table' }, [
    createElement('thead', {}, [createElement('tr', {}, headers.map((header) => createElement('th', { textContent: header })))]),
    createElement('tbody', {}, rows),
  ]);

  const cell = (content) => createElement('td', {}, [content]);

  const findMachine = (ref) => state.machines.find((machine) => machine.ref === ref);

  const toRelocateCount = () => ValletRules.reservationStatuses(state)
    .filter((evaluation) => evaluation.status === 'toRelocate').length;

  const formValue = (form, name) => form.elements[name].value;

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
        };
        const result = ValletRules.book(state, request);
        if (!result.ok) {
          view.bookingReasons = result.reasons;
          render();
          return;
        }
        state = result.state;
        view.openBookingRef = null;
        view.bookingReasons = [];
        view.searchMessage = {
          kind: 'success',
          text: `Réservé : ${machine.ref} pour ${result.reservation.client} du ${formatDate(request.start)} au ${formatDate(request.end)}.`,
        };
        render();
      },
    }, [
      field('Client', textInput('client')),
      field('Agence qui saisit', selectInput('enteredBy', ValletData.agencies, '', 'Choisissez une agence')),
      submitButton(`Confirmer la réservation de ${machine.ref}`),
    ]);
    return createElement('div', {}, [
      view.bookingReasons.length > 0 ? errorMessage(view.bookingReasons) : null,
      form,
    ]);
  };

  const renderSearchResults = () => {
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
        cell(machine.ref),
        cell(machine.type),
        cell(machine.agency),
        cell(isOpen ? null : button('Réserver', () => {
          view.openBookingRef = machine.ref;
          view.bookingReasons = [];
          view.searchMessage = null;
          render();
        }, true)),
      ]);
      if (!isOpen) {
        return [row];
      }
      return [row, createElement('tr', {}, [createElement('td', { colspan: '4' }, [renderBookingForm(machine)])])];
    });

    const unavailableRows = result.unavailable.map((entry) => createElement('tr', {}, [
      cell(entry.machine.ref),
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

  const renderSearchPanel = () => {
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
        render();
      },
    }, [
      field('Type de machine', selectInput('type', machineTypes, view.searchCriteria.type)),
      field('Du', dateInput('start', view.searchCriteria.start)),
      field('Au', dateInput('end', view.searchCriteria.end)),
      submitButton('Rechercher'),
    ]);
    return [
      createElement('h2', { textContent: 'Rechercher une machine dans les 7 agences' }),
      form,
      flashMessage(view.searchMessage),
      ...renderSearchResults(),
    ];
  };

  const describeReservation = (reservation) => {
    const machine = findMachine(reservation.ref);
    return `${reservation.client} — ${machine.ref} (${machine.type}, ${machine.agency}) du ${formatDate(reservation.start)} au ${formatDate(reservation.end)}, saisie par ${reservation.enteredBy}`;
  };

  const renderToRelocate = (statuses) => {
    const toRelocate = statuses.filter((evaluation) => evaluation.status === 'toRelocate');
    const items = toRelocate.map((evaluation) => {
      const reservation = evaluation.reservation;
      const candidates = ValletRules.alternatives(state, reservation.id);
      const actions = candidates.length === 0
        ? createElement('p', { className: 'empty', textContent: "Aucune autre machine de ce type n'est disponible sur ces dates." })
        : createElement('div', { className: 'to-relocate__actions' }, candidates.map((machine) => button(`Transférer sur ${machine.ref} (${machine.agency})`, () => {
          const result = ValletRules.relocate(state, reservation.id, machine.ref);
          if (!result.ok) {
            view.reservationsMessage = { kind: 'error', text: `Refusé : ${result.reasons.map((reason) => reason.message).join(' ')}` };
            render();
            return;
          }
          state = result.state;
          view.reservationsMessage = { kind: 'success', text: `Transféré : la réservation de ${reservation.client} est maintenant sur ${machine.ref} (${machine.agency}).` };
          render();
        }, true)));
      return createElement('div', { className: 'to-relocate__item' }, [
        createElement('strong', { textContent: describeReservation(reservation) }),
        reasonList(evaluation.reasons),
        actions,
      ]);
    });
    return createElement('div', { className: 'to-relocate' }, [
      createElement('h2', { textContent: `À replacer (${toRelocate.length})` }),
      toRelocate.length === 0 ? createElement('p', { className: 'empty', textContent: 'Aucune réservation à replacer.' }) : null,
      ...items,
    ]);
  };

  const renderReservationsPanel = () => {
    const statuses = ValletRules.reservationStatuses(state);
    const rows = [...statuses]
      .sort((first, second) => first.reservation.start.localeCompare(second.reservation.start) || first.reservation.id - second.reservation.id)
      .map((evaluation) => {
        const reservation = evaluation.reservation;
        const machine = findMachine(reservation.ref);
        return createElement('tr', {}, [
          cell(machine.ref),
          cell(machine.type),
          cell(machine.agency),
          cell(reservation.client),
          cell(formatDate(reservation.start)),
          cell(formatDate(reservation.end)),
          cell(reservation.enteredBy),
          cell(evaluation.status === 'kept' ? 'OK' : 'À replacer'),
        ]);
      });
    return [
      flashMessage(view.reservationsMessage),
      renderToRelocate(statuses),
      createElement('h2', { textContent: 'Toutes les réservations' }),
      table(['Machine', 'Type', 'Agence de la machine', 'Client', 'Du', 'Au', 'Saisie par', 'Statut'], rows),
    ];
  };

  const vgpLabel = (machine) => {
    if (!ValletRules.isNacelle(machine)) {
      return '—';
    }
    if (!machine.lastVgp) {
      return 'Aucune VGP enregistrée';
    }
    const expiry = ValletRules.vgpExpiry(machine.lastVgp);
    return expiry < state.today ? `${formatDate(expiry)} (échue)` : formatDate(expiry);
  };

  const renderWorkshopAction = (machine) => {
    if (machine.workshop) {
      return button(`Remettre en service ${machine.ref}`, () => {
        state = ValletRules.unblockMachine(state, machine.ref).state;
        view.workshopMessage = { kind: 'success', text: `Remise en service : ${machine.ref}.` };
        render();
      });
    }
    const reasons = view.workshopReasonsByRef[machine.ref] || [];
    return createElement('div', {}, [
      reasons.length > 0 ? errorMessage(reasons) : null,
      createElement('form', {
        className: 'form form--compact',
        onSubmit: (event) => {
          const until = formValue(event.target, 'until');
          const reason = formValue(event.target, 'reason');
          const countBefore = toRelocateCount();
          const result = ValletRules.blockMachine(state, machine.ref, until, reason);
          if (!result.ok) {
            view.workshopReasonsByRef = { [machine.ref]: result.reasons };
            view.workshopMessage = null;
            render();
            return;
          }
          state = result.state;
          view.workshopReasonsByRef = {};
          const newlyToRelocate = toRelocateCount() - countBefore;
          const relocateNotice = newlyToRelocate > 0
            ? ` ${newlyToRelocate} réservation(s) à replacer : voir l'onglet Réservations.`
            : '';
          view.workshopMessage = {
            kind: newlyToRelocate > 0 ? 'warning' : 'success',
            text: `Immobilisée : ${machine.ref} jusqu'au ${formatDate(until)}.${relocateNotice}`,
          };
          render();
        },
      }, [
        field('Jusqu\'au', dateInput('until')),
        field('Motif', textInput('reason')),
        submitButton(`Immobiliser ${machine.ref}`),
      ]),
    ]);
  };

  const renderWorkshopPanel = () => {
    const rows = state.machines.map((machine) => createElement('tr', {}, [
      cell(machine.ref),
      cell(machine.type),
      cell(machine.agency),
      cell(vgpLabel(machine)),
      cell(machine.workshop ? `À l'atelier jusqu'au ${formatDate(machine.workshop.until)} (${machine.workshop.reason})` : 'Disponible'),
      cell(renderWorkshopAction(machine)),
    ]));
    return [
      createElement('h2', { textContent: 'Parc et immobilisations atelier' }),
      flashMessage(view.workshopMessage),
      table(['Référence', 'Type', 'Agence', 'Échéance VGP', 'État', ''], rows),
    ];
  };

  const panels = {
    'panel-search': renderSearchPanel,
    'panel-reservations': renderReservationsPanel,
    'panel-workshop': renderWorkshopPanel,
  };

  const render = () => {
    Object.entries(panels).forEach(([panelId, renderPanel]) => {
      document.getElementById(panelId).replaceChildren(...renderPanel().filter(Boolean));
    });
  };

  const selectTab = (selectedTab) => {
    document.querySelectorAll('.tabs__tab').forEach((tab) => {
      const isSelected = tab === selectedTab;
      tab.setAttribute('aria-selected', String(isSelected));
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !isSelected;
    });
  };

  document.querySelectorAll('.tabs__tab').forEach((tab) => {
    tab.addEventListener('click', () => selectTab(tab));
  });

  render();
})();
