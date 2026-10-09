# Implementation Plan: Continuité et recherche

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

## Summary

Conserver l'état dans le navigateur avec une remise à zéro, réduire les photos pour qu'elles tiennent, filtrer la liste des réservations, et ajouter une fiche machine dans la fenêtre superposée de 004.

## Technical Context

Identique à 001–004. **Contraintes** : 136 tests existants verts sans modification ; aucune règle métier modifiée ; fichiers de moins de 350 lignes.

## Constitution Check

Constitution non remplie : aucune gate.

## Project Structure

```text
web/src/
├── persistence.js     # ValletPersistence : serialize, restore (version, contrôle de forme) — pur
├── filters.js         # ValletFilters : reservations(state, { query, agency, stage }) — pur
├── machines.js        # ValletMachines : history(state, ref) — pur
├── app.js             # lecture/écriture localStorage, avertissement, réinitialisation, focus conservé au rendu
└── ui/
    ├── dom.js         # photoPicker : réduction 1 024 px JPEG
    ├── reservations.js # barre de filtres
    ├── machine-detail.js # fiche machine
    └── modal.js       # la fenêtre accepte une réservation ou une machine
web/tests/
├── persistence.test.js
├── filters.test.js
└── machines.test.js
```

**Décision — stockage** : `localStorage`, clé `vallet.data`, enveloppe `{ version, state }`. Écriture après chaque `app.commit` et chaque `app.setState` (notifications lues) ; toute erreur d'écriture devient un avertissement visible (FR-062). Lecture à l'ouverture via `ValletPersistence.restore`, qui retombe sur les données de départ en cas de problème (FR-060). Remplace la décision 7 de la recherche 001.

**Décision — focus au rendu** : `app.render` mémorise l'élément actif (clé `data-focus-key`) et la position du curseur, puis les restaure : la recherche se met à jour à chaque frappe sans perdre la saisie.

## Complexity Tracking

Aucun écart.
