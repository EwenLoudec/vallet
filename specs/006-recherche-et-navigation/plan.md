# Implementation Plan: Recherche et navigation

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

## Summary

Recherche de machines par référence, statistiques cliquables, recherche d'entreprise dans le planning. Aucune règle métier ne change : tout passe par des fonctions pures de filtrage, testées.

## Technical Context

Identique à 001–005. **Contraintes** : 152 tests existants verts sans modification ; `ValletRules.search` et `ValletPlanning.grid` inchangés ; fichiers de moins de 350 lignes.

## Project Structure

```text
web/src/
├── filters.js        # + searchMachines (type facultatif, référence) ; reservations : étapes « active », « toRelocate », filtre rapide « only »
├── planning.js       # + filterByClient(rows, query) — pur
├── app.js            # + showTab(tabId, cible) pour naviguer depuis le pilotage
└── ui/
    ├── search.js     # « Tous les types », champ Référence avec suggestions
    ├── reservations.js # nouvelles étapes, filtre rapide affiché et effaçable
    ├── dashboard.js  # tuiles et lignes d'occupation cliquables
    └── planning.js   # recherche d'entreprise, cases mises en évidence
web/tests/
└── navigation.test.js
```

**Décision** : les tuiles du pilotage ne calculent rien de nouveau ; elles positionnent les filtres existants (`view.reservationFilter`, `view.planningAgency`) puis ouvrent l'onglet, pour que le chiffre et la liste viennent des mêmes fonctions.

## Complexity Tracking

Aucun écart.
