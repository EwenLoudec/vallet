ValletViews.reservationDetail = (app, reservation) => {
  const { createElement, button, submitButton, field, dateInput, textInput, amountInput, textArea, selectInput, errorMessage, flashMessage, formatEuros, photoGallery, photoPicker, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();
  const machine = ValletRules.findMachine(state, reservation.ref);
  const isPrivate = reservation.customerType === ValletRules.PRIVATE_CUSTOMER;
  const evaluation = ValletRules.reservationStatuses(state).find((candidate) => candidate.reservation.id === reservation.id);

  const DEPOSIT_OPTIONS = Object.entries(ValletOperations.DEPOSIT_METHODS).map(([value, label]) => ({ value, label }));

  if (!view.drafts[reservation.id]) {
    view.drafts[reservation.id] = {
      departurePhotos: [],
      returnPhotos: [],
      departure: { date: reservation.start, notes: '', amount: '', method: 'card-hold' },
      return: { date: reservation.end, notes: '', damages: [] },
      reasons: [],
      message: null,
    };
  }
  const draft = view.drafts[reservation.id];

  const commit = (result, successText) => {
    if (!result.ok) {
      draft.reasons = result.reasons;
      draft.message = null;
      app.render();
      return;
    }
    app.setState(result.state);
    draft.reasons = [];
    draft.message = { kind: 'success', text: successText };
    app.render();
  };

  const summaryItem = (label, value) => createElement('div', { className: 'summary__item' }, [
    createElement('span', { className: 'summary__label', textContent: label }),
    createElement('span', { className: 'summary__value', textContent: value }),
  ]);

  const renderSummary = () => createElement('div', { className: 'summary' }, [
    summaryItem('Client', reservation.client),
    summaryItem('Type de client', isPrivate ? 'Particulier' : 'Professionnel'),
    reservation.contact ? summaryItem('Contact', reservation.contact) : null,
    reservation.keyAccountId ? summaryItem('Grand compte', `${ValletAccounts.findAccount(state, reservation.keyAccountId).name} · ${ValletAccounts.findAccount(state, reservation.keyAccountId).salesRep}`) : null,
    reservation.keyAccountId ? summaryItem('Bon de commande', reservation.purchaseOrder || 'À fournir') : null,
    summaryItem('Machine', `${machine.ref} · ${machine.type}`),
    summaryItem('Agence', machine.agency),
    summaryItem('Période', `du ${formatDate(reservation.start)} au ${formatDate(reservation.end)}`),
    summaryItem('Saisie par', reservation.enteredBy),
  ]);

  const renderDepartureForm = () => {
    if (evaluation.status === 'toRelocate') {
      return flashMessage({ kind: 'warning', text: 'Réservation à replacer : transférez-la sur une autre machine avant le départ.' });
    }
    const form = createElement('form', {
      className: 'form form--stacked',
      onSubmit: (event) => {
        Object.assign(draft.departure, {
          date: formValue(event.target, 'date'),
          notes: formValue(event.target, 'notes'),
          amount: formValue(event.target, 'amount'),
          method: formValue(event.target, 'method') || draft.departure.method,
        });
        commit(ValletOperations.recordDeparture(app.getState(), reservation.id, {
          date: draft.departure.date,
          photos: draft.departurePhotos,
          notes: draft.departure.notes,
          deposit: isPrivate ? { amount: draft.departure.amount, method: draft.departure.method } : null,
        }), `Départ enregistré le ${formatDate(draft.departure.date || reservation.start)} : la machine est sortie.`);
      },
    }, [
      createElement('h4', { textContent: 'Enregistrer le départ' }),
      createElement('div', { className: 'form__row' }, [
        field('Date du départ', dateInput('date', draft.departure.date)),
        isPrivate ? field('Caution (€)', amountInput('amount', draft.departure.amount)) : null,
        isPrivate ? field('Mode de caution', selectInput('method', DEPOSIT_OPTIONS, draft.departure.method)) : null,
      ]),
      isPrivate ? createElement('p', { className: 'field__hint', textContent: 'Empreinte bancaire simulée : aucune donnée de carte n\'est saisie ni conservée.' }) : null,
      photoPicker('Photos au départ (au moins une)', draft.departurePhotos),
      field('Remarques', textArea('notes', draft.departure.notes)),
      submitButton('Enregistrer le départ'),
    ]);
    return form;
  };

  const damageRow = (damage) => {
    const row = createElement('div', { className: 'damage-row' }, [
      field('Description du dégât', textInput('damageDescription', damage.description)),
      field('Montant (€)', amountInput('damageAmount', damage.amount)),
    ]);
    row.append(button('Retirer', () => row.remove()));
    return row;
  };

  const renderReturnForm = () => {
    const damagesList = createElement('div', { className: 'damages' }, draft.return.damages.map(damageRow));
    const form = createElement('form', {
      className: 'form form--stacked',
      onSubmit: (event) => {
        const damages = [...event.target.querySelectorAll('.damage-row')].map((row) => ({
          description: row.querySelector('[name="damageDescription"]').value,
          amount: row.querySelector('[name="damageAmount"]').value,
        }));
        Object.assign(draft.return, { date: formValue(event.target, 'date'), notes: formValue(event.target, 'notes'), damages });
        commit(ValletOperations.recordReturn(app.getState(), reservation.id, {
          date: draft.return.date,
          photos: draft.returnPhotos,
          notes: draft.return.notes,
          damages,
        }), `Retour enregistré le ${formatDate(draft.return.date || reservation.end)}.`);
      },
    }, [
      createElement('h4', { textContent: 'Enregistrer le retour' }),
      createElement('div', { className: 'form__row' }, [field('Date du retour', dateInput('date', draft.return.date))]),
      photoPicker('Photos au retour (au moins une)', draft.returnPhotos),
      createElement('div', { className: 'field' }, [
        createElement('span', { className: 'field__label', textContent: 'Dégâts constatés' }),
        damagesList,
        button('Ajouter un dégât', () => damagesList.append(damageRow({ description: '', amount: '' }))),
      ]),
      field('Remarques', textArea('notes', draft.return.notes)),
      submitButton('Enregistrer le retour'),
    ]);
    return form;
  };

  const renderInspection = (title, inspection, emptyText) => createElement('div', { className: 'inspection' }, [
    createElement('h4', { textContent: title }),
    inspection ? createElement('p', { className: 'inspection__meta', textContent: `Le ${formatDate(inspection.date)}${inspection.notes ? ` · ${inspection.notes}` : ''}` }) : null,
    inspection && inspection.imported ? createElement('span', { className: 'badge badge--warning', textContent: 'Sortie sans photo (reprise Excel)' }) : null,
    inspection && inspection.certificateSentTo ? createElement('span', { className: 'badge badge--ok', textContent: `Attestation VGP envoyée à ${inspection.certificateSentTo.email} le ${formatDate(inspection.certificateSentTo.date)} (envoi simulé)` }) : null,
    inspection ? photoGallery(inspection.photos, 'Aucune photo.') : createElement('p', { className: 'empty', textContent: emptyText }),
  ]);

  const renderSettlement = () => {
    const { departure } = reservation;
    const returned = reservation.return;
    const lines = [];
    if (departure && departure.deposit) {
      lines.push(`Caution : ${formatEuros(departure.deposit.amount)} · ${ValletOperations.DEPOSIT_METHODS[departure.deposit.method]}`);
    }
    if (returned) {
      returned.damages.forEach((damage) => lines.push(`Dégât : ${damage.description} — ${formatEuros(damage.amount)}`));
      const { settlement } = returned;
      lines.push(`Total des dégâts : ${formatEuros(settlement.damagesTotal)}`);
      if (departure && departure.deposit) {
        lines.push(`Retenu sur la caution : ${formatEuros(settlement.retained)} · Restitué : ${formatEuros(settlement.refunded)}`);
      }
      lines.push(`Reste à facturer : ${formatEuros(settlement.toInvoice)}`);
    }
    if (lines.length === 0) {
      return null;
    }
    return createElement('div', { className: 'settlement' }, [
      createElement('h4', { textContent: 'Caution et dégâts' }),
      createElement('ul', { className: 'settlement__list' }, lines.map((line) => createElement('li', { textContent: line }))),
    ]);
  };

  return createElement('section', { className: 'detail', 'aria-label': `Réservation n° ${reservation.id}` }, [
    createElement('div', { className: 'section-header' }, [
      createElement('h2', { textContent: `Réservation n° ${reservation.id}` }),
      createElement('div', { className: 'detail__actions' }, [
        ValletRules.isNacelle(machine) ? button('Attestation VGP', () => app.openCertificate(reservation.id)) : null,
        button('Fermer la fiche', () => {
          view.openReservationId = null;
          app.render();
        }),
      ]),
    ]),
    renderSummary(),
    ValletAccounts.missingPurchaseOrder(reservation) ? flashMessage({ kind: 'warning', text: 'Bon de commande à fournir : ce grand compte passe par des bons de commande.' }) : null,
    flashMessage(draft.message),
    draft.reasons.length > 0 ? errorMessage(draft.reasons) : null,
    reservation.stage === 'booked' ? renderDepartureForm() : null,
    reservation.stage === 'out' ? renderReturnForm() : null,
    createElement('div', { className: 'inspections' }, [
      renderInspection('État des lieux au départ', reservation.departure, 'Pas encore sortie.'),
      renderInspection('État des lieux au retour', reservation.return, 'Pas encore rendue.'),
    ]),
    renderSettlement(),
  ]);
};
