---

description: "Liste des tâches — Recherche et navigation"
---

# Tasks: Recherche et navigation

**Tests**: écrits avant le code et vus en échec ; les 152 tests existants restent verts sans modification.

## Phase 1: Fonctions pures (tests d'abord)

- [X] T501 [US27] `web/tests/navigation.test.js` puis `ValletFilters.searchMachines` dans `web/src/filters.js` : US27-1 à US27-4
- [X] T502 [US28] Tests puis `ValletFilters.reservations` : étapes « active » et « toRelocate », filtre rapide `noPhoto`, `keyAccount`, `damages` ; les nombres correspondent aux indicateurs du pilotage
- [X] T503 [US29] Tests puis `ValletPlanning.filterByClient` dans `web/src/planning.js` : US29-1 à US29-3, annulées absentes

## Phase 2: Interface

- [X] T504 [US27] `web/src/ui/search.js` : « Tous les types », champ Référence avec suggestions, référence conservée par « Réserver ces dates »
- [X] T505 [US28] `web/src/ui/dashboard.js` et `app.showTab` dans `web/src/app.js` ; filtre rapide affiché dans `web/src/ui/reservations.js`
- [X] T506 [US29] `web/src/ui/planning.js` : champ de recherche, cases mises en évidence ; styles dans `web/styles-continuite.css`

## Phase 3: Validation

- [X] T507 Suite `web/tests/` au vert
- [X] T508 Recettes 001 à 006 rejouées dans le navigateur après « Réinitialiser la démonstration » ; 0 erreur console ; 375 et 1366 px sans débordement
- [X] T509 Commiter et pousser
