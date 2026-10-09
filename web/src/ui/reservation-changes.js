ValletViews.reservationChanges = (app, reservation, draft, commit, describe) => {
  const { createElement, submitButton, field, dateInput, textInput, textArea, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const user = app.getUser();
  const author = user ? (user.agency || user.name) : 'Visiteur';

  const datesForm = createElement('form', {
    className: 'form form--compact changes__form',
    onSubmit: (event) => {
      const period = { start: formValue(event.target, 'start'), end: formValue(event.target, 'end') };
      commit(
        ValletChanges.reschedule(app.getState(), reservation.id, period),
        `Nouvelles dates enregistrées : du ${formatDate(period.start || reservation.start)} au ${formatDate(period.end || reservation.end)}.`,
        `Modification : ${describe}, désormais ${ValletChanges.describePeriod(period.start && period.end ? period : reservation)}`,
      );
    },
  }, [
    field('Du', dateInput('start', reservation.start)),
    field('Au', dateInput('end', reservation.end)),
    submitButton('Enregistrer les nouvelles dates'),
  ]);

  const purchaseOrderForm = reservation.keyAccountId ? createElement('form', {
    className: 'form form--compact changes__form',
    onSubmit: (event) => {
      const purchaseOrder = formValue(event.target, 'purchaseOrder');
      commit(
        ValletChanges.setPurchaseOrder(app.getState(), reservation.id, purchaseOrder),
        `Bon de commande enregistré : ${purchaseOrder.trim()}.`,
        `Bon de commande ${purchaseOrder.trim()} : ${describe}`,
      );
    },
  }, [
    field('Bon de commande', textInput('purchaseOrder', reservation.purchaseOrder || '')),
    submitButton('Enregistrer le bon de commande'),
  ]) : null;

  const cancelForm = createElement('form', {
    className: 'form form--stacked changes__form changes__form--danger',
    onSubmit: (event) => {
      const reason = formValue(event.target, 'reason');
      commit(
        ValletChanges.cancel(app.getState(), reservation.id, { reason, by: author }),
        'Réservation annulée : la machine est de nouveau disponible.',
        `Annulation : ${describe} — ${reason.trim()}`,
      );
    },
  }, [
    field("Motif de l'annulation", textArea('reason', '')),
    createElement('button', { type: 'submit', className: 'button button--danger', textContent: 'Annuler la réservation' }),
  ]);

  const details = createElement('details', { className: 'changes' }, [
    createElement('summary', { className: 'changes__summary', textContent: 'Modifier ou annuler la réservation' }),
    createElement('div', { className: 'changes__body' }, [
      createElement('h4', { textContent: 'Changer les dates' }),
      datesForm,
      purchaseOrderForm ? createElement('h4', { textContent: 'Bon de commande' }) : null,
      purchaseOrderForm,
      createElement('h4', { textContent: 'Annuler' }),
      cancelForm,
    ]),
  ]);
  details.open = Boolean(draft.changesOpen);
  details.addEventListener('toggle', () => {
    draft.changesOpen = details.open;
  });
  return details;
};
