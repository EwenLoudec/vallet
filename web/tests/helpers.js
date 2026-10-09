const ValletData = require('../src/data.js');

const freshState = () => JSON.parse(JSON.stringify({
  today: ValletData.today,
  machines: ValletData.machines,
  reservations: ValletData.reservations,
}));

const codes = (reasons) => reasons.map((reason) => reason.code);

module.exports = { freshState, codes };
