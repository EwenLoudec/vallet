ValletViews.workshop = (app) => {
  const { createElement, button, submitButton, field, dateInput, textInput, errorMessage, flashMessage, table, cell, badge, emptyState, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();

  const VGP_BADGES = { valid: ['Valide', 'ok'], dueSoon: ['À renouveler', 'warning'], expired: ['Échue', 'danger'] };

  const toRelocateCount = (currentState) => ValletRules.reservationStatuses(currentState)
    .filter((evaluation) => evaluation.status === 'toRelocate').length;

  const describeAlert = (alert) => {
    if (alert.expiry === null) {
      return 'Aucune VGP enregistrée.';
    }
    if (alert.status === 'expired') {
      return `VGP échue depuis le ${formatDate(alert.expiry)} (${-alert.daysLeft} jours) : la nacelle ne doit pas sortir.`;
    }
    return `VGP à renouveler avant le ${formatDate(alert.expiry)} (${alert.daysLeft} jour${alert.daysLeft > 1 ? 's' : ''}).`;
  };

  const renderAlerts = () => {
    const alerts = ValletFleet.vgpAlerts(state);
    return createElement('div', { id: 'workshop-alerts', className: alerts.length > 0 ? 'alerts alerts--active' : 'alerts' }, [
      createElement('h2', { textContent: `Alertes VGP (${alerts.length})` }),
      alerts.length === 0
        ? createElement('p', { className: 'empty', textContent: `Aucune VGP échue ni à renouveler dans les ${ValletFleet.VGP_ALERT_DAYS} jours.` })
        : createElement('ul', { className: 'alerts__list' }, alerts.map((alert) => createElement('li', { className: 'alerts__item' }, [
          badge(VGP_BADGES[alert.status][0], VGP_BADGES[alert.status][1]),
          createElement('strong', { textContent: `${alert.machine.ref} · ${alert.machine.type} · ${alert.machine.agency}` }),
          createElement('span', { textContent: describeAlert(alert) }),
        ]))),
    ]);
  };

  const recordVgp = (machine, date) => {
    const before = toRelocateCount(app.getState());
    const result = ValletFleet.recordVgp(app.getState(), machine.ref, date);
    if (!result.ok) {
      view.vgpReasonsByRef = { [machine.ref]: result.reasons };
      view.workshopMessage = null;
      app.render();
      return;
    }
    app.commit(result.state, `VGP enregistrée : ${machine.ref} le ${formatDate(date)}`);
    view.vgpReasonsByRef = {};
    const released = before - toRelocateCount(result.state);
    const releasedNotice = released > 0 ? ` ${released} réservation(s) ne sont plus à replacer.` : '';
    view.workshopMessage = {
      kind: 'success',
      text: `VGP enregistrée : ${machine.ref} le ${formatDate(date)}, valide jusqu'au ${formatDate(ValletRules.vgpExpiry(date))}.${releasedNotice}`,
    };
    app.render();
  };

  const renderVgpTable = () => {
    const nacelles = state.machines.filter((machine) => ValletRules.isNacelle(machine) && !ValletRules.isSold(machine));
    const rows = nacelles.map((machine) => {
      const status = ValletFleet.vgpStatus(state, machine);
      const reasons = view.vgpReasonsByRef[machine.ref] || [];
      return createElement('tr', {}, [
        cell(ValletViews.machineLink(app, machine.ref)),
        cell(machine.agency),
        cell(machine.lastVgp ? formatDate(machine.lastVgp) : '—'),
        cell(status.expiry ? formatDate(status.expiry) : '—'),
        cell(badge(VGP_BADGES[status.status][0], VGP_BADGES[status.status][1])),
        cell(createElement('div', {}, [
          reasons.length > 0 ? errorMessage(reasons) : null,
          createElement('form', {
            className: 'form form--compact',
            onSubmit: (event) => recordVgp(machine, formValue(event.target, 'vgpDate')),
          }, [
            field('Nouvelle VGP le', dateInput('vgpDate')),
            submitButton(`Enregistrer la VGP de ${machine.ref}`),
          ]),
        ])),
      ]);
    });
    return table(['Nacelle', 'Agence', 'Dernière VGP', 'Échéance', 'Statut', ''], rows);
  };

  const blockMachine = (machine, until, reason) => {
    const countBefore = toRelocateCount(app.getState());
    const result = ValletRules.blockMachine(app.getState(), machine.ref, until, reason);
    if (!result.ok) {
      view.workshopReasonsByRef = { [machine.ref]: result.reasons };
      view.workshopMessage = null;
      app.render();
      return;
    }
    app.commit(result.state, `Immobilisation : ${machine.ref} jusqu'au ${formatDate(until)} (${reason.trim()})`);
    view.workshopReasonsByRef = {};
    const newlyToRelocate = toRelocateCount(result.state) - countBefore;
    const relocateNotice = newlyToRelocate > 0 ? ` ${newlyToRelocate} réservation(s) à replacer : voir l'onglet Réservations.` : '';
    view.workshopMessage = {
      kind: newlyToRelocate > 0 ? 'warning' : 'success',
      text: `Immobilisée : ${machine.ref} jusqu'au ${formatDate(until)}.${relocateNotice}`,
    };
    app.render();
  };

  const renderWorkshopAction = (machine) => {
    if (machine.workshop) {
      return button(`Remettre en service ${machine.ref}`, () => {
        app.commit(ValletRules.unblockMachine(app.getState(), machine.ref).state, `Remise en service : ${machine.ref}`);
        view.workshopMessage = { kind: 'success', text: `Remise en service : ${machine.ref}.` };
        app.render();
      });
    }
    const reasons = view.workshopReasonsByRef[machine.ref] || [];
    return createElement('div', {}, [
      reasons.length > 0 ? errorMessage(reasons) : null,
      createElement('form', {
        className: 'form form--compact',
        onSubmit: (event) => blockMachine(machine, formValue(event.target, 'until'), formValue(event.target, 'reason')),
      }, [
        field('Jusqu\'au', dateInput('until')),
        field('Motif', textInput('reason')),
        submitButton(`Immobiliser ${machine.ref}`),
      ]),
    ]);
  };

  const fleetRows = state.machines.filter((machine) => !ValletRules.isSold(machine)).map((machine) => createElement('tr', {}, [
    cell(ValletViews.machineLink(app, machine.ref)),
    cell(machine.type),
    cell(machine.agency),
    cell(machine.workshop
      ? badge(`À l'atelier jusqu'au ${formatDate(machine.workshop.until)} (${machine.workshop.reason})`, 'warning')
      : badge('Disponible', 'ok')),
    cell(renderWorkshopAction(machine)),
  ]));

  return [
    flashMessage(view.workshopMessage),
    renderAlerts(),
    createElement('h2', { textContent: 'Suivi des VGP des nacelles' }),
    renderVgpTable(),
    createElement('h2', { id: 'workshop-fleet', className: 'section-title', textContent: 'Parc et immobilisations atelier' }),
    fleetRows.length === 0 ? emptyState('Aucune machine.') : table(['Référence', 'Type', 'Agence', 'État', ''], fleetRows),
  ];
};
