# Quickstart: Réservation multi-agences

## Lancer le prototype

Double-cliquez sur `web/index.html`. Aucune installation ni aucun serveur n'est nécessaire. Recharger la page remet les données de départ.

## Lancer les tests des règles

Depuis la racine du workspace, avec Docker démarré :

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W 2>/dev/null || pwd):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

Attendu : tous les tests passent, avec un test par scénario de la spec.

## Recette manuelle (5 tests de la spec)

| # | Étant donné | Quand | Alors |
|---|-------------|-------|-------|
| 1 | Données de départ | Je cherche « Nacelle 12 m » du 16/10 au 17/10 | NAC140 (Grenoble) est disponible. NAC112 est indisponible, déjà réservée pour BTP Rhone. NAC118 est indisponible, VGP échue le 15/10. |
| 2 | Données de départ | Je réserve COMP30 pour « BTP Rhône » du 13/10 au 15/10, saisie Valence | Succès. Une nouvelle recherche sur ces dates montre COMP30 indisponible. |
| 3 | Données de départ | Je tente NAC112 du 17/10 au 20/10 | Refus, avec la réservation BTP Rhone du 14/10 au 18/10. NAC112 n'est même pas proposée. |
| 4 | Données de départ | Je cherche « Mini-pelle 1.8 t » du 15/10 au 16/10 | MINI07 est indisponible (atelier jusqu'au 20/10). MINI12 est disponible. |
| 5 | Données de départ | J'ouvre l'onglet Réservations | Il y a 2 réservations à replacer. Duclos peut être transférée sur NAC140. Façades Martin est à replacer pour VGP échue, sans alternative. |

Contrôles supplémentaires :

- Dans l'onglet Atelier, immobilisez ECH41 jusqu'au 16/10. Une recherche « Echafaudage 40 m2 » du 14/10 au 15/10 ne la propose plus. Remettez-la en service : elle revient.
- Une réservation qui commence le 10/10, ou dont la fin précède le début, est refusée avec un message.
