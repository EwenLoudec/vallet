---

description: "Liste des tâches — Continuité et recherche"
---

# Tasks: Continuité et recherche

**Tests**: obligatoires, écrits avant le code ; les 136 tests existants restent verts sans modification.

## Phase 1: Modules purs (tests d'abord)

- [X] T401 [US24] `web/tests/persistence.test.js` puis `web/src/persistence.js` : aller-retour complet (photos et signatures en data URL, journal), absence, JSON illisible, autre version, forme incomplète
- [X] T402 [US25] `web/tests/filters.test.js` puis `web/src/filters.js` : US25-1 à US25-4, numéro exact en premier, accents
- [X] T403 [US26] `web/tests/machines.test.js` puis `web/src/machines.js` : US26-1, US26-2, états atelier, en vente, vendue

## Phase 2: Interface

- [X] T404 [US24] `web/src/app.js` : lecture à l'ouverture, écriture après chaque action, avertissement, « Réinitialiser la démonstration » avec confirmation dans l'onglet Pilotage ; session déplacée dans `web/src/ui/session.js` pour garder `app.js` sous 350 lignes
- [X] T405 [US24] `web/src/ui/dom.js` : photos réduites à 1 024 px JPEG
- [X] T406 [US25] Barre de filtres dans `web/src/ui/reservations.js` ; focus et curseur conservés au rendu dans `web/src/app.js`
- [X] T407 [US26] `web/src/ui/machine-detail.js`, `web/src/ui/modal.js` ; liens depuis l'Atelier, le planning et la fiche réservation
- [X] T408 Styles dans `web/styles-continuite.css` ; mise à jour de la recherche 001 (décision 7), du cas limite de 002, de `web/CLAUDE.md` et du quickstart 001

## Phase 3: Validation

- [X] T409 Toute la suite `web/tests/` au vert
- [X] T410 Rejouer les recettes 001 à 005 dans le navigateur, en partant de « Réinitialiser la démonstration » ; 0 erreur console ; 375 et 1366 px sans débordement
- [X] T411 Commiter et pousser
