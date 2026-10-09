ValletViews.sales = (app) => {
  const { createElement, button, submitButton, field, amountInput, errorMessage, flashMessage, table, cell, refCell, badge, emptyState, formatEuros, formValue } = ValletDom;
  const { formatDate } = ValletRules;
  const { view } = app;
  const state = app.getState();

  const commit = (ref, result, successText) => {
    if (!result.ok) {
      view.salesReasonsByRef = { [ref]: result.reasons };
      view.salesMessage = null;
      app.render();
      return;
    }
    app.setState(result.state);
    view.salesReasonsByRef = {};
    view.salesMessage = { kind: 'success', text: successText };
    app.render();
  };

  const saleBadge = (machine) => {
    if (!machine.sale) {
      return badge('Non en vente', 'neutral');
    }
    if (machine.sale.status === 'sold') {
      return badge(`Vendue · ${formatEuros(machine.sale.price)}`, 'info');
    }
    return badge(`En vente · ${formatEuros(machine.sale.price)}`, 'ok');
  };

  const renderActions = (machine) => {
    const reasons = view.salesReasonsByRef[machine.ref] || [];
    const errors = reasons.length > 0 ? errorMessage(reasons) : null;
    if (ValletRules.isSold(machine)) {
      return createElement('span', { className: 'field__hint', textContent: 'Retirée du parc.' });
    }
    if (ValletFleet.isForSale(machine)) {
      return createElement('div', {}, [
        errors,
        createElement('div', { className: 'button-group' }, [
          button(`Marquer ${machine.ref} vendue`, () => commit(machine.ref, ValletFleet.markSold(app.getState(), machine.ref), `Vendue : ${machine.ref} ne se loue plus.`), 'primary'),
          button('Retirer de la vente', () => commit(machine.ref, ValletFleet.withdrawSale(app.getState(), machine.ref), `${machine.ref} n'est plus en vente.`)),
        ]),
      ]);
    }
    return createElement('div', {}, [
      errors,
      createElement('form', {
        className: 'form form--compact',
        onSubmit: (event) => {
          const price = formValue(event.target, 'price');
          const result = ValletFleet.putOnSale(app.getState(), machine.ref, price);
          commit(machine.ref, result, result.ok ? `En vente : ${machine.ref} à ${formatEuros(ValletRules.findMachine(result.state, machine.ref).sale.price)}, visible dans le catalogue public.` : '');
        },
      }, [
        field('Prix (€)', amountInput('price')),
        submitButton(`Mettre ${machine.ref} en vente`),
      ]),
    ]);
  };

  const machineRows = state.machines.map((machine) => createElement('tr', {}, [
    refCell(machine.ref),
    cell(machine.type),
    cell(machine.agency),
    cell(saleBadge(machine)),
    cell(renderActions(machine)),
  ]));

  const leadRows = [...state.leads].reverse().map((lead) => {
    const machine = ValletRules.findMachine(state, lead.ref);
    return createElement('tr', {}, [
      cell(formatDate(lead.date)),
      refCell(lead.ref),
      cell(machine.type),
      cell(lead.name),
      cell(lead.contact),
    ]);
  });

  return [
    flashMessage(view.salesMessage),
    createElement('h2', { textContent: `Demandes d'achat (${state.leads.length})` }),
    leadRows.length === 0
      ? emptyState("Aucune demande pour le moment. Les demandes envoyées depuis le catalogue public « Machines d'occasion » arrivent ici.")
      : table(['Date', 'Machine', 'Type', 'Nom', 'Contact'], leadRows),
    createElement('h2', { className: 'section-title', textContent: "Machines d'occasion" }),
    table(['Référence', 'Type', 'Agence', 'Vente', ''], machineRows),
  ];
};
