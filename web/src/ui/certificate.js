ValletViews.certificate = (app, reservationId) => {
  const { createElement, button } = ValletDom;
  const { formatDate } = ValletRules;
  const data = ValletOperations.certificate(app.getState(), reservationId);
  if (!data) {
    return null;
  }

  const row = (label, value) => createElement('div', { className: 'certificate__row' }, [
    createElement('dt', { textContent: label }),
    createElement('dd', { textContent: value }),
  ]);

  return createElement('div', { className: 'overlay', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'certificate-title' }, [
    createElement('article', { className: 'certificate' }, [
      createElement('header', { className: 'certificate__header' }, [
        createElement('span', { className: 'brand__mark', 'aria-hidden': 'true', textContent: 'VL' }),
        createElement('div', {}, [
          createElement('p', { className: 'certificate__issuer', textContent: 'Vallet Location · Atelier' }),
          createElement('h2', { id: 'certificate-title', className: 'certificate__title', textContent: 'Attestation de vérification générale périodique' }),
        ]),
      ]),
      createElement('dl', { className: 'certificate__body' }, [
        row('Client', data.client),
        row('Machine', `${data.ref} · ${data.type}`),
        row('Agence', data.agency),
        row('Période de location', `du ${formatDate(data.start)} au ${formatDate(data.end)}`),
        row('Dernière VGP', data.lastVgp ? formatDate(data.lastVgp) : '—'),
        row('Échéance', data.expiry ? formatDate(data.expiry) : '—'),
      ]),
      createElement('p', { className: data.coversRental ? 'certificate__statement' : 'certificate__statement certificate__statement--warning', textContent: data.statement }),
      createElement('p', { className: 'certificate__footer', textContent: `Document établi le ${formatDate(app.getState().today)} à partir du registre des VGP de Vallet Location.` }),
      createElement('div', { className: 'certificate__actions' }, [
        button('Imprimer', () => window.print(), 'primary'),
        button('Fermer', () => app.closeCertificate()),
      ]),
    ]),
  ]);
};
