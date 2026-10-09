var ValletFleet = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const VGP_ALERT_DAYS = 30;
  const FOR_SALE = 'forSale';
  const SOLD = 'sold';

  const { createReason, formatDate, isBlank } = Rules;

  const refuse = (code, message) => ({ ok: false, reasons: [createReason(code, message)] });

  const replaceMachine = (state, ref, changes) => ({
    ...state,
    machines: state.machines.map((machine) => (machine.ref === ref ? { ...machine, ...changes } : machine)),
  });

  const vgpStatus = (state, machine) => {
    if (!Rules.isNacelle(machine)) {
      return null;
    }
    if (!machine.lastVgp) {
      return { status: 'expired', expiry: null, daysLeft: null };
    }
    const expiry = Rules.vgpExpiry(machine.lastVgp);
    const daysLeft = Rules.daysBetween(state.today, expiry);
    if (daysLeft < 0) {
      return { status: 'expired', expiry, daysLeft };
    }
    return { status: daysLeft <= VGP_ALERT_DAYS ? 'dueSoon' : 'valid', expiry, daysLeft };
  };

  const urgency = (alert) => (alert.daysLeft === null ? -Infinity : alert.daysLeft);

  const vgpAlerts = (state) => state.machines
    .map((machine) => ({ machine, ...vgpStatus(state, machine) }))
    .filter((alert) => alert.status === 'expired' || alert.status === 'dueSoon')
    .sort((first, second) => {
      if (urgency(first) === urgency(second)) {
        return 0;
      }
      return urgency(first) < urgency(second) ? -1 : 1;
    });

  const recordVgp = (state, ref, date) => {
    const machine = Rules.findMachine(state, ref);
    if (!machine) {
      return refuse('unknownMachine', 'Machine inconnue.');
    }
    if (!Rules.isNacelle(machine)) {
      return refuse('notNacelle', 'La VGP ne concerne que les nacelles.');
    }
    if (isBlank(date)) {
      return refuse('missingField', 'Indiquez la date de la VGP.');
    }
    if (date > state.today) {
      return refuse('vgpDate', `La date de VGP ne peut pas être après aujourd'hui (${formatDate(state.today)}).`);
    }
    if (machine.lastVgp && date < machine.lastVgp) {
      return refuse('vgpDate', `La date de VGP ne peut pas être antérieure à la dernière VGP (${formatDate(machine.lastVgp)}).`);
    }
    return { ok: true, state: replaceMachine(state, ref, { lastVgp: date }) };
  };

  const parsePrice = (price) => {
    const text = String(price === undefined || price === null ? '' : price).trim().replace(',', '.');
    const value = text === '' ? NaN : Number(text);
    return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  };

  const putOnSale = (state, ref, price) => {
    const machine = Rules.findMachine(state, ref);
    if (!machine) {
      return refuse('unknownMachine', 'Machine inconnue.');
    }
    if (Rules.isSold(machine)) {
      return refuse('sold', 'Cette machine est déjà vendue.');
    }
    const parsedPrice = parsePrice(price);
    if (parsedPrice === null) {
      return refuse('price', 'Indiquez un prix de vente supérieur à 0 €.');
    }
    return { ok: true, state: replaceMachine(state, ref, { sale: { price: parsedPrice, status: FOR_SALE } }) };
  };

  const isForSale = (machine) => Boolean(machine && machine.sale) && machine.sale.status === FOR_SALE;

  const withdrawSale = (state, ref) => {
    if (!isForSale(Rules.findMachine(state, ref))) {
      return refuse('notForSale', "Cette machine n'est pas en vente.");
    }
    return { ok: true, state: replaceMachine(state, ref, { sale: null }) };
  };

  const markSold = (state, ref) => {
    const machine = Rules.findMachine(state, ref);
    if (!isForSale(machine)) {
      return refuse('notForSale', "Mettez d'abord cette machine en vente.");
    }
    const hasActiveReservation = state.reservations.some((reservation) => reservation.ref === ref && reservation.stage !== 'returned');
    if (hasActiveReservation) {
      return refuse('activeReservation', 'Cette machine a encore une réservation en cours ou à venir.');
    }
    return { ok: true, state: replaceMachine(state, ref, { sale: { ...machine.sale, status: SOLD } }) };
  };

  const catalogue = (state) => state.machines.filter(isForSale);

  const requestPurchase = (state, request) => {
    if (!isForSale(Rules.findMachine(state, request.ref))) {
      return refuse('notForSale', "Cette machine n'est pas en vente.");
    }
    if (isBlank(request.name)) {
      return refuse('missingField', 'Indiquez votre nom.');
    }
    if (isBlank(request.contact)) {
      return refuse('contact', 'Indiquez un téléphone ou un e-mail.');
    }
    const lead = {
      id: state.leads.reduce((highestId, existing) => Math.max(highestId, existing.id), 0) + 1,
      ref: request.ref,
      name: request.name.trim(),
      contact: request.contact.trim(),
      date: state.today,
    };
    return { ok: true, lead, state: { ...state, leads: [...state.leads, lead] } };
  };

  return {
    VGP_ALERT_DAYS,
    vgpStatus,
    vgpAlerts,
    recordVgp,
    putOnSale,
    withdrawSale,
    markSold,
    isForSale,
    catalogue,
    requestPurchase,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletFleet;
}
