ValletViews.publicSpace = (app) => {
  const { createElement, button, submitButton, field, dateInput, textInput, selectInput, errorMessage, flashMessage, emptyState, formatEuros, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();

  const renderHeader = () => createElement('header', { className: 'header header--public' }, [
    createElement('div', { className: 'brand' }, [
      createElement('span', { className: 'brand__mark', 'aria-hidden': 'true', textContent: 'VL' }),
      createElement('div', { className: 'brand__text' }, [
        createElement('h1', { className: 'brand__title', textContent: 'Vallet Location' }),
        createElement('p', { className: 'brand__subtitle', textContent: 'Location de matériel de chantier · 7 agences' }),
      ]),
    ]),
    createElement('div', { className: 'public-nav' }, [
      ['rent', 'Louer une machine'],
      ['used', "Machines d'occasion"],
    ].map(([tab, label]) => createElement('button', {
      type: 'button',
      className: view.publicTab === tab ? 'public-nav__link is-active' : 'public-nav__link',
      textContent: label,
      'aria-pressed': String(view.publicTab === tab),
      onClick: () => {
        view.publicTab = tab;
        app.render();
      },
    }))),
    button('Espace personnel', () => app.showLogin(), 'ghost'),
  ]);

  const renderRentBooking = (machine) => createElement('form', {
    className: 'form form--stacked public-card__form',
    onSubmit: (event) => {
      const { start, end } = view.publicCriteria;
      const result = ValletRules.bookOnline(app.getState(), {
        ref: machine.ref, start, end,
        name: formValue(event.target, 'name'),
        phone: formValue(event.target, 'phone'),
        email: formValue(event.target, 'email'),
      });
      if (!result.ok) {
        view.publicReasons = result.reasons;
        app.render();
        return;
      }
      app.commitAs(result.state, 'Client en ligne', ValletJournal.describeBooking(result.reservation));
      view.publicReasons = [];
      view.publicBookingRef = null;
      view.publicMessage = {
        kind: 'success',
        text: `Réservation confirmée (n° ${result.reservation.id}) : ${machine.type} à retirer à l'agence ${machine.agency} du ${formatDate(start)} au ${formatDate(end)}. Une caution vous sera demandée au retrait.`,
      };
      app.render();
    },
  }, [
    view.publicReasons.length > 0 ? errorMessage(view.publicReasons) : null,
    field('Nom et prénom', textInput('name')),
    createElement('div', { className: 'form__row' }, [
      field('Téléphone', textInput('phone', '', 'tel')),
      field('E-mail', textInput('email', '', 'email')),
    ]),
    submitButton('Réserver cette machine'),
  ]);

  const renderRent = () => {
    const form = createElement('form', {
      className: 'form',
      onSubmit: (event) => {
        view.publicCriteria = { type: formValue(event.target, 'type'), start: formValue(event.target, 'start'), end: formValue(event.target, 'end') };
        view.publicSearched = true;
        view.publicBookingRef = null;
        view.publicReasons = [];
        view.publicMessage = null;
        app.render();
      },
    }, [
      field('Machine', selectInput('type', app.machineTypes, view.publicCriteria.type)),
      field('Du', dateInput('start', view.publicCriteria.start)),
      field('Au', dateInput('end', view.publicCriteria.end)),
      submitButton('Voir les disponibilités'),
    ]);

    const results = [];
    if (view.publicSearched) {
      const { type, start, end } = view.publicCriteria;
      const periodReasons = ValletRules.validatePeriod(state, start, end);
      if (periodReasons.length > 0) {
        results.push(errorMessage(periodReasons));
      } else {
        const { available } = ValletRules.search(state, type, start, end);
        results.push(createElement('h3', { textContent: `${available.length} machine(s) disponible(s) du ${formatDate(start)} au ${formatDate(end)}` }));
        results.push(available.length === 0
          ? emptyState('Aucune machine de ce type n\'est libre sur ces dates. Essayez d\'autres dates ou appelez votre agence.')
          : createElement('div', { className: 'public-grid' }, available.map((machine) => createElement('article', { className: 'public-card' }, [
            createElement('h4', { className: 'public-card__title', textContent: machine.type }),
            createElement('p', { className: 'public-card__meta', textContent: `Retrait à l'agence ${machine.agency}` }),
            view.publicBookingRef === machine.ref
              ? renderRentBooking(machine)
              : button('Réserver', () => {
                view.publicBookingRef = machine.ref;
                view.publicReasons = [];
                view.publicMessage = null;
                app.render();
              }, 'primary'),
          ]))));
      }
    }

    return [
      createElement('div', { className: 'public-hero' }, [
        createElement('h2', { textContent: 'Réservez votre machine en ligne, même le soir et le week-end' }),
        createElement('p', { textContent: 'Seules les machines réellement disponibles sont proposées. Une caution est demandée au retrait.' }),
      ]),
      form,
      flashMessage(view.publicMessage),
      ...results,
    ];
  };

  const renderPurchaseForm = (machine) => createElement('form', {
    className: 'form form--stacked public-card__form',
    onSubmit: (event) => {
      const result = ValletFleet.requestPurchase(app.getState(), {
        ref: machine.ref, name: formValue(event.target, 'name'), contact: formValue(event.target, 'contact'),
      });
      if (!result.ok) {
        view.usedReasons = result.reasons;
        app.render();
        return;
      }
      app.commitAs(result.state, 'Visiteur', `Demande d'achat : ${machine.ref} par ${result.lead.name}`);
      view.usedReasons = [];
      view.usedRequestRef = null;
      view.usedMessage = { kind: 'success', text: `Demande envoyée pour ${machine.type} (${machine.ref}) : l'agence ${machine.agency} vous recontacte.` };
      app.render();
    },
  }, [
    view.usedReasons.length > 0 ? errorMessage(view.usedReasons) : null,
    field('Nom et prénom', textInput('name')),
    field('Téléphone ou e-mail', textInput('contact')),
    submitButton('Envoyer ma demande'),
  ]);

  const renderUsed = () => {
    const items = ValletFleet.catalogue(state);
    return [
      createElement('div', { className: 'public-hero' }, [
        createElement('h2', { textContent: "Machines d'occasion" }),
        createElement('p', { textContent: 'Matériel entretenu par notre atelier, à voir dans nos agences.' }),
      ]),
      flashMessage(view.usedMessage),
      items.length === 0
        ? emptyState("Aucune machine d'occasion en vente pour le moment.")
        : createElement('div', { className: 'public-grid' }, items.map((machine) => createElement('article', { className: 'public-card' }, [
          createElement('h4', { className: 'public-card__title', textContent: machine.type }),
          createElement('p', { className: 'public-card__price', textContent: formatEuros(machine.sale.price) }),
          createElement('p', { className: 'public-card__meta', textContent: `Réf. ${machine.ref} · agence ${machine.agency}` }),
          view.usedRequestRef === machine.ref
            ? renderPurchaseForm(machine)
            : button('Je suis intéressé', () => {
              view.usedRequestRef = machine.ref;
              view.usedReasons = [];
              view.usedMessage = null;
              app.render();
            }, 'primary'),
        ]))),
    ];
  };

  return [
    renderHeader(),
    createElement('main', { className: 'main' }, view.publicTab === 'used' ? renderUsed() : renderRent()),
  ];
};
