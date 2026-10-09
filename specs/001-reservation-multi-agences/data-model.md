# Data Model: Réservation multi-agences

## Agence

Liste fixe, dans cet ordre : Lyon Est, Villeurbanne, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence.

## Machine

| Champ | Type | Règle |
|-------|------|-------|
| `ref` | texte | unique (ex. `NAC112`) |
| `type` | texte | l'un des 7 types du parc (voir ci-dessous) |
| `agency` | agence | agence de rattachement |
| `lastVgp` | date ISO ou `null` | renseignée pour les nacelles uniquement |
| `workshop` | `{ until: date ISO, reason: texte }` ou `null` | immobilisation atelier, fin incluse |

Une machine est une **nacelle** si son type commence par « Nacelle ». La règle VGP ne s'applique qu'aux nacelles ; une nacelle sans `lastVgp` n'est jamais réservable.

Types du parc : Nacelle 12 m, Nacelle 16 m, Nacelle 20 m, Mini-pelle 1.8 t, Mini-pelle 3.5 t, Compacteur, Echafaudage 40 m2.

### Données de départ (Vallet Location, telles quelles)

| ref | type | agence | dernière VGP | atelier |
|-----|------|--------|--------------|---------|
| NAC112 | Nacelle 12 m | Lyon Est | 2026-07-10 | |
| NAC140 | Nacelle 12 m | Grenoble | 2026-08-20 | |
| NAC118 | Nacelle 12 m | Annecy | 2026-04-15 | |
| NAC089 | Nacelle 16 m | Lyon Est | 2026-03-05 | |
| NAC201 | Nacelle 20 m | Villeurbanne | 2026-09-02 | |
| MINI07 | Mini-pelle 1.8 t | Lyon Est | | jusqu'au 2026-10-20, vérin cassé |
| MINI12 | Mini-pelle 1.8 t | Saint-Étienne | | |
| MINI15 | Mini-pelle 3.5 t | Clermont-Ferrand | | |
| COMP21 | Compacteur | Lyon Est | | |
| COMP30 | Compacteur | Annecy | | |
| ECH40 | Echafaudage 40 m2 | Lyon Est | | |
| ECH41 | Echafaudage 40 m2 | Valence | | |

## Réservation

| Champ | Type | Règle |
|-------|------|-------|
| `id` | entier | ordre de saisie (1 à 7 pour les données de départ, puis croissant) |
| `ref` | référence machine | doit exister |
| `client` | texte | obligatoire, non vide |
| `start` | date ISO | obligatoire, ≥ date du jour pour une nouvelle réservation |
| `end` | date ISO | obligatoire, ≥ `start` |
| `enteredBy` | agence | obligatoire |

Les dates `start` et `end` sont **incluses** : une réservation du 14 au 18 occupe la machine le 18 ; elle est réservable à partir du 19.

### Données de départ (ordre = ordre de saisie)

| id | ref | client | du | au | saisie par |
|----|-----|--------|----|----|-----------|
| 1 | NAC112 | BTP Rhone | 2026-10-14 | 2026-10-18 | Lyon Est |
| 2 | NAC112 | Maconnerie Duclos | 2026-10-16 | 2026-10-17 | Villeurbanne |
| 3 | NAC089 | Facades Martin | 2026-10-20 | 2026-10-31 | Lyon Est |
| 4 | COMP21 | M. Pereira (particulier) | 2026-10-12 | 2026-10-12 | Lyon Est |
| 5 | ECH40 | Constructions Alpes | 2026-10-06 | 2026-10-24 | Lyon Est |
| 6 | NAC140 | BTP Rhone | 2026-10-19 | 2026-10-23 | Grenoble |
| 7 | MINI12 | Artisan Ferreira | 2026-10-13 | 2026-10-14 | Saint-Etienne |

## Règles de disponibilité

Une machine est **disponible** pour une période `[start, end]` si les trois conditions suivantes sont remplies :

1. **Chevauchement** : aucune réservation *gardée* de cette machine ne partage un seul jour avec la période (`a.start ≤ b.end` et `b.start ≤ a.end`).
2. **Atelier** : la machine n'est pas immobilisée, ou `start > workshop.until`.
3. **VGP** : la machine n'est pas une nacelle, ou `start ≤ échéance VGP` (dernière VGP + 6 mois, échéance comprise).

Une nouvelle réservation doit en plus avoir un client, une agence de saisie, `start ≥ date du jour` et `end ≥ start`.

## Statut dérivé d'une réservation

Calculé, jamais stocké. On parcourt les réservations par `id` croissant :

```text
gardée      → aucune des 3 règles n'est violée (le chevauchement ne compte que les réservations déjà gardées)
à replacer  → au moins une règle est violée ; motif(s) : chevauchement avec #id, atelier jusqu'au …, VGP échue le …
```

Une réservation « à replacer » ne bloque pas sa machine.

Transitions :

- **gardée → à replacer** : l'atelier immobilise la machine sur une partie de la période.
- **à replacer → gardée** : l'agence transfère la réservation sur une machine disponible du même type pour les mêmes dates, ou l'atelier lève le blocage.

Statuts attendus avec les données de départ : #2 (Duclos) est à replacer, en chevauchement avec #1, et l'alternative proposée est NAC140. #3 (Façades Martin) est à replacer pour VGP échue le 05/09/2026, sans alternative. Les autres réservations sont gardées.
