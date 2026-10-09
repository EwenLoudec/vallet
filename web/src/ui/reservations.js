ValletViews.reservations = (app) => {
  const { createElement, button, reasonList, flashMessage, table, cell, refCell, actionCell, badge, emptyState } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();

  const STAGE_LABELS = { booked: ['Réservée', 'neutral'], out: ['Sortie', 'info'], returned: ['Rendue', 'ok'], cancelled: ['Annulée', 'danger'] };

  const findMachine = (ref) => ValletRules.findMachine(state, ref);

  const describeReservation = (reservation) => {
    const machine = findMachine(reservation.ref);
    return `${reservation.client} — ${machine.ref} (${machine.type}, ${machine.agency}) du ${formatDate(reservation.start)} au ${formatDate(reservation.end)}, saisie par ${reservation.enteredBy}`;
  };

  const relocateTo = (reservation, machine) => {
    const result = ValletRules.relocate(app.getState(), reservation.id, machine.ref);
    if (!result.ok) {
      view.reservationsMessage = { kind: 'error', text: `Refusé : ${result.reasons.map((reason) => reason.message).join(' ')}` };
      app.render();
      return;
    }
    app.commit(result.state, `Transfert : réservation n° ${reservation.id} de ${reservation.client} vers ${machine.ref}`);
    view.reservationsMessage = { kind: 'success', text: `Transféré : la réservation de ${reservation.client} est maintenant sur ${machine.ref} (${machine.agency}).` };
    app.render();
  };

  const renderToRelocate = (statuses) => {
    const toRelocate = statuses.filter((evaluation) => evaluation.status === 'toRelocate');
    const items = toRelocate.map((evaluation) => {
      const { reservation } = evaluation;
      const candidates = ValletRules.alternatives(state, reservation.id);
      const actions = candidates.length === 0
        ? createElement('p', { className: 'empty', textContent: "Aucune autre machine de ce type n'est disponible sur ces dates." })
        : createElement('div', { className: 'to-relocate__actions' }, candidates.map((machine) => button(
          `Transférer sur ${machine.ref} (${machine.agency})`,
          () => relocateTo(reservation, machine),
          'primary',
        )));
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

  const exportBilling = () => {
    const result = ValletOperations.billingCsv(app.getState());
    if (!result.ok) {
      view.reservationsMessage = { kind: 'warning', text: result.message };
      app.render();
      return;
    }
    const fileName = `vallet-facturation-${app.getState().today}.csv`;
    const url = URL.createObjectURL(new Blob([result.content], { type: 'text/csv;charset=utf-8' }));
    const link = createElement('a', { href: url, download: fileName });
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    view.reservationsMessage = { kind: 'success', text: `Export prêt : ${result.rowCount} location(s) rendue(s) dans ${fileName}.` };
    app.render();
  };

  const statuses = ValletRules.reservationStatuses(state);
  const rows = [...statuses]
    .sort((first, second) => first.reservation.start.localeCompare(second.reservation.start) || first.reservation.id - second.reservation.id)
    .map((evaluation) => {
      const { reservation } = evaluation;
      const machine = findMachine(reservation.ref);
      const isKept = evaluation.status === 'kept';
      const [stageLabel, stageKind] = STAGE_LABELS[reservation.stage];
      const isOpen = view.openReservationId === reservation.id;
      return createElement('tr', { className: isOpen ? 'is-selected' : null }, [
        refCell(machine.ref),
        cell(machine.type),
        cell(machine.agency),
        cell([
          createElement('span', { textContent: reservation.client }),
          reservation.customerType === ValletRules.PRIVATE_CUSTOMER ? createElement('span', { className: 'tag', textContent: 'Particulier' }) : null,
        ]),
        cell(formatDate(reservation.start)),
        cell(formatDate(reservation.end)),
        cell(reservation.enteredBy),
        cell(evaluation.status === 'cancelled' ? '—' : badge(isKept ? 'OK' : 'À replacer', isKept ? 'ok' : 'warning')),
        cell(badge(stageLabel, stageKind)),
        actionCell((() => {
          const openButton = button('Ouvrir la fiche', () => {
            view.reservationsMessage = null;
            app.openReservation(reservation.id);
          });
          openButton.dataset.focusKey = `reservation-${reservation.id}`;
          return openButton;
        })()),
      ]);
    });

  return [
    flashMessage(view.reservationsMessage),
    renderToRelocate(statuses),
    createElement('div', { className: 'section-header' }, [
      createElement('h2', { textContent: 'Toutes les réservations' }),
      button('Exporter pour la facturation (CSV)', exportBilling),
    ]),
    rows.length === 0 ? emptyState('Aucune réservation.') : table(['Machine', 'Type', 'Agence de la machine', 'Client', 'Du', 'Au', 'Saisie par', 'Statut', 'Étape', ''], rows),
  ];
};
