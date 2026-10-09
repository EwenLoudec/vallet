# Feature Specification: Réservation multi-agences

**Feature Branch**: `001-reservation-multi-agences`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Outil interne de réservation multi-agences pour Vallet Location : chercher une machine dans les 7 agences et la réserver sans erreur. Utilisateurs : agences (Sandrine Morin), atelier (Mehdi Arfaoui), commerciale grands comptes (Julie Ferrand)."

## Contexte

**Le problème** : chaque agence tient son propre planning Excel. Cela produit une dizaine de doubles réservations par mois rien qu'à Lyon Est, et une recherche de machine dans les autres agences peut prendre une demi-heure de téléphone (Doc 2). BTP Rhône, premier client avec environ 400 000 € par an, consulte d'autres loueurs depuis les doubles réservations de septembre (Doc 6).

**Priorité confirmée en entretien** : sécuriser les grands comptes (70 % du chiffre d'affaires, Doc 6) avant toute ouverture aux particuliers.

**Les utilisateurs** :

| Qui | Pour faire quoi | Source |
|-----|-----------------|--------|
| Personnel d'agence (Sandrine Morin, Lyon Est) | Trouver une machine libre dans n'importe quelle agence et la réserver pour un client | Doc 2 |
| Commerciale grands comptes (Julie Ferrand) | Savoir en temps réel ce qui est disponible pour ses clients BTP | Doc 6 |
| Atelier (Mehdi Arfaoui) | Bloquer une machine immobilisée pour qu'on arrête de la promettre | Doc 5, entretien Q3 |

**Date de référence** : dans l'outil, on est le **lundi 12 octobre 2026** (consignes).

## Clarifications

### Session 2026-10-09

- Q : Quelle règle de validité pour la VGP des nacelles ? → R : périodicité de 6 mois ; la VGP doit être valide **le jour du départ** (date de début de la location), pas forcément sur toute la durée.
- Q : Une machine est-elle réservable le jour même de son retour ? → R : non. Les dates de début et de fin sont incluses ; une machine rendue le 18/10 est réservable à partir du 19/10.
- Q : Que faire des doubles réservations reprises des fichiers Excel ? → R : la réservation saisie en premier garde la machine ; l'autre est marquée « à replacer » et l'outil propose une machine du même type disponible sur ses dates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Chercher une machine dans les 7 agences (Priority: P1)

En tant que personnel d'agence ou commerciale grands comptes, je veux chercher un type de machine sur une période et voir d'un coup les machines disponibles dans les 7 agences, afin de répondre au client sans appeler les agences une par une.

**Why this priority**: c'est la demande explicite du client pour ce matin (« chercher une machine dans les 7 agences ») et la cause de la demi-heure perdue par recherche (Doc 2).

**Independent Test**: chercher « Nacelle 12 m » du 16/10 au 17/10 et vérifier la liste rendue, sans rien réserver.

**Acceptance Scenarios**:

1. **Given** NAC112 (Lyon Est) est réservée du 14/10 au 18/10, **When** je cherche une « Nacelle 12 m » du 16/10 au 17/10, **Then** NAC112 n'est pas proposée et NAC140 (Grenoble) est proposée avec son agence affichée.
2. **Given** MINI07 est à l'atelier jusqu'au 20/10, **When** je cherche une « Mini-pelle 1.8 t » du 15/10 au 16/10, **Then** MINI07 n'est pas proposée, la raison « à l'atelier jusqu'au 20/10 » est visible, et MINI12 (Saint-Étienne) est proposée si elle est libre.
3. **Given** la VGP de NAC089 (Nacelle 16 m) date du 05/03/2026, **When** je cherche une « Nacelle 16 m » sur n'importe quelle période, **Then** NAC089 n'est pas proposée et la raison « VGP non à jour » est visible.

---

### User Story 2 - Réserver une machine sans erreur (Priority: P1)

En tant que personnel d'agence, je veux réserver une machine disponible pour un client, afin que la réservation soit visible immédiatement par les 7 agences et qu'aucune autre agence ne puisse la promettre sur les mêmes dates.

**Why this priority**: « la réserver sans erreur » est la seconde moitié de la demande. Les doubles réservations menacent le premier client (Doc 2, Doc 6).

**Independent Test**: réserver COMP30 pour un client, puis tenter une seconde réservation de COMP30 sur des dates qui se chevauchent : elle doit être refusée.

**Acceptance Scenarios**:

1. **Given** COMP30 (Annecy) est libre, **When** l'agence de Valence la réserve pour « BTP Rhône » du 13/10 au 15/10, **Then** la réservation est enregistrée avec le client, les dates et l'agence qui l'a saisie, et COMP30 n'est plus proposée sur ces dates.
2. **Given** NAC112 est réservée du 14/10 au 18/10, **When** une agence tente de réserver NAC112 du 17/10 au 20/10, **Then** la réservation est refusée et le message indique la réservation en conflit (client, dates, agence qui l'a saisie).
3. **Given** MINI07 est à l'atelier jusqu'au 20/10, **When** une agence tente de la réserver du 19/10 au 22/10, **Then** la réservation est refusée avec la raison « à l'atelier jusqu'au 20/10 ».
4. **Given** NAC089 n'a pas de VGP à jour, **When** une agence tente de la réserver, **Then** la réservation est refusée avec la raison « VGP non à jour ».
5. **Given** nous sommes le 12/10/2026, **When** une agence saisit une réservation qui commence le 10/10 ou dont la date de fin précède la date de début, **Then** la réservation est refusée avec un message qui dit quoi corriger.

---

### User Story 3 - L'atelier bloque une machine (Priority: P2)

En tant que responsable atelier, je veux déclarer une machine immobilisée jusqu'à une date, afin que les agences arrêtent de la promettre aux clients.

**Why this priority**: confirmé en entretien (Q3 : « Oui ») et demandé noir sur blanc par Mehdi (Doc 5 : « Merci d'arrêter de la promettre aux clients »). Il passe après la recherche et la réservation, qui sont la demande du jour.

**Independent Test**: bloquer ECH41 jusqu'au 16/10, puis vérifier qu'une recherche « Echafaudage 40 m2 » du 14/10 au 15/10 ne la propose plus.

**Acceptance Scenarios**:

1. **Given** ECH41 (Valence) est libre, **When** l'atelier la déclare immobilisée jusqu'au 16/10, **Then** elle n'est plus proposée ni réservable avant le 17/10, et la raison s'affiche.
2. **Given** MINI07 est à l'atelier jusqu'au 20/10, **When** l'atelier lève le blocage, **Then** MINI07 redevient proposée et réservable sur des dates libres.
3. **Given** une machine a déjà une réservation sur la période où l'atelier veut l'immobiliser, **When** l'atelier la bloque, **Then** le blocage est enregistré et la réservation concernée est signalée comme à traiter (le client devra être prévenu par l'agence).

---

### User Story 4 - Voir les conflits hérités des fichiers Excel (Priority: P3)

En tant que personnel d'agence, je veux voir les réservations reprises des fichiers Excel qui violent une règle, afin de les régler avant que le client ne se présente.

**Why this priority**: les données reprises contiennent déjà des erreurs (doublon NAC112, NAC089 réservée sans VGP à jour, Doc 3). L'outil doit les montrer, mais la demande du jour porte sur les nouvelles réservations.

**Independent Test**: ouvrir l'outil avec les données de départ et vérifier que les deux conflits connus sont signalés.

**Acceptance Scenarios**:

1. **Given** NAC112 est réservée du 14/10 au 18/10 (saisie Lyon Est, BTP Rhône, saisie en premier) et du 16/10 au 17/10 (saisie Villeurbanne, Maçonnerie Duclos), **When** j'ouvre l'outil, **Then** la réservation BTP Rhône garde NAC112, la réservation Maçonnerie Duclos est marquée « à replacer », et l'outil propose NAC140 (Grenoble), libre du 16/10 au 17/10.
2. **Given** NAC089 est réservée du 20/10 au 31/10 pour Façades Martin et sa VGP a expiré le 05/09/2026, **When** j'ouvre l'outil, **Then** cette réservation est marquée « à replacer — VGP non à jour », et l'outil indique qu'aucune autre « Nacelle 16 m » n'est disponible.
3. **Given** une réservation « à replacer » et une machine proposée, **When** l'agence choisit la machine proposée, **Then** la réservation est transférée sur cette machine aux mêmes client et dates, sous réserve des mêmes règles (FR-005 à FR-007), et n'est plus « à replacer ».

---

### Edge Cases

- **Location d'un seul jour** : une réservation du 12/10 au 12/10 est valide et occupe la machine ce jour-là (cas de COMP21, M. Pereira).
- **Location déjà commencée** : ECH40 est sortie du 06/10 au 24/10. Elle est indisponible jusqu'au 24/10 inclus, même si la réservation a commencé avant aujourd'hui.
- **Jour de retour** : une machine rendue le 18/10 n'est réservable qu'à partir du 19/10 (clarification Q2).
- **VGP qui expire pendant la location** : la VGP de NAC118 (15/04/2026) arrive à échéance le 15/10/2026. Une location de NAC118 qui part le 15/10 est acceptée, même si elle dure au-delà. Une location qui part le 16/10 ou après est refusée (clarification Q1).
- **Machine sans VGP** : les mini-pelles, compacteurs et échafaudages n'ont pas de date de VGP dans les données. La règle VGP ne s'applique qu'aux nacelles (Doc 5 : « une nacelle sans VGP à jour ne doit pas sortir »).
- **Deux agences sur la même machine au même moment** : la règle anti-chevauchement est vérifiée au moment où la réservation est confirmée, pas seulement au moment de la recherche. Une machine proposée à deux agences ne peut donc être réservée que par la première qui confirme.
- **Recherche sans résultat** : l'outil indique clairement qu'aucune machine de ce type n'est disponible sur la période, et montre pourquoi chaque machine de ce type est indisponible.

## Requirements *(mandatory)*

### Functional Requirements

**Recherche**

- **FR-001**: L'outil DOIT permettre de chercher les machines par **type** et par **période** (date de début, date de fin), sur les 7 agences à la fois. (Consignes, Doc 2)
- **FR-002**: Pour chaque machine proposée, l'outil DOIT afficher sa référence, son type et son **agence**. (Doc 2 : « un collègue d'une autre agence promet une machine qui est chez moi »)
- **FR-003**: L'outil DOIT afficher, pour chaque machine du type cherché qui n'est pas disponible, la raison : réservée (avec client et dates), à l'atelier (avec date de fin), ou VGP non à jour. (Doc 2, Doc 5)

**Réservation**

- **FR-004**: L'outil DOIT permettre de réserver une machine en saisissant le **client**, la **date de début**, la **date de fin** et l'**agence qui saisit**. (Données de départ : colonnes client, du, au, saisie_par)
- **FR-005**: L'outil DOIT refuser toute réservation dont les dates chevauchent, même d'un jour, une autre réservation de la même machine. Les dates de début et de fin sont incluses. (Doc 2, Doc 3)
- **FR-006**: L'outil DOIT refuser toute réservation d'une machine immobilisée à l'atelier sur une partie de la période. (Doc 5)
- **FR-007**: L'outil DOIT refuser la réservation d'une nacelle dont la VGP n'est pas valide le **jour du départ**. Une VGP est valide pendant 6 mois, échéance comprise : dernière VGP le 15/04/2026, valide jusqu'au 15/10/2026 inclus. (Doc 5, clarification Q1)
- **FR-008**: L'outil DOIT refuser une réservation qui commence avant la date du jour (12/10/2026) ou dont la date de fin précède la date de début.
- **FR-009**: Tout refus DOIT afficher un message qui dit quelle règle bloque et, pour un chevauchement, quelle réservation est en conflit. (Doc 5 : arrêter de promettre ; Doc 2 : savoir qui a promis la machine)
- **FR-010**: Une réservation enregistrée DOIT être visible immédiatement par toutes les agences dans la recherche. (Doc 6 : « savoir en temps réel ce qui est disponible »)

**Atelier**

- **FR-011**: L'atelier DOIT pouvoir déclarer une machine immobilisée jusqu'à une date, et lever ce blocage. (Entretien Q3, Doc 5)
- **FR-012**: Quand l'atelier bloque une machine déjà réservée sur la période, l'outil DOIT signaler la ou les réservations concernées.

**Données reprises**

- **FR-013**: L'outil DOIT démarrer avec le parc de 12 machines et les 7 réservations fournies par Vallet Location, telles quelles. (Consignes)
- **FR-014**: L'outil DOIT marquer « à replacer » les réservations reprises qui violent FR-005 ou FR-007. En cas de chevauchement, la réservation saisie en premier garde la machine. (Doc 3, clarification Q3)
- **FR-015**: Pour chaque réservation « à replacer », l'outil DOIT proposer les machines du même type disponibles sur ses dates, ou dire qu'il n'y en a aucune. L'agence DOIT pouvoir transférer la réservation sur la machine choisie. (Clarification Q3)

### Key Entities

- **Agence** : l'une des 7 agences (Lyon Est, Villeurbanne, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence).
- **Machine** : référence unique (ex. NAC112), type (ex. « Nacelle 12 m »), agence de rattachement, date de dernière VGP (nacelles seulement), immobilisation atelier éventuelle avec sa date de fin.
- **Réservation** : une machine, un client (texte libre : entreprise ou particulier), une date de début et une date de fin incluses, l'agence qui l'a saisie.
- **Immobilisation atelier** : une machine, une date de fin, un motif (ex. « vérin cassé »).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Trouver une machine disponible dans les 7 agences prend moins d'une minute, contre jusqu'à une demi-heure de téléphone aujourd'hui (Doc 2).
- **SC-002**: Il est impossible d'enregistrer deux réservations qui se chevauchent sur la même machine : 0 double réservation créée par l'outil, contre une dizaine par mois rien qu'à Lyon Est aujourd'hui (Doc 2).
- **SC-003**: Aucune nacelle sans VGP à jour ne peut être réservée (Doc 5).
- **SC-004**: Aucune machine bloquée par l'atelier ne peut être proposée ni réservée sur sa période d'immobilisation (Doc 5).
- **SC-005**: Sandrine, Mehdi et Julie réalisent seuls, sans explication, une recherche suivie d'une réservation lors de la recette du 9 octobre (consignes : « un vrai client teste seul »).

## Assumptions

- **Utilisateurs internes uniquement** : l'outil est utilisé par le personnel de Vallet Location, pas par les clients (entretien Q1 : priorité aux grands comptes ; mail client : ouverture aux particuliers reportée).
- **Pas d'identification** : pour ce prototype, l'agence qui saisit est choisie dans une liste au moment de la réservation. Il n'y a ni compte ni mot de passe.
- **Ordre de saisie** : les fichiers Excel ne donnent pas d'horodatage ; l'ordre des lignes de l'extrait fourni fait foi pour savoir quelle réservation a été saisie en premier.
- **Fin d'atelier inclusive** : « à l'atelier jusqu'au 2026-10-20 » signifie que MINI07 est indisponible jusqu'au 20/10 inclus.
- **Recherche par type exact** : chercher « Nacelle 12 m » ne propose pas de nacelle 16 m ou 20 m.
- **Inventaire de référence** : le parc réel est celui de l'atelier (entretien Q2). Les 12 machines fournies en sont un extrait.

## Hors périmètre ce matin

Chaque point est écarté par le dossier, l'entretien ou le mail au client :

- Application de réservation pour les particuliers (mail client : reportée)
- Empreinte bancaire et cautions (mail client : reportées, malgré le « oui » en entretien Q4)
- État des lieux photo au départ et au retour (entretien Q6 : arbitrage laissé à l'équipe, non retenu ce matin)
- Interface avec le logiciel de facturation (entretien Q8 : à interfacer plus tard)
- Envoi automatique des attestations VGP aux clients (Doc 6)
- Vente de machines d'occasion (entretien Q5 : secondaire)
- Modification ou annulation d'une réservation
- Saisie d'une nouvelle date de VGP par l'atelier
- Tarifs, bons de commande, gestion des clients
