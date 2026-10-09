# Implementation Plan: Pilotage des agences

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

## Summary

Ajouter au prototype le planning des semaines 41 à 44, les notifications entre agences, les départs et retours du jour, l'annuaire des grands comptes avec bon de commande et envoi d'attestation, l'espace client des grands comptes et le tableau de bord. Même architecture que 001 et 002 : modules purs testés, vues minces.

## Technical Context

Identique à 002 (HTML/CSS/JS statique, scripts classiques, `node:test` dans Docker). **Contrainte** : 87 tests existants inchangés et verts ; aucune nouvelle règle bloquante ; fichiers de moins de 350 lignes.

## Constitution Check

Constitution non remplie : aucune gate.

## Affected Repos

Aucun dépôt enfant : `web/` du dépôt workspace.

## Project Structure

```text
web/src/
├── data.js           # + keyAccounts, clientUsers, inboxRead
├── rules.js          # book : keyAccountId, purchaseOrder (non bloquant)
├── operations.js     # recordDeparture : attestation envoyée pour une nacelle de grand compte
├── planning.js       # ValletPlanning : jours S41-S44, grille, agenda du jour — pur
├── inbox.js          # ValletInbox : notifications dérivées de l'état, lues/non lues — pur
├── accounts.js       # ValletAccounts : annuaire, reconnaissance, réservations d'un client — pur
├── dashboard.js      # ValletDashboard : indicateurs — pur
└── ui/
    ├── planning.js   # onglet Planning + « Aujourd'hui à … »
    ├── inbox.js      # cloche et panneau de notifications
    ├── dashboard.js  # onglet Pilotage
    └── client.js     # espace grands comptes
web/tests/
├── planning.test.js
├── inbox.test.js
├── accounts.test.js
└── dashboard.test.js
```

**Décision clé — notifications dérivées** : les notifications ne sont pas créées par chaque action ; elles sont **calculées** à partir de l'état (réservation d'une machine par une agence qui n'en est pas propriétaire ; réservation saisie par l'agence et « à replacer »). Seules les clés lues sont stockées (`inboxRead[agence]`). Aucune action existante n'a donc à être modifiée, ce qui supprime le risque de régression et garantit SC-011.

**Décision clé — comptes clients** : stockés à part (`clientUsers`), pour ne pas changer la liste des 4 comptes du personnel testée en 001.

## Complexity Tracking

Aucun écart nouveau.
