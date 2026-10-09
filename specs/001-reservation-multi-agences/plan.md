# Implementation Plan: Réservation multi-agences

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-reservation-multi-agences/spec.md`

## Summary

Prototype cliquable pour la recette client du jour : chercher une machine par type et par période dans les 7 agences, la réserver en respectant les règles (pas de chevauchement, VGP valide le jour du départ, pas de machine à l'atelier), bloquer une machine côté atelier, et replacer les réservations héritées en conflit.

Approche : une page web statique sans compilation, qui s'ouvre par double-clic. Toutes les règles métier sont des fonctions pures dans un seul fichier, testé automatiquement. L'interface ne fait qu'appeler ces fonctions et afficher leur résultat. Les consignes priment : « Un outil simple qui marche vaut mieux qu'un outil complet qui plante. »

## Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020 (scripts classiques, pas de modules ES, pour fonctionner en `file://`)

**Primary Dependencies**: aucune

**Storage**: en mémoire. Les données de départ sont embarquées dans `web/src/data.js` ; recharger la page revient aux données de départ.

**Testing**: `node:test` (intégré à Node), lancé dans Docker (`node:22-alpine`) puisque Node n'est pas installé sur le poste

**Target Platform**: navigateur récent (Edge, Chrome, Firefox) sur le poste de démonstration, sans serveur

**Project Type**: application web statique d'une page

**Performance Goals**: résultat de recherche immédiat (12 machines, 7 réservations ; SC-001 vise moins d'une minute de bout en bout pour l'utilisateur)

**Constraints**: doit démarrer à 10 h 15 sans installation ; aucun appel réseau ; date du jour figée au 2026-10-12

**Scale/Scope**: 7 agences, 12 machines, 7 réservations de départ, 3 profils d'utilisateurs, 3 onglets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` n'est pas encore rempli (modèle vide) : aucun principe à vérifier. Gate passée par défaut ; à revoir si une constitution est adoptée.

Re-vérification après la phase 1 : inchangé.

## Affected Repos

Aucun dépôt enfant. Sur décision de l'utilisateur, le code du prototype vit dans `web/`, **dans le dépôt workspace `vallet` lui-même** (voir Complexity Tracking). `repos.yml` reste vide.

Conséquence pour `/speckit-implement` : le hook obligatoire `speckit.multirepo.branch` ne trouvera aucun dépôt à brancher et s'arrêtera. À la place, la branche `001-reservation-multi-agences` est créée dans le dépôt workspace avant d'écrire du code, ce qui remplit le même rôle : rien n'est écrit sur `main`.

## Project Structure

### Documentation (this feature)

```text
specs/001-reservation-multi-agences/
├── spec.md
├── plan.md              # ce fichier
├── research.md          # décisions techniques
├── data-model.md        # entités, règles, statuts dérivés
├── quickstart.md        # comment lancer et valider
├── contracts/
│   ├── rules-api.md     # fonctions exposées par web/src/rules.js
│   └── ui.md            # écrans, champs, messages
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit-tasks
```

### Source Code

```text
web/
├── CLAUDE.md            # stack, lancement, tests, convention de commit
├── index.html           # la page : 3 onglets
├── styles.css
├── src/
│   ├── data.js          # parc et réservations de départ, date du jour
│   ├── rules.js         # règles métier, fonctions pures, sans DOM
│   └── app.js           # état en mémoire, rendu, gestion des clics
└── tests/
    └── rules.test.js    # node:test, un test par scénario de la spec
```

**Structure Decision**: une seule application statique dans `web/`. La séparation `rules.js` (pur, testé) / `app.js` (DOM) permet de tester toutes les règles de la spec sans navigateur, et garde l'interface mince.

## Complexity Tracking

| Écart | Pourquoi | Alternative plus simple rejetée parce que |
|-------|----------|-------------------------------------------|
| Code applicatif dans le dépôt workspace (`web/` suivi par `vallet`) au lieu d'un dépôt enfant | Un seul dépôt GitHub disponible (`EwenLoudec/vallet`), choix de l'utilisateur | Un dépôt `vallet-web` séparé n'a pas pu être créé ; si c'est fait plus tard, `web/` s'y déplace tel quel et se déclare avec `./bin/repos add` |
| Le hook `speckit.multirepo.branch` est remplacé par une branche du workspace | Il n'y a aucun dépôt enfant à brancher | — |
