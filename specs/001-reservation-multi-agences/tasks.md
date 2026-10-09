---

description: "Liste des tâches — Réservation multi-agences"
---

# Tasks: Réservation multi-agences

**Input**: documents de conception dans `specs/001-reservation-multi-agences/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/](contracts/), [quickstart.md](quickstart.md)

**Tests**: demandés. Chaque scénario d'acceptation de la spec a un test `node:test`, écrit avant le code et vérifié en échec. Lancement depuis la racine du workspace :

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

**Organization**: une phase par user story. Les règles vont dans `web/src/rules.js` (fonctions pures, voir [contracts/rules-api.md](contracts/rules-api.md)), l'affichage dans `web/src/app.js` (voir [contracts/ui.md](contracts/ui.md)).

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichier différent, aucune dépendance sur une tâche non terminée)
- **[Story]** : user story concernée (US1 à US4)

---

## Phase 1: Setup

**Purpose**: squelette de `web/`

- [X] T001 Créer la branche `001-reservation-multi-agences` dans le dépôt workspace `vallet` à partir de `main` (remplace le hook `speckit.multirepo.branch`, voir plan.md « Affected Repos »)
- [X] T002 Créer `web/CLAUDE.md` : stack (HTML/CSS/JS statique, scripts classiques, aucune dépendance), lancement (double-clic sur `web/index.html`), tests (commande Docker ci-dessus), convention de commit (message à l'impératif, en anglais)
- [X] T003 [P] Créer `web/index.html` : en-tête « Vallet Location — Réservations » et « Aujourd'hui : lundi 12 octobre 2026 », trois onglets vides (« Rechercher et réserver », « Réservations », « Atelier »), chargement dans cet ordre de `src/data.js`, `src/rules.js`, `src/app.js` en scripts classiques (pas de `type="module"`)
- [X] T004 [P] Créer `web/styles.css` : mise en page lisible sur un écran de portable, onglets, tableaux, messages de succès et de refus visuellement distincts (pas seulement par la couleur : préfixe texte « Refusé : » / « Réservé : »)

---

## Phase 2: Foundational

**Purpose**: données et briques de règles utilisées par toutes les stories

**⚠️ CRITICAL**: aucune story ne commence avant la fin de cette phase

- [X] T005 Créer `web/src/data.js` exposant `ValletData` (global navigateur et `module.exports` sous Node) avec `today: '2026-10-12'`, la liste des 7 agences dans l'ordre « Lyon Est, Villeurbanne, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence », les 12 machines et les 7 réservations **exactement** comme dans les tableaux « Données de départ » de [data-model.md](data-model.md) (MINI07 : `workshop: { until: '2026-10-20', reason: 'verin casse' }` ; `lastVgp: null` pour les non-nacelles ; `id` 1 à 7 dans l'ordre donné)
- [X] T006 Créer `web/tests/helpers.js` : `freshState()` qui renvoie une copie profonde de `ValletData` sous la forme `{ today, machines, reservations }`, pour que chaque test parte des données de départ
- [X] T007 [P] Écrire `web/tests/foundation.test.js` (doit échouer) : `vgpExpiry('2026-04-15') === '2026-10-15'`, `vgpExpiry('2026-03-05') === '2026-09-05'`, `vgpExpiry('2026-08-31') === '2027-02-28'` ; `machineBlockers` renvoie `overlap` pour NAC112 du 17/10 au 20/10, rien pour NAC112 du 19/10 au 20/10 (dates incluses), `workshop` pour MINI07 du 19/10 au 22/10, rien pour MINI07 à partir du 21/10, `vgp` pour NAC118 au départ du 16/10, rien pour NAC118 au départ du 15/10 même jusqu'au 25/10, rien pour COMP21 (non-nacelle) quelle que soit la VGP
- [X] T008 Créer `web/src/rules.js` exposant `ValletRules` (global navigateur et `module.exports` sous Node) avec `vgpExpiry(lastVgp)` (6 mois calendaires, jour ramené au dernier jour du mois si besoin), `isNacelle(machine)` (type commençant par « Nacelle »), formatage `JJ/MM/AAAA`, et `machineBlockers(state, ref, start, end, ignoreId)` qui renvoie les raisons `{ code, message }` (`overlap`, `workshop`, `vgp`) avec les messages de [contracts/rules-api.md](contracts/rules-api.md) ; le chevauchement ne compte que les réservations **gardées** et ignore `ignoreId` ; dates comparées en chaînes ISO, jamais via `new Date()` sur l'horloge. T007 doit passer.

**Checkpoint**: `foundation.test.js` passe.

---

## Phase 3: User Story 1 — Chercher une machine dans les 7 agences (Priority: P1) 🎯 MVP

**Goal**: chercher un type sur une période et voir les machines disponibles et indisponibles (avec raison) des 7 agences.

**Independent Test**: chercher « Nacelle 12 m » du 16/10 au 17/10 sans rien réserver.

### Tests for User Story 1

- [X] T009 [P] [US1] Écrire `web/tests/search.test.js` (doit échouer) : (1) « Nacelle 12 m » du 16/10 au 17/10 → disponible NAC140 (agence Grenoble) ; indisponibles NAC112 (`overlap`, BTP Rhone) et NAC118 (`vgp`) ; (2) « Mini-pelle 1.8 t » du 15/10 au 16/10 → MINI12 disponible, MINI07 indisponible avec `workshop` et message contenant « 20/10/2026 » ; (3) « Nacelle 16 m » du 13/10 au 14/10 → aucune disponible, NAC089 indisponible avec `vgp` ; (4) une recherche couvre les machines de toutes les agences (« Compacteur » du 13/10 au 13/10 → COMP21 Lyon Est et COMP30 Annecy disponibles)

### Implementation for User Story 1

- [X] T010 [US1] Ajouter `search(state, type, start, end)` dans `web/src/rules.js` → `{ available, unavailable: [{ machine, reasons }] }`, toutes agences, type exact (« Nacelle 12 m » ne renvoie pas de 16 m). T009 doit passer.
- [X] T011 [US1] Dans `web/src/app.js`, créer l'état en mémoire à partir de `ValletData` et brancher l'onglet « Rechercher et réserver » : champs **Type de machine** (7 types), **Du**, **Au** (par défaut 12/10/2026), bouton « Rechercher » ; listes « Disponibles » (référence, type, agence) et « Indisponibles » (référence, agence, raisons) ; message « Aucune machine de ce type n'est disponible du … au …. » quand la liste est vide ; dates affichées `JJ/MM/AAAA`

**Checkpoint**: la recherche fonctionne seule dans le navigateur ; `search.test.js` passe.

---

## Phase 4: User Story 2 — Réserver une machine sans erreur (Priority: P1)

**Goal**: réserver une machine proposée ; toute règle violée bloque l'enregistrement avec un message explicite.

**Independent Test**: réserver COMP30, puis retenter COMP30 sur des dates qui se chevauchent.

### Tests for User Story 2

- [X] T012 [P] [US2] Écrire `web/tests/booking.test.js` (doit échouer) : (1) COMP30, client « BTP Rhône », du 13/10 au 15/10, saisie Valence → `ok`, la réservation porte `id` 8, `enteredBy: 'Valence'`, et `search` « Compacteur » du 14/10 au 14/10 ne propose plus COMP30 ; (2) NAC112 du 17/10 au 20/10 → refus `overlap` dont le message cite BTP Rhone, 14/10/2026, 18/10/2026 et Lyon Est ; (3) MINI07 du 19/10 au 22/10 → refus `workshop` ; (4) NAC089 du 13/10 au 14/10 → refus `vgp` ; (5) début le 10/10 → refus `past` ; fin le 13/10 pour un début le 15/10 → refus `dateOrder` ; (6) client vide ou agence vide → refus `missingField` ; (7) une réservation d'un seul jour (début = fin = 12/10) sur COMP30 → `ok` ; (8) après un `book` réussi, l'état d'origine passé en argument n'est pas modifié

### Implementation for User Story 2

- [X] T013 [US2] Ajouter `validateBooking(state, request)` et `book(state, request)` dans `web/src/rules.js` : `request = { ref, client, start, end, enteredBy }` ; client **obligatoire, non vide** ; agence **obligatoire** ; `start` **≥ date du jour** ; `end` **≥ start** ; puis `machineBlockers` ; `book` renvoie un nouvel état avec la réservation ajoutée (`id` = plus grand id + 1), sans muter l'argument. T012 doit passer.
- [X] T014 [US2] Dans `web/src/app.js`, bouton « Réserver » sur chaque machine disponible : formulaire sous la machine avec **Client**, **Agence qui saisit** (7 agences), bouton « Confirmer la réservation de {ref} » ; la règle est revérifiée à la confirmation (pas seulement à la recherche) ; succès → « Réservé : {ref} pour {client} du … au …. » puis relance de la recherche ; refus → « Refusé : » suivi de chaque message, rien n'est enregistré

**Checkpoint**: US1 + US2 forment le MVP de la démo ; `booking.test.js` passe.

---

## Phase 5: User Story 3 — L'atelier bloque une machine (Priority: P2)

**Goal**: l'atelier immobilise une machine jusqu'à une date ou la remet en service.

**Independent Test**: immobiliser ECH41 jusqu'au 16/10 et constater qu'elle n'est plus proposée du 14/10 au 15/10.

### Tests for User Story 3

- [X] T015 [P] [US3] Écrire `web/tests/workshop.test.js` (doit échouer) : (1) `blockMachine` ECH41 jusqu'au 16/10, motif « bâche déchirée » → `search` « Echafaudage 40 m2 » du 14/10 au 15/10 ne la propose pas, et elle est de nouveau proposée à partir du 17/10 ; (2) `unblockMachine` MINI07 → MINI07 proposée du 15/10 au 16/10 ; (3) `blockMachine` MINI12 jusqu'au 14/10 → la réservation #7 (Artisan Ferreira) passe « à replacer » dans `reservationStatuses` avec le motif `workshop` ; (4) `blockMachine` avec une date avant aujourd'hui ou sans date → refus

### Implementation for User Story 3

- [X] T016 [US3] Ajouter `blockMachine(state, ref, until, reason)`, `unblockMachine(state, ref)` et `reservationStatuses(state)` dans `web/src/rules.js` : statut **calculé, jamais stocké**, réservations parcourues par `id` croissant, une réservation est `toRelocate` si elle chevauche une réservation déjà gardée de la même machine, si la nacelle n'a pas de VGP valide le jour du départ, ou si la machine est à l'atelier sur une partie de la période ; sinon `kept`. T015 doit passer.
- [X] T017 [US3] Dans `web/src/app.js`, onglet « Atelier » : tableau du parc (référence, type, agence, échéance VGP pour les nacelles, état « Disponible » ou « À l'atelier jusqu'au … ») ; pour une machine disponible, champs **Jusqu'au** et **Motif** et bouton « Immobiliser {ref} » ; pour une machine à l'atelier, bouton « Remettre en service {ref} » ; si le blocage touche des réservations : « {n} réservation(s) à replacer : voir l'onglet Réservations. »

**Checkpoint**: `workshop.test.js` passe ; l'onglet Atelier fonctionne sans toucher aux autres.

---

## Phase 6: User Story 4 — Voir et replacer les conflits hérités (Priority: P3)

**Goal**: les réservations en conflit sont marquées « à replacer » et peuvent être transférées sur une machine du même type.

**Independent Test**: ouvrir l'onglet Réservations avec les données de départ.

### Tests for User Story 4

- [X] T018 [P] [US4] Écrire `web/tests/relocation.test.js` (doit échouer) : (1) avec les données de départ, `reservationStatuses` marque exactement #2 (Maconnerie Duclos, motif `overlap` avec #1) et #3 (Facades Martin, motif `vgp`, message contenant « 05/09/2026 ») comme `toRelocate`, et les 5 autres `kept` ; (2) `alternatives(state, 2)` → `[NAC140]` ; (3) `alternatives(state, 3)` → `[]` ; (4) `relocate(state, 2, 'NAC140')` → `ok`, la réservation #2 garde client, dates et `enteredBy`, porte la ref NAC140 et devient `kept` ; (5) `relocate(state, 2, 'NAC118')` → refus `vgp` ; (6) `relocate` vers une machine d'un autre type → refus

### Implementation for User Story 4

- [X] T019 [US4] Ajouter `alternatives(state, reservationId)` et `relocate(state, reservationId, ref)` dans `web/src/rules.js` : mêmes dates, même type, `machineBlockers` en ignorant la réservation elle-même ; sans muter l'argument. T018 doit passer.
- [X] T020 [US4] Dans `web/src/app.js`, onglet « Réservations » : bloc « À replacer ({n}) » en tête avec client, machine, dates, motif(s) et un bouton « Transférer sur {ref} » par alternative, ou « Aucune autre machine de ce type n'est disponible sur ces dates. » ; puis tableau de toutes les réservations trié par date de début (machine, type, agence de la machine, client, du, au, saisie par, statut « OK » / « À replacer »)

**Checkpoint**: les 4 stories fonctionnent ; tous les fichiers de `web/tests/` passent.

---

## Phase 7: Polish

- [X] T021 Rafraîchir les trois onglets après chaque action (réservation, blocage, remise en service, transfert) dans `web/src/app.js`, pour que les « à replacer » et les disponibilités soient toujours à jour
- [X] T022 Lancer toute la suite `web/tests/` via Docker et corriger jusqu'à 0 échec
- [X] T023 Dérouler à la main les 5 tests et les contrôles supplémentaires de [quickstart.md](quickstart.md) en ouvrant `web/index.html` dans un navigateur, et noter le résultat de chacun
- [X] T024 Vérifier qu'aucun élément non prévu par la spec n'a été ajouté à l'interface (barème : −1 par ajout non demandé), puis commiter et pousser la branche `001-reservation-multi-agences`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** : aucune dépendance.
- **Foundational (2)** : après la phase 1 ; bloque toutes les stories.
- **US1 (3)** : après la phase 2.
- **US2 (4)** : après US1, puisque le formulaire de réservation s'affiche dans les résultats de recherche (T014 dépend de T011). La règle `book` (T013) ne dépend que de la phase 2.
- **US3 (5)** : après la phase 2 pour les règles ; l'onglet Atelier est indépendant de US1 et US2.
- **US4 (6)** : après US3, car `reservationStatuses` (T016) est défini en US3.
- **Polish (7)** : après toutes les stories.

### Within Each User Story

Test écrit et vu en échec → règle dans `rules.js` → test au vert → interface dans `app.js`.

### Parallel Opportunities

- T003 et T004 en parallèle (fichiers différents).
- Les fichiers de test T009, T012, T015 et T018 peuvent être écrits en parallèle dès la fin de la phase 2.
- Les tâches de `rules.js` (T010, T013, T016, T019) touchent le même fichier : séquentielles. Même chose pour `app.js` (T011, T014, T017, T020, T021).

## Parallel Example: après la phase 2

```text
T009 [US1] web/tests/search.test.js
T012 [US2] web/tests/booking.test.js
T015 [US3] web/tests/workshop.test.js
T018 [US4] web/tests/relocation.test.js
```

## Implementation Strategy

### MVP d'abord (pour 10 h 15)

1. Phases 1 et 2.
2. US1 (chercher) puis US2 (réserver) : c'est exactement la demande du client, « chercher une machine dans les 7 agences et la réserver sans erreur ».
3. **Stop et validation** : `search.test.js` et `booking.test.js` au vert, tests 1 à 4 du quickstart joués à la main.

### Ensuite

4. US3 (atelier), pour Mehdi, qui viendra tester.
5. US4 (à replacer), pour le test 5 du quickstart.
6. Polish et commit.

Si le temps manque, livrer US1 + US2 qui marchent plutôt que les quatre stories à moitié (consignes : « Un outil simple qui marche vaut mieux qu'un outil complet qui plante »).

---

## Phase 8: Convergence

- [X] T025 Restore `enteredBy: 'Saint-Etienne'` on reservation 7 in `web/src/data.js`, as in the Excel extract and data-model.md, per FR-013 (contradicts)

---

## Phase 9: Correctifs après relecture

- [X] T026 Dans `web/src/rules.js`, faire compter à `machineBlockers` **toutes** les autres réservations de la machine (gardées ou à replacer) pour le chevauchement, conformément à FR-005 et à data-model.md corrigé ; mettre à jour dans `web/tests/` les cas où deux réservations chevauchent (NAC112 : #1 et #2) ; le test « a reservation to relocate still holds its machine on its dates » doit passer
- [X] T027 Refaire le style de `web/styles.css` (en-tête, onglets, cartes, tableaux, statuts « OK » / « À replacer » en pastilles avec texte, focus visible, espacements sur l'échelle 4/8/16/24/32 px) et ajouter dans `web/src/app.js` les seules classes nécessaires, sans ajouter d'élément ni de fonction à l'interface

---

## Phase 10: User Story 5 — Connexion fictive, et charte XEFI (Priority: P2)

**Goal**: se connecter avec un compte de démonstration, voir son nom, avoir son agence pré-remplie ; interface aux couleurs XEFI.

**Independent Test**: connexion de Sandrine Morin, nom en en-tête, « Lyon Est » pré-rempli, déconnexion.

- [X] T028 [P] [US5] Écrire `web/tests/auth.test.js` (doit échouer) : compte valide → `ok` avec nom, rôle, agence ; e-mail en majuscules avec espaces → `ok` ; mot de passe faux et e-mail inconnu → même message « E-mail ou mot de passe incorrect. » ; champs vides → refus ; `findUser` par e-mail
- [X] T029 [US5] Ajouter les 4 comptes de data-model.md dans `web/src/data.js` (`ValletData.users`) et créer `web/src/auth.js` (`ValletAuth.authenticate`, `ValletAuth.findUser`, global navigateur et `module.exports`) ; T028 doit passer
- [X] T030 [US5] Dans `web/index.html` et `web/src/app.js` : écran de connexion (FR-016 à FR-018), en-tête utilisateur et déconnexion (FR-019), pré-remplissage de l'agence (FR-020), session en `sessionStorage` protégée par `try/catch` (FR-021) ; charger `src/auth.js` avant `src/app.js`
- [X] T031 Appliquer la charte XEFI dans `web/styles.css` et `web/index.html` (couleurs, Montserrat avec repli système, icônes SVG des onglets), sans aucune autre fonction
- [X] T032 Lancer toute la suite `web/tests/` et rejouer dans le navigateur les 5 tests du quickstart plus les scénarios US5, avant de commiter
