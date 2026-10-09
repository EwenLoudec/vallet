---

description: "Liste des tâches — Pilotage des agences"
---

# Tasks: Pilotage des agences

**Tests**: obligatoires, écrits avant le code ; les 87 tests existants restent verts.

## Phase 1: Données

- [X] T201 Ajouter dans `web/src/data.js` : `keyAccounts` (BTP Rhone, conducteurs@btp-rhone.fr, Julie Ferrand), `clientUsers` (conducteur BTP Rhone, mot de passe de démonstration), `inboxRead: {}` ; `keyAccountId` et `purchaseOrder` sur les réservations (#1 et #6 : BTP Rhone)

## Phase 2: Modules purs (tests d'abord)

- [X] T202 [P] [US16] `web/tests/accounts.test.js` puis `web/src/accounts.js` : reconnaissance « BTP Rhône », « btp rhone », espaces ; réservations d'un compte ; `book` enregistre `keyAccountId` et `purchaseOrder` ; signalement « bon de commande à fournir »
- [X] T203 [P] [US16] Tests dans `web/tests/accounts.test.js` puis `web/src/operations.js` : attestation envoyée au départ d'une nacelle de grand compte ; rien pour COMP21 ni pour un particulier
- [X] T204 [P] [US13] [US15] `web/tests/planning.test.js` puis `web/src/planning.js` : 28 jours du 05/10 au 01/11, cases NAC112, MINI07, NAC089, ECH40, filtre agence, machine vendue absente, agenda du jour Lyon Est
- [X] T205 [P] [US14] `web/tests/inbox.test.js` puis `web/src/inbox.js` : notification Duclos pour Lyon Est, nouvelle réservation Grenoble → Lyon Est, réservation en ligne, à replacer, pas de notification pour l'agence propriétaire, lecture une à une et toutes
- [X] T206 [P] [US18] `web/tests/dashboard.test.js` puis `web/src/dashboard.js` : indicateurs de US18-1, dégâts refacturés, occupation par agence

## Phase 3: Interface

- [X] T207 [US13] [US15] Onglet Planning dans `web/src/ui/planning.js` et `web/index.html`
- [X] T208 [US14] Cloche et panneau dans `web/src/ui/inbox.js`, en-tête de `web/src/app.js`
- [X] T209 [US16] Bon de commande dans `web/src/ui/search.js`, signalement et attestation envoyée dans `web/src/ui/reservation-detail.js`
- [X] T210 [US17] Espace client dans `web/src/ui/client.js`, connexion des comptes clients dans `web/src/ui/login.js` et `web/src/app.js`
- [X] T211 [US18] Onglet Pilotage dans `web/src/ui/dashboard.js`
- [X] T212 Styles dans `web/styles-pilotage.css`

## Phase 4: Validation

- [X] T213 Toute la suite `web/tests/` au vert
- [X] T214 Rejouer dans le navigateur les recettes 001, 002 et 003 ; 0 erreur console ; 1366 px sans débordement
- [X] T215 Commiter et pousser
