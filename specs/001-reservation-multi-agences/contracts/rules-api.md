# Contract: `web/src/rules.js`

Global `ValletRules` in the browser, `module.exports` under Node. Every function is pure: it never mutates its arguments and never reads the clock. `state` is `{ today, machines, reservations }` as described in [data-model.md](../data-model.md).

| Function | Returns | Covers |
|----------|---------|--------|
| `vgpExpiry(lastVgp)` | ISO date: `lastVgp` + 6 months, clamped to month end | FR-007 |
| `machineBlockers(state, ref, start, end, ignoreId?)` | list of reasons why the machine cannot take that period; empty when available | FR-005, FR-006, FR-007 |
| `search(state, type, start, end)` | `{ available: Machine[], unavailable: { machine, reasons }[] }`, across all agencies | FR-001, FR-002, FR-003 |
| `validateBooking(state, request)` | `{ ok: true }` or `{ ok: false, reasons }` | FR-004 to FR-009 |
| `book(state, request)` | `{ ok: true, state, reservation }` or `{ ok: false, reasons }` | FR-004, FR-010 |
| `reservationStatuses(state)` | per reservation: `{ reservation, status: 'kept' \| 'toRelocate', reasons }` | FR-012, FR-014 |
| `alternatives(state, reservationId)` | machines of the same type available on that reservation's dates | FR-015 |
| `relocate(state, reservationId, ref)` | `{ ok: true, state }` or `{ ok: false, reasons }` | FR-015 |
| `blockMachine(state, ref, until, reason)` | `{ ok: true, state }` or `{ ok: false, reasons }` | FR-011 |
| `unblockMachine(state, ref)` | `{ ok: true, state }` | FR-011 |

## Reasons

Each reason is `{ code, message }`, where `message` is the French sentence shown to the user.

| code | Example message |
|------|-----------------|
| `overlap` | « Déjà réservée du 14/10/2026 au 18/10/2026 pour BTP Rhone (saisie par Lyon Est). » |
| `workshop` | « À l'atelier jusqu'au 20/10/2026 (verin casse). » |
| `vgp` | « VGP non à jour : échue le 05/09/2026. » |
| `past` | « La date de début ne peut pas être avant aujourd'hui (12/10/2026). » |
| `dateOrder` | « La date de fin doit être après la date de début ou le même jour. » |
| `missingField` | « Indiquez le client. » / « Indiquez l'agence qui saisit. » / « Indiquez les dates. » |
| `unknownMachine` | « Machine inconnue. » |
