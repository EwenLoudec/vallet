ValletViews.machineDetail = (app, history) => {
  const { createElement, button, badge, table, cell, emptyState, formatEuros } = ValletDom;
  const { formatDate } = ValletRules;
  const { machine, vgp } = history;

  const CONDITIONS = {
    available: ['Disponible', 'ok'],
    workshop: [machine.workshop ? `À l'atelier jusqu'au ${formatDate(machine.workshop.until)} (${machine.workshop.reason})` : "À l'atelier", 'warning'],
    forSale: [machine.sale ? `En vente · ${formatEuros(machine.sale.price)}` : 'En vente', 'info'],
    sold: [machine.sale ? `Vendue · ${formatEuros(machine.sale.price)}` : 'Vendue', 'neutral'],
  };
  const VGP_BADGES = { valid: ['Valide', 'ok'], dueSoon: ['À renouveler', 'warning'], expired: ['Échue', 'danger'] };
  const STAGES = { booked: ['Réservée', 'neutral'], out: ['Sortie', 'info'], returned: ['Rendue', 'ok'], cancelled: ['Annulée', 'danger'] };

  const summaryItem = (label, value) => createElement('div', { className: 'summary__item' }, [
    createElement('span', { className: 'summary__label', textContent: label }),
    typeof value === 'string' ? createElement('span', { className: 'summary__value', textContent: value }) : value,
  ]);

  const [conditionLabel, conditionKind] = CONDITIONS[history.condition];

  const rows = history.reservations.map(({ reservation, status }) => {
    const [stageLabel, stageKind] = STAGES[reservation.stage];
    return createElement('tr', {}, [
      cell(`n° ${reservation.id}`),
      cell(reservation.client),
      cell(formatDate(reservation.start)),
      cell(formatDate(reservation.end)),
      cell(badge(status === 'toRelocate' ? 'À replacer' : stageLabel, status === 'toRelocate' ? 'warning' : stageKind)),
      cell(reservation.return ? formatEuros(reservation.return.settlement.damagesTotal) : '—'),
      cell(button('Ouvrir la réservation', () => app.openReservation(reservation.id))),
    ]);
  });

  return createElement('section', { className: 'detail', 'aria-label': `Fiche machine ${machine.ref}` }, [
    createElement('div', { className: 'section-header' }, [
      createElement('h2', { id: 'machine-dialog-title', textContent: `Fiche machine ${machine.ref}` }),
      createElement('div', { className: 'detail__actions' }, [button('Fermer la fiche', () => app.closeModal())]),
    ]),
    createElement('div', { className: 'summary' }, [
      summaryItem('Type', machine.type),
      summaryItem('Agence', machine.agency),
      summaryItem('État', badge(conditionLabel, conditionKind)),
      vgp ? summaryItem('Dernière VGP', machine.lastVgp ? formatDate(machine.lastVgp) : 'Aucune') : null,
      vgp ? summaryItem('Échéance VGP', vgp.expiry ? formatDate(vgp.expiry) : '—') : null,
      vgp ? summaryItem('Statut VGP', badge(VGP_BADGES[vgp.status][0], VGP_BADGES[vgp.status][1])) : null,
      summaryItem('Jours loués (locations rendues)', String(history.rentedDays)),
      summaryItem('Dégâts cumulés', formatEuros(history.damagesTotal)),
    ]),
    createElement('h3', { className: 'machine-detail__title', textContent: `Réservations (${history.reservations.length})` }),
    rows.length === 0
      ? emptyState("Aucune réservation pour cette machine.")
      : table(['N°', 'Client', 'Du', 'Au', 'Étape', 'Dégâts', ''], rows),
  ]);
};

ValletViews.machineLink = (app, ref) => {
  const link = ValletDom.createElement('button', {
    type: 'button',
    className: 'machine-link',
    textContent: ref,
    title: `Ouvrir la fiche machine ${ref}`,
    onClick: () => app.openMachine(ref),
  });
  link.dataset.focusKey = `machine-${ref}`;
  return link;
};
