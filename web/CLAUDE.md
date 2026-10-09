# CLAUDE.md — web

Prototype de réservation multi-agences de Vallet Location.

## Stack

HTML, CSS et JavaScript statiques. Aucune dépendance, aucune compilation. Les scripts sont **classiques** (pas de `type="module"`), pour que la page s'ouvre en `file://`.

- `src/data.js` : données de départ, comptes fictifs et date du jour (`ValletData`)
- `src/rules.js` : disponibilité et réservation (`ValletRules`)
- `src/fleet.js` : VGP, alertes et vente d'occasion (`ValletFleet`)
- `src/operations.js` : départ, retour, caution, attestation VGP, export facturation (`ValletOperations`)
- `src/auth.js` : connexion fictive (`ValletAuth`)
- `src/ui/*.js` : une vue par écran, enregistrée dans `ValletViews` ; `ui/dom.js` fournit la fabrique d'éléments
- `src/app.js` : état en mémoire, session, navigation et rendu

Les modules `data`, `rules`, `fleet`, `operations` et `auth` sont purs et exposent aussi `module.exports` pour être testés sous Node. Toute règle va dans ces modules, jamais dans `ui/` ni `app.js`. L'ordre des `<script>` de `index.html` compte : modules purs, puis `ui/dom.js`, puis les vues, puis `app.js`.

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
