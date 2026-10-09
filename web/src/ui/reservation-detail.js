ValletViews.reservationDetail = (app, reservation) => {
  const { createElement, button, submitButton, field, dateInput, textInput, amountInput, textArea, selectInput, errorMessage, flashMessage, formatEuros, photoGallery, photoPicker, signaturePad, formValue } = ValletDom;
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
      departureSignature: { name: '', image: '' },
      returnSignature: { name: '', image: '' },
      reasons: [],
      message: null,
    };
  }
  const draft = view.drafts[reservation.id];

  const describe = `réservation n° ${reservation.id} (${machine.ref}, ${reservation.client})`;

  const commit = (result, successText, journalText) => {
    if (!result.ok) {
      draft.reasons = result.reasons;
      draft.message = null;
      view.modalScrollToMessage = true;
      app.render();
      return;
    }
    app.commit(result.state, journalText);
    draft.reasons = [];
    draft.message = { kind: 'success', text: successText };
    view.modalScrollToMessage = true;
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
    createElement('div', { className: 'summary__item' }, [
      createElement('span', { className: 'summary__label', textContent: 'Machine' }),
      createElement('span', { className: 'summary__value' }, [ValletViews.machineLink(app, machine.ref), ` · ${machine.type}`]),
    ]),
    summaryItem('Agence', machine.agency),
    summaryItem('Période', `du ${formatDate(reservation.start)} au ${formatDate(reservation.end)}`),
    summaryItem('Saisie par', reservation.enteredBy),
  ]);

  const renderSignatureBlock = (signature) => createElement('div', { className: 'signature-block' }, [
    signaturePad('Signature du client (facultative, recommandée)', signature),
    field('Nom de la personne qui signe', textInput('signerName', signature.name)),
  ]);

  const renderDepartureForm = () => {
    if (evaluation.status === 'toRelocate') {
      return flashMessage({ kind: 'warning', text: 'Réservation à replacer : transférez-la sur une autre machine avant le départ.' });
    }
    const form = createElement('form', {
      className: 'form form--stacked',
      onSubmit: (event) => {
        draft.departureSignature.name = formValue(event.target, 'signerName');
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
          signature: { name: draft.departureSignature.name, image: draft.departureSignature.image },
        }), `Départ enregistré le ${formatDate(draft.departure.date || reservation.start)} : la machine est sortie.`, `Départ : ${describe}`);
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
      renderSignatureBlock(draft.departureSignature),
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
        draft.returnSignature.name = formValue(event.target, 'signerName');
        const result = ValletOperations.recordReturn(app.getState(), reservation.id, {
          date: draft.return.date,
          photos: draft.returnPhotos,
          notes: draft.return.notes,
          damages,
          signature: { name: draft.returnSignature.name, image: draft.returnSignature.image },
        });
        const damagesTotal = result.ok ? ValletRules.findReservation(result.state, reservation.id).return.settlement.damagesTotal : 0;
        commit(result, `Retour enregistré le ${formatDate(draft.return.date || reservation.end)}.`, `Retour : ${describe}, dégâts ${formatEuros(damagesTotal)}`);
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
      renderSignatureBlock(draft.returnSignature),
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
    inspection && ValletOperations.isSigned(inspection) ? createElement('figure', { className: 'signature-proof' }, [
      createElement('img', { className: 'signature-proof__image', src: inspection.signature.image, alt: `Signature de ${inspection.signature.name}` }),
      createElement('figcaption', { textContent: `Signé par ${inspection.signature.name}` }),
    ]) : null,
    inspection && !inspection.imported && !ValletOperations.isSigned(inspection) ? createElement('span', { className: 'badge badge--warning', textContent: 'Non signé par le client' }) : null,
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
      createElement('h2', { id: 'reservation-dialog-title', textContent: `Réservation n° ${reservation.id}` }),
      createElement('div', { className: 'detail__actions' }, [
        reservation.stage === 'out' || reservation.stage === 'returned' ? button('Bon de sortie', () => app.openHandover(reservation.id)) : null,
        ValletRules.isNacelle(machine) && !ValletRules.isCancelled(reservation) ? button('Attestation VGP', () => app.openCertificate(reservation.id)) : null,
        button('Fermer la fiche', () => app.closeReservation()),
      ]),
    ]),
    renderSummary(),
    ValletAccounts.missingPurchaseOrder(reservation) ? flashMessage({ kind: 'warning', text: 'Bon de commande à fournir : ce grand compte passe par des bons de commande.' }) : null,
    flashMessage(draft.message),
    draft.reasons.length > 0 ? errorMessage(draft.reasons) : null,
    ValletRules.isCancelled(reservation) ? flashMessage({
      kind: 'warning',
      text: `Réservation annulée le ${formatDate(reservation.cancellation.date)} par ${reservation.cancellation.by} : ${reservation.cancellation.reason}`,
    }) : null,
    reservation.stage === 'booked' ? ValletViews.reservationChanges(app, reservation, draft, commit, describe) : null,
    reservation.stage === 'booked' ? renderDepartureForm() : null,
    reservation.stage === 'out' ? renderReturnForm() : null,
    createElement('div', { className: 'inspections' }, [
      renderInspection('État des lieux au départ', reservation.departure, 'Pas encore sortie.'),
      renderInspection('État des lieux au retour', reservation.return, 'Pas encore rendue.'),
    ]),
    renderSettlement(),
  ]);
};
