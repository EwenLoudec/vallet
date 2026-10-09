var ValletOperations = (() => {
  const Rules = typeof ValletRules !== 'undefined' ? ValletRules : require('./rules.js');

  const DEPOSIT_METHODS = {
    'card-hold': 'Empreinte bancaire (simulée)',
    cheque: 'Chèque',
    cash: 'Espèces',
  };
  const CSV_SEPARATOR = ';';
  const CSV_LINE_BREAK = '\r\n';
  const UTF8_BOM = '﻿';

  const { createReason, formatDate, isBlank } = Rules;

  const refuse = (code, message) => ({ ok: false, reasons: [createReason(code, message)] });

  const parseAmount = (amount) => {
    const text = String(amount === undefined || amount === null ? '' : amount).trim().replace(',', '.');
    const value = text === '' ? NaN : Number(text);
    return Number.isFinite(value) ? Math.round(value * 100) / 100 : null;
  };

  const roundCents = (value) => Math.round(value * 100) / 100;

  const replaceReservation = (state, id, changes) => ({
    ...state,
    reservations: state.reservations.map((reservation) => (reservation.id === id ? { ...reservation, ...changes } : reservation)),
  });

  const statusOf = (state, id) => Rules.reservationStatuses(state).find((evaluation) => evaluation.reservation.id === id);

  const depositReason = (deposit) => {
    const amount = deposit ? parseAmount(deposit.amount) : null;
    if (amount === null || amount <= 0 || !deposit || !DEPOSIT_METHODS[deposit.method]) {
      return createReason('deposit', 'Enregistrez la caution du client particulier.');
    }
    return null;
  };

  const readSignature = (signature) => {
    if (!signature || isBlank(signature.image)) {
      return { value: null, reason: null };
    }
    if (isBlank(signature.name)) {
      return { value: null, reason: createReason('signature', 'Indiquez le nom de la personne qui signe.') };
    }
    return { value: { name: signature.name.trim(), image: signature.image }, reason: null };
  };

  const isSigned = (inspection) => Boolean(inspection && inspection.signature);

  const recordDeparture = (state, id, departure) => {
    const reservation = Rules.findReservation(state, id);
    if (!reservation) {
      return refuse('unknownReservation', 'Réservation inconnue.');
    }
    if (reservation.stage !== 'booked') {
      return refuse('stage', 'Cette réservation est déjà sortie ou rendue.');
    }
    if (statusOf(state, id).status === 'toRelocate') {
      return refuse('toRelocate', 'Cette réservation est à replacer : transférez-la sur une autre machine avant le départ.');
    }
    const reasons = [];
    const date = departure.date;
    if (isBlank(date)) {
      reasons.push(createReason('missingField', 'Indiquez la date du départ.'));
    } else if (date < reservation.start || date > reservation.end) {
      reasons.push(createReason('departureDate', `La date de départ doit être comprise entre le ${formatDate(reservation.start)} et le ${formatDate(reservation.end)}.`));
    }
    if (!departure.photos || departure.photos.length === 0) {
      reasons.push(createReason('noPhoto', 'Ajoutez au moins une photo de la machine au départ.'));
    }
    const machine = Rules.findMachine(state, reservation.ref);
    if (!isBlank(date) && !Rules.hasValidVgpOn(machine, date)) {
      reasons.push(createReason('vgp', `VGP non à jour le ${formatDate(date)} : la nacelle ne peut pas sortir.`));
    }
    const isPrivate = reservation.customerType === Rules.PRIVATE_CUSTOMER;
    const invalidDeposit = isPrivate ? depositReason(departure.deposit) : null;
    if (invalidDeposit) {
      reasons.push(invalidDeposit);
    }
    const signature = readSignature(departure.signature);
    if (signature.reason) {
      reasons.push(signature.reason);
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    }
    const deposit = isPrivate ? { amount: parseAmount(departure.deposit.amount), method: departure.deposit.method } : null;
    const recordedDeparture = { date, photos: [...departure.photos], notes: (departure.notes || '').trim(), deposit, imported: false };
    if (signature.value) {
      recordedDeparture.signature = signature.value;
    }
    const keyAccount = reservation.keyAccountId
      ? (state.keyAccounts || []).find((account) => account.id === reservation.keyAccountId)
      : null;
    if (keyAccount && Rules.isNacelle(machine)) {
      recordedDeparture.certificateSentTo = { email: keyAccount.contactEmail, date: state.today };
    }
    return {
      ok: true,
      state: replaceReservation(state, id, { stage: 'out', departure: recordedDeparture }),
    };
  };

  const settle = (deposit, damages) => {
    const damagesTotal = roundCents(damages.reduce((total, damage) => total + damage.amount, 0));
    const depositAmount = deposit ? deposit.amount : 0;
    const retained = Math.min(damagesTotal, depositAmount);
    return {
      damagesTotal,
      retained,
      refunded: roundCents(depositAmount - retained),
      toInvoice: roundCents(damagesTotal - retained),
    };
  };

  const recordReturn = (state, id, returned) => {
    const reservation = Rules.findReservation(state, id);
    if (!reservation) {
      return refuse('unknownReservation', 'Réservation inconnue.');
    }
    if (reservation.stage !== 'out') {
      return refuse('stage', 'Seule une machine sortie peut être rendue.');
    }
    const reasons = [];
    const date = returned.date;
    if (isBlank(date)) {
      reasons.push(createReason('missingField', 'Indiquez la date du retour.'));
    } else if (date < reservation.departure.date) {
      reasons.push(createReason('returnDate', `La date de retour ne peut pas être avant le départ (${formatDate(reservation.departure.date)}).`));
    }
    if (!returned.photos || returned.photos.length === 0) {
      reasons.push(createReason('noPhoto', 'Ajoutez au moins une photo de la machine au retour.'));
    }
    const damages = (returned.damages || []).map((damage) => ({
      description: (damage.description || '').trim(),
      amount: parseAmount(damage.amount),
    }));
    if (damages.some((damage) => damage.description === '' || damage.amount === null || damage.amount < 0)) {
      reasons.push(createReason('damage', 'Chaque dégât doit avoir une description et un montant positif ou nul.'));
    }
    const signature = readSignature(returned.signature);
    if (signature.reason) {
      reasons.push(signature.reason);
    }
    if (reasons.length > 0) {
      return { ok: false, reasons };
    }
    const recordedReturn = {
      date,
      photos: [...returned.photos],
      notes: (returned.notes || '').trim(),
      damages,
      settlement: settle(reservation.departure.deposit, damages),
    };
    if (signature.value) {
      recordedReturn.signature = signature.value;
    }
    return { ok: true, state: replaceReservation(state, id, { stage: 'returned', return: recordedReturn }) };
  };

  const certificate = (state, id) => {
    const reservation = Rules.findReservation(state, id);
    const machine = reservation ? Rules.findMachine(state, reservation.ref) : null;
    if (!machine || !Rules.isNacelle(machine)) {
      return null;
    }
    const expiry = machine.lastVgp ? Rules.vgpExpiry(machine.lastVgp) : null;
    const coversRental = expiry !== null && expiry >= reservation.end;
    let statement = 'VGP valide pendant toute la période de location.';
    if (expiry === null) {
      statement = 'Aucune VGP enregistrée pour cette nacelle.';
    } else if (!coversRental) {
      statement = `VGP à renouveler le ${formatDate(expiry)}, avant la fin de la location.`;
    }
    return {
      client: reservation.client,
      ref: machine.ref,
      type: machine.type,
      agency: machine.agency,
      start: reservation.start,
      end: reservation.end,
      lastVgp: machine.lastVgp,
      expiry,
      coversRental,
      statement,
    };
  };

  const formatEuros = (amount) => amount.toFixed(2).replace('.', ',');

  const csvField = (value) => {
    const text = String(value);
    return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  const BILLING_HEADERS = [
    'Réservation', 'Client', 'Type de client', 'Machine', 'Agence', 'Départ', 'Retour', 'Jours',
    'Dégâts à refacturer (€)', 'Caution retenue (€)', 'Reste à facturer (€)',
  ];

  const billingRow = (state, reservation) => {
    const machine = Rules.findMachine(state, reservation.ref);
    const { settlement } = reservation.return;
    return [
      reservation.id,
      reservation.client,
      reservation.customerType === Rules.PRIVATE_CUSTOMER ? 'Particulier' : 'Professionnel',
      `${machine.ref} (${machine.type})`,
      machine.agency,
      formatDate(reservation.departure.date),
      formatDate(reservation.return.date),
      Rules.daysBetween(reservation.departure.date, reservation.return.date) + 1,
      formatEuros(settlement.damagesTotal),
      formatEuros(settlement.retained),
      formatEuros(settlement.toInvoice),
    ];
  };

  const billingCsv = (state) => {
    const returned = state.reservations
      .filter((reservation) => reservation.stage === 'returned')
      .sort((first, second) => first.id - second.id);
    if (returned.length === 0) {
      return { ok: false, message: 'Aucune location rendue à exporter.' };
    }
    const lines = [BILLING_HEADERS, ...returned.map((reservation) => billingRow(state, reservation))]
      .map((fields) => fields.map(csvField).join(CSV_SEPARATOR));
    return { ok: true, rowCount: returned.length, content: `${UTF8_BOM}${lines.join(CSV_LINE_BREAK)}${CSV_LINE_BREAK}` };
  };

  return {
    DEPOSIT_METHODS,
    isSigned,
    recordDeparture,
    recordReturn,
    settle,
    certificate,
    billingCsv,
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValletOperations;
}
