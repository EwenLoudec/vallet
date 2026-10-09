const ValletData = require('../src/data.js');

const freshState = () => JSON.parse(JSON.stringify({
  today: ValletData.today,
  machines: ValletData.machines,
  reservations: ValletData.reservations,
  leads: ValletData.leads,
  keyAccounts: ValletData.keyAccounts,
  inboxRead: ValletData.inboxRead,
  journal: ValletData.journal,
}));

const codes = (reasons) => reasons.map((reason) => reason.code);

const updateReservation = (state, id, changes) => ({
  ...state,
  reservations: state.reservations.map((reservation) => (reservation.id === id ? { ...reservation, ...changes } : reservation)),
});

const updateMachine = (state, ref, changes) => ({
  ...state,
  machines: state.machines.map((machine) => (machine.ref === ref ? { ...machine, ...changes } : machine)),
});

const photo = (name) => ({ name, url: `blob:${name}` });

module.exports = { freshState, codes, updateReservation, updateMachine, photo };
