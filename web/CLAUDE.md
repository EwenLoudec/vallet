# CLAUDE.md — web

Prototype de réservation multi-agences de Vallet Location.

## Stack

HTML, CSS et JavaScript statiques. Aucune dépendance, aucune compilation. Les scripts sont **classiques** (pas de `type="module"`), pour que la page s'ouvre en `file://`.

- `src/data.js` : données de départ et date du jour, exposées en `ValletData`
- `src/rules.js` : règles métier, fonctions pures sans DOM, exposées en `ValletRules`
- `src/app.js` : état en mémoire, rendu et clics

`data.js` et `rules.js` exposent aussi `module.exports` pour être testés sous Node. Toute règle va dans `rules.js`, jamais dans `app.js`.

## Lancer

Double-cliquez sur `web/index.html`. Recharger la page remet les données de départ.

## Tester

Node n'est pas installé sur le poste ; les tests tournent dans Docker, depuis la racine du workspace :

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

Un test `node:test` par scénario de `specs/001-reservation-multi-agences/spec.md`.

## Commits

Message court à l'impératif, en anglais.
