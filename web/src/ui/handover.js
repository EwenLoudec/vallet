ValletViews.handover = (app, reservationId) => {
  const { createElement, button, formatEuros } = ValletDom;
  const { formatDate } = ValletRules;
  const state = app.getState();
  const reservation = ValletRules.findReservation(state, reservationId);
  if (!reservation || !reservation.departure) {
    return null;
  }
  const machine = ValletRules.findMachine(state, reservation.ref);

  const row = (label, value) => createElement('div', { className: 'certificate__row' }, [
    createElement('dt', { textContent: label }),
    createElement('dd', { textContent: value }),
  ]);

  const photos = (items) => (items.length === 0
    ? createElement('p', { className: 'field__hint', textContent: 'Aucune photo.' })
    : createElement('div', { className: 'handover__photos' }, items.map((photo) => createElement('img', { className: 'handover__photo', src: photo.url, alt: photo.name }))));

  const signature = (inspection) => (ValletOperations.isSigned(inspection)
    ? createElement('figure', { className: 'signature-proof' }, [
      createElement('img', { className: 'signature-proof__image', src: inspection.signature.image, alt: `Signature de ${inspection.signature.name}` }),
      createElement('figcaption', { textContent: `Signé par ${inspection.signature.name}` }),
    ])
    : createElement('p', { className: 'handover__unsigned', textContent: 'Non signé par le client.' }));

  const { departure } = reservation;
  const returned = reservation.return;

  const departureSection = createElement('section', { className: 'handover__section' }, [
    createElement('h3', { textContent: 'Départ' }),
    createElement('dl', { className: 'certificate__body' }, [
      row('Date', formatDate(departure.date)),
      row('Remarques', departure.notes || '—'),
      departure.deposit ? row('Caution', `${formatEuros(departure.deposit.amount)} · ${ValletOperations.DEPOSIT_METHODS[departure.deposit.method]}`) : null,
    ]),
    photos(departure.photos),
    signature(departure),
  ]);

  const returnSection = returned ? createElement('section', { className: 'handover__section' }, [
    createElement('h3', { textContent: 'Retour' }),
    createElement('dl', { className: 'certificate__body' }, [
      row('Date', formatDate(returned.date)),
      row('Remarques', returned.notes || '—'),
      ...returned.damages.map((damage) => row('Dégât', `${damage.description} — ${formatEuros(damage.amount)}`)),
      row('Total des dégâts', formatEuros(returned.settlement.damagesTotal)),
      departure.deposit ? row('Caution', `${formatEuros(returned.settlement.retained)} retenus · ${formatEuros(returned.settlement.refunded)} restitués`) : null,
      row('Reste à facturer', formatEuros(returned.settlement.toInvoice)),
    ]),
    photos(returned.photos),
    signature(returned),
  ]) : null;

  return createElement('div', { className: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'handover-title' }, [
    createElement('article', { className: 'certificate handover' }, [
      createElement('header', { className: 'certificate__header' }, [
        createElement('span', { className: 'brand__mark', 'aria-hidden': 'true', textContent: 'VL' }),
        createElement('div', {}, [
          createElement('p', { className: 'certificate__issuer', textContent: `Vallet Location · agence ${machine.agency}` }),
          createElement('h2', { id: 'handover-title', className: 'certificate__title', textContent: `Bon de sortie et état des lieux — réservation n° ${reservation.id}` }),
        ]),
      ]),
      createElement('dl', { className: 'certificate__body' }, [
        row('Client', reservation.client),
        reservation.contact ? row('Contact', reservation.contact) : null,
        reservation.purchaseOrder ? row('Bon de commande', reservation.purchaseOrder) : null,
        row('Machine', `${machine.ref} · ${machine.type}`),
        row('Période de location', `du ${formatDate(reservation.start)} au ${formatDate(reservation.end)}`),
      ]),
      departureSection,
      returnSection,
      createElement('p', { className: 'certificate__footer', textContent: `Document établi le ${formatDate(state.today)}. Les photos et signatures font foi de l'état de la machine.` }),
      createElement('div', { className: 'certificate__actions' }, [
        button('Imprimer', () => window.print(), 'primary'),
        button('Fermer', () => app.closeCertificate()),
      ]),
    ]),
  ]);
};
