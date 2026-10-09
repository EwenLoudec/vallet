ValletViews.planning = (app) => {
  const { createElement, button, field, selectInput, emptyState } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();

  const KIND_LABELS = {
    booked: 'Réservée',
    out: 'Sortie',
    returned: 'Rendue',
    conflict: 'Conflit à traiter',
    workshop: 'Atelier',
    vgpExpired: 'VGP échue',
    free: 'Libre',
  };

  const agency = view.planningAgency;
  const query = view.planningQuery || '';
  const isSearching = query.trim() !== '';
  const days = ValletPlanning.days(state);
  const rows = ValletPlanning.filterByClient(ValletPlanning.grid(state, agency || null), query);

  const companyInput = createElement('input', {
    className: 'field__input', type: 'search', name: 'company', id: 'planning-company', value: query,
    placeholder: 'Ex. BTP Rhone', autocomplete: 'off', 'data-focus-key': 'planning-search',
  });
  companyInput.addEventListener('input', () => {
    view.planningQuery = companyInput.value;
    app.render();
  });

  const agencyFilter = createElement('div', { className: 'toolbar' }, [
    createElement('div', { className: 'field' }, [
      createElement('label', { className: 'field__label', htmlFor: 'planning-company', textContent: 'Entreprise' }),
      companyInput,
    ]),
    field('Agence', (() => {
      const select = selectInput('agency', [{ value: '', label: 'Toutes les agences' }, ...ValletData.agencies], agency);
      select.addEventListener('change', (event) => {
        view.planningAgency = event.target.value;
        app.render();
      });
      return select;
    })()),
  ]);

  const agendaList = (title, items, doneLabel, pendingLabel) => createElement('div', { className: 'agenda__column' }, [
    createElement('h3', { textContent: `${title} (${items.length})` }),
    items.length === 0
      ? emptyState('Rien de prévu.')
      : createElement('ul', { className: 'agenda__list' }, items.map((item) => createElement('li', { className: 'agenda__item' }, [
        createElement('span', { className: `badge badge--${item.done ? 'ok' : 'warning'}`, textContent: item.done ? doneLabel : pendingLabel }),
        createElement('span', { className: 'agenda__text', textContent: `${item.machine.ref} · ${item.machine.type} — ${item.reservation.client}` }),
        (() => {
          const openButton = button('Ouvrir la fiche', () => app.openReservation(item.reservation.id));
          openButton.dataset.focusKey = `agenda-${item.reservation.id}`;
          return openButton;
        })(),
      ]))),
  ]);

  const renderAgenda = () => {
    if (!agency) {
      return createElement('div', { className: 'agenda' }, [
        createElement('h2', { textContent: "Aujourd'hui" }),
        emptyState('Choisissez une agence pour voir ses départs et retours du jour.'),
      ]);
    }
    const agenda = ValletPlanning.agenda(state, agency);
    return createElement('div', { className: 'agenda' }, [
      createElement('h2', { textContent: `Aujourd'hui à ${agency} — ${formatDate(state.today)}` }),
      createElement('div', { className: 'agenda__columns' }, [
        agendaList('Départs', agenda.departures, 'Parti', 'À préparer'),
        agendaList('Retours attendus', agenda.returns, 'Rendu', 'Attendu'),
      ]),
    ]);
  };

  const legend = createElement('ul', { className: 'legend', 'aria-label': 'Légende du planning' }, ['booked', 'out', 'returned', 'conflict', 'workshop', 'vgpExpired', 'free']
    .map((kind) => createElement('li', { className: 'legend__item' }, [
      createElement('span', { className: `legend__swatch cell--${kind}`, 'aria-hidden': 'true' }),
      createElement('span', { textContent: KIND_LABELS[kind] }),
    ])));

  const weekHeader = createElement('tr', {}, [
    createElement('th', { className: 'planning__corner', rowspan: '2', textContent: 'Machine' }),
    ...[41, 42, 43, 44].map((week) => createElement('th', { className: 'planning__week', colspan: String(days.filter((day) => day.week === week).length), textContent: `Semaine ${week}` })),
  ]);

  const dayHeader = createElement('tr', {}, days.map((day) => createElement('th', {
    className: ['planning__day', day.isToday ? 'is-today' : '', day.isWeekend ? 'is-weekend' : ''].join(' ').trim(),
    title: formatDate(day.date),
  }, [createElement('span', { className: 'planning__day-name', textContent: day.dayName }), createElement('span', { textContent: day.dayNumber })])));

  const DAY_WIDTH = 36;
  const LABEL_PADDING = 8;

  const sameRun = (first, second) => Boolean(first) && Boolean(second) && first.kind === second.kind && first.reservationId === second.reservationId;

  const runLength = (cells, index) => {
    let length = 1;
    while (sameRun(cells[index], cells[index + length])) {
      length += 1;
    }
    return length;
  };

  const renderCell = (cells, index, dayInfo) => {
    const cell = cells[index];
    const startsRun = !sameRun(cells[index - 1], cell);
    const description = `${formatDate(cell.date)} · ${KIND_LABELS[cell.kind]}${cell.label && cell.kind !== 'workshop' && cell.kind !== 'vgpExpired' ? ` · ${cell.label}` : ''}`;
    const searchClass = { true: 'is-match', false: 'is-dimmed' }[cell.matches] || '';
    const classes = ['planning__cell', `cell--${cell.kind}`, dayInfo.isToday ? 'is-today' : '', dayInfo.isPast ? 'is-past' : '', searchClass].join(' ').trim();
    const content = startsRun && cell.kind !== 'free' ? createElement('span', {
      className: 'planning__label',
      style: `max-width: ${runLength(cells, index) * DAY_WIDTH - LABEL_PADDING}px`,
      textContent: cell.kind === 'workshop' || cell.kind === 'vgpExpired' ? KIND_LABELS[cell.kind] : cell.label,
    }) : null;
    if (cell.reservationId === null) {
      return createElement('td', { className: classes, title: description }, [content]);
    }
    return createElement('td', { className: classes }, [createElement('button', {
      type: 'button',
      className: 'planning__hit',
      title: `${description} — ouvrir la fiche`,
      'aria-label': `${description}, ouvrir la fiche`,
      'data-focus-key': `planning-${cell.reservationId}-${cell.date}`,
      onClick: () => app.openReservation(cell.reservationId),
    }, [content])]);
  };

  const bodyRows = rows.map((row) => createElement('tr', {}, [
    createElement('th', { className: 'planning__machine', scope: 'row' }, [
      ValletViews.machineLink(app, row.machine.ref),
      createElement('span', { className: 'planning__machine-meta', textContent: `${row.machine.type} · ${row.machine.agency}` }),
    ]),
    ...row.cells.map((cell, index) => renderCell(row.cells, index, days[index])),
  ]));

  return [
    renderAgenda(),
    createElement('div', { className: 'section-header' }, [
      createElement('h2', { textContent: `Planning des semaines 41 à 44${agency ? ` — ${agency}` : ''}${isSearching ? ` — ${rows.length} machine(s) pour « ${query.trim()} »` : ''}` }),
      agencyFilter,
    ]),
    legend,
    rows.length === 0
      ? emptyState(isSearching
        ? `Aucune machine réservée par une entreprise correspondant à « ${query.trim()} » sur ces 4 semaines.`
        : 'Aucune machine dans cette agence.')
      : createElement('div', { className: 'table-wrapper planning' }, [
        createElement('table', { className: 'planning__table' }, [
          createElement('thead', {}, [weekHeader, dayHeader]),
          createElement('tbody', {}, bodyRows),
        ]),
      ]),
  ];
};
