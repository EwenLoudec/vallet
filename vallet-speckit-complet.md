# Vallet Location — dossier spec-kit complet

Export du 09/10/2026 de toutes les spécifications spec-kit du projet, précédé d'un récapitulatif. Les sources restent les fichiers de `specs/` dans le dépôt `EwenLoudec/vallet` (branche `001-reservation-multi-agences`) : en cas d'écart, ce sont eux qui font foi.

## Sommaire

1. Récapitulatif
2. Annexe — documents spec-kit, feature par feature (001 à 006)

---

# 1. Récapitulatif

## Le projet

Outil interne de réservation et d'exploitation du parc de Vallet Location (7 agences en Auvergne-Rhône-Alpes), construit pour le TP « Du besoin au prototype ». Il part du dossier client (Docs 1 à 6), de l'entretien de clarification et des consignes du jour, et suit le cycle spec-kit : prise de besoin → plan → tâches → implémentation → convergence.

**Besoin retenu** (entretien Q1) : sécuriser les grands comptes (70 % du chiffre d'affaires) en supprimant les doubles réservations, avant toute ouverture aux particuliers.

## Où sont les choses

| Élément | Emplacement |
|---------|-------------|
| Dépôt (workspace spec-kit + code) | `https://github.com/EwenLoudec/vallet`, branche `001-reservation-multi-agences` |
| Copie locale | `C:\Users\Utilisateur\vallet` |
| Spécifications | `specs/001-…` à `specs/005-…` |
| Prototype | `web/` (HTML, CSS, JavaScript, sans dépendance) |
| Tests | `web/tests/` (163 tests `node:test`) |
| Outillage spec-kit | `.specify/` (spec-kit 1.1.2, intégration Claude, extension multirepo) |
| Constitution | `.specify/memory/constitution.md` — **non remplie** (modèle vide) |

## Lancer et tester

- **Ouvrir** : double-cliquer sur `web/index.html`. Aucune installation, aucun serveur.
- **Données** : conservées dans le navigateur (`localStorage`, clé `vallet.data`). Avant une démonstration : onglet **Pilotage → « Réinitialiser la démonstration »**.
- **Tests** (Node n'est pas installé : ils tournent dans Docker), depuis `C:\Users\Utilisateur\vallet` :

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

## Comptes de démonstration (fictifs)

Mot de passe commun : `vallet2026`.

| Compte | Rôle | Ce qu'il voit |
|--------|------|---------------|
| sandrine.morin@vallet-location.fr | Responsable d'agence · Lyon Est | Tout l'outil, notifications de Lyon Est, agence pré-remplie |
| mehdi.arfaoui@vallet-location.fr | Responsable atelier | Tout l'outil |
| julie.ferrand@vallet-location.fr | Commerciale grands comptes | Tout l'outil |
| brice.vallet@vallet-location.fr | Direction | Tout l'outil |
| conducteur@btp-rhone.fr | Conducteur de travaux, BTP Rhone (grand compte) | Espace client : ses réservations, attestations VGP, disponibilités |

Sans compte : « Particuliers : réserver en ligne » et « Machines d'occasion » depuis l'écran de connexion.

## Les 6 features

| # | Feature | User stories | Exigences | Tâches | Ce qu'elle apporte |
|---|---------|--------------|-----------|--------|--------------------|
| 001 | Réservation multi-agences | US1–US5 | FR-001–FR-021 | 32 | Recherche dans les 7 agences, réservation sans double réservation, VGP, atelier, réservations héritées « à replacer », connexion fictive, charte XEFI |
| 002 | Exploitation du parc | US6–US12 | FR-022–FR-039 | 22 | Suivi et alertes VGP, état des lieux avec photos, cautions des particuliers, attestation VGP, export facturation CSV, réservation en ligne, vente d'occasion |
| 003 | Pilotage des agences | US13–US18 | FR-040–FR-049 | 15 | Planning semaines 41–44, notifications entre agences, départs et retours du jour, grands comptes et bon de commande, espace client, tableau de bord |
| 004 | Fiabiliser l'exploitation | US19–US23 | FR-050–FR-058 | 17 | Modifier / annuler, signature du client, bon de sortie imprimable, prochaine disponibilité, journal d'activité, fiche en fenêtre |
| 005 | Continuité et recherche | US24–US26 | FR-059–FR-065 | 11 | Données conservées, réinitialisation, recherche de réservations, fiche machine |
| 006 | Recherche et navigation | US27–US30 | FR-066–FR-070 | 11 | Recherche par référence, statistiques du pilotage cliquables, recherche d'entreprise dans le planning, agence choisie dans « Aujourd'hui » |
| | **Total** | **30** | **70** | **108 (toutes faites)** | Critères de réussite SC-001 à SC-023 |

## Règles métier clés (vérifiées par les tests)

- **Aucune double réservation** : une machine ne peut pas être réservée deux fois sur des jours qui se chevauchent, dates de début et de fin incluses. Une réservation « à replacer » garde sa machine tant qu'elle n'est pas transférée.
- **VGP** : 6 mois ; une nacelle doit avoir une VGP valide **le jour du départ** (clarification Q1). Alerte 30 jours avant l'échéance.
- **Jour de retour** : une machine rendue le 18 est réservable le 19 (Q2) ; un retour anticipé libère la machine dès le lendemain.
- **Doublons hérités des Excel** : la réservation saisie en premier garde la machine, l'autre est « à replacer » (Q3).
- **Atelier** : une machine immobilisée n'est ni proposée ni réservable jusqu'à sa date de fin incluse.
- **État des lieux** : au moins une photo au départ et au retour ; signature du client facultative mais signalée si absente.
- **Caution** : obligatoire pour un particulier au départ ; réglée au retour (retenue = min(dégâts, caution)).
- **Date du jour** figée au lundi 12/10/2026 (consignes).

## Arbitrages et écarts à connaître

| Point | Décision |
|-------|----------|
| Un seul dépôt GitHub | Le code est dans `web/` du dépôt workspace, au lieu d'un dépôt enfant ; les hooks multirepo (`branch`, `status`) n'ont aucun dépôt à traiter et ont été remplacés par une branche du workspace et un contrôle manuel. |
| Particuliers en ligne et occasion | Inclus à la demande de l'équipe (« vraiment tout »), alors que le mail au client les reportait : à annoncer comme ajouts. |
| Connexion | Demande de l'équipe, hors dossier client : à annoncer comme ajout. Comptes et mot de passe fictifs, en clair, pas une vraie sécurité. |
| Paiement | Empreinte bancaire **simulée** : aucune donnée de carte n'est saisie ni stockée. |
| E-mails | Envoi des attestations VGP **simulé**. |
| Données | Propres à chaque navigateur ; un partage entre agences demandera un serveur. |
| Spec-kit sous Windows | `specify` et les scripts spec-kit tournent dans Docker (Python et uv absents du poste). Les deux `SKILL.md` de l'extension multirepo, créés en liens symboliques Linux, ont été remplacés par des copies. |

## Historique des commits

| Commit | Étape |
|--------|-------|
| `26e330d` | Workspace spec-kit et spec 001 |
| `2f70fa2` | Plan 001 |
| `ac0420b` | Tâches 001 |
| `177500a` | Prototype 001 |
| `781ccf3` | Convergence 001 (orthographe héritée « Saint-Etienne ») |
| `30ff5c9` | Trou de double réservation corrigé, nouveau style |
| `7251efb` | Connexion fictive, charte XEFI |
| `1fa4c41` | Spec, plan, tâches 002 |
| `dfb02ed` | Implémentation 002 |
| `cc53fa7` | Alignement plan et contrat 002 |
| `b9360bb` | Feature 003 |
| `d48b832` | Feature 004 |
| `3a506b5` | Fiche en fenêtre (004, phase 4) |
| `86e1b9b` | Feature 005 |
| `be4e514` | Export spec-kit consolidé |
| `f82951a` | Feature 006 |
| (ce commit) | Agence dans « Aujourd'hui » (006, phase 4) |

---

# 2. Annexe — documents spec-kit

Chaque document est reproduit tel quel ; ses titres sont décalés d'un niveau pour s'insérer dans ce dossier.

## Feature 001-reservation-multi-agences

### `specs/001-reservation-multi-agences/spec.md`

#### Feature Specification: Réservation multi-agences

**Feature Branch**: `001-reservation-multi-agences`

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Outil interne de réservation multi-agences pour Vallet Location : chercher une machine dans les 7 agences et la réserver sans erreur. Utilisateurs : agences (Sandrine Morin), atelier (Mehdi Arfaoui), commerciale grands comptes (Julie Ferrand)."

##### Contexte

**Le problème** : chaque agence tient son propre planning Excel. Cela produit une dizaine de doubles réservations par mois rien qu'à Lyon Est, et une recherche de machine dans les autres agences peut prendre une demi-heure de téléphone (Doc 2). BTP Rhône, premier client avec environ 400 000 € par an, consulte d'autres loueurs depuis les doubles réservations de septembre (Doc 6).

**Priorité confirmée en entretien** : sécuriser les grands comptes (70 % du chiffre d'affaires, Doc 6) avant toute ouverture aux particuliers.

**Les utilisateurs** :

| Qui | Pour faire quoi | Source |
|-----|-----------------|--------|
| Personnel d'agence (Sandrine Morin, Lyon Est) | Trouver une machine libre dans n'importe quelle agence et la réserver pour un client | Doc 2 |
| Commerciale grands comptes (Julie Ferrand) | Savoir en temps réel ce qui est disponible pour ses clients BTP | Doc 6 |
| Atelier (Mehdi Arfaoui) | Bloquer une machine immobilisée pour qu'on arrête de la promettre | Doc 5, entretien Q3 |

**Date de référence** : dans l'outil, on est le **lundi 12 octobre 2026** (consignes).

##### Clarifications

###### Session 2026-10-09

- Q : Quelle règle de validité pour la VGP des nacelles ? → R : périodicité de 6 mois ; la VGP doit être valide **le jour du départ** (date de début de la location), pas forcément sur toute la durée.
- Q : Une machine est-elle réservable le jour même de son retour ? → R : non. Les dates de début et de fin sont incluses ; une machine rendue le 18/10 est réservable à partir du 19/10.
- Q : Que faire des doubles réservations reprises des fichiers Excel ? → R : la réservation saisie en premier garde la machine ; l'autre est marquée « à replacer » et l'outil propose une machine du même type disponible sur ses dates.

##### User Scenarios & Testing *(mandatory)*

###### User Story 1 - Chercher une machine dans les 7 agences (Priority: P1)

En tant que personnel d'agence ou commerciale grands comptes, je veux chercher un type de machine sur une période et voir d'un coup les machines disponibles dans les 7 agences, afin de répondre au client sans appeler les agences une par une.

**Why this priority**: c'est la demande explicite du client pour ce matin (« chercher une machine dans les 7 agences ») et la cause de la demi-heure perdue par recherche (Doc 2).

**Independent Test**: chercher « Nacelle 12 m » du 16/10 au 17/10 et vérifier la liste rendue, sans rien réserver.

**Acceptance Scenarios**:

1. **Given** NAC112 (Lyon Est) est réservée du 14/10 au 18/10, **When** je cherche une « Nacelle 12 m » du 16/10 au 17/10, **Then** NAC112 n'est pas proposée et NAC140 (Grenoble) est proposée avec son agence affichée.
2. **Given** MINI07 est à l'atelier jusqu'au 20/10, **When** je cherche une « Mini-pelle 1.8 t » du 15/10 au 16/10, **Then** MINI07 n'est pas proposée, la raison « à l'atelier jusqu'au 20/10 » est visible, et MINI12 (Saint-Étienne) est proposée si elle est libre.
3. **Given** la VGP de NAC089 (Nacelle 16 m) date du 05/03/2026, **When** je cherche une « Nacelle 16 m » sur n'importe quelle période, **Then** NAC089 n'est pas proposée et la raison « VGP non à jour » est visible.

---

###### User Story 2 - Réserver une machine sans erreur (Priority: P1)

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

###### User Story 3 - L'atelier bloque une machine (Priority: P2)

En tant que responsable atelier, je veux déclarer une machine immobilisée jusqu'à une date, afin que les agences arrêtent de la promettre aux clients.

**Why this priority**: confirmé en entretien (Q3 : « Oui ») et demandé noir sur blanc par Mehdi (Doc 5 : « Merci d'arrêter de la promettre aux clients »). Il passe après la recherche et la réservation, qui sont la demande du jour.

**Independent Test**: bloquer ECH41 jusqu'au 16/10, puis vérifier qu'une recherche « Echafaudage 40 m2 » du 14/10 au 15/10 ne la propose plus.

**Acceptance Scenarios**:

1. **Given** ECH41 (Valence) est libre, **When** l'atelier la déclare immobilisée jusqu'au 16/10, **Then** elle n'est plus proposée ni réservable avant le 17/10, et la raison s'affiche.
2. **Given** MINI07 est à l'atelier jusqu'au 20/10, **When** l'atelier lève le blocage, **Then** MINI07 redevient proposée et réservable sur des dates libres.
3. **Given** une machine a déjà une réservation sur la période où l'atelier veut l'immobiliser, **When** l'atelier la bloque, **Then** le blocage est enregistré et la réservation concernée est signalée comme à traiter (le client devra être prévenu par l'agence).

---

###### User Story 4 - Voir les conflits hérités des fichiers Excel (Priority: P3)

En tant que personnel d'agence, je veux voir les réservations reprises des fichiers Excel qui violent une règle, afin de les régler avant que le client ne se présente.

**Why this priority**: les données reprises contiennent déjà des erreurs (doublon NAC112, NAC089 réservée sans VGP à jour, Doc 3). L'outil doit les montrer, mais la demande du jour porte sur les nouvelles réservations.

**Independent Test**: ouvrir l'outil avec les données de départ et vérifier que les deux conflits connus sont signalés.

**Acceptance Scenarios**:

1. **Given** NAC112 est réservée du 14/10 au 18/10 (saisie Lyon Est, BTP Rhône, saisie en premier) et du 16/10 au 17/10 (saisie Villeurbanne, Maçonnerie Duclos), **When** j'ouvre l'outil, **Then** la réservation BTP Rhône garde NAC112, la réservation Maçonnerie Duclos est marquée « à replacer », et l'outil propose NAC140 (Grenoble), libre du 16/10 au 17/10.
2. **Given** NAC089 est réservée du 20/10 au 31/10 pour Façades Martin et sa VGP a expiré le 05/09/2026, **When** j'ouvre l'outil, **Then** cette réservation est marquée « à replacer — VGP non à jour », et l'outil indique qu'aucune autre « Nacelle 16 m » n'est disponible.
3. **Given** une réservation « à replacer » et une machine proposée, **When** l'agence choisit la machine proposée, **Then** la réservation est transférée sur cette machine aux mêmes client et dates, sous réserve des mêmes règles (FR-005 à FR-007), et n'est plus « à replacer ».

---

###### User Story 5 - Se connecter et voir son nom (Priority: P2)

En tant qu'utilisateur de Vallet Location, je veux me connecter avec mon e-mail et mon mot de passe, afin de voir mon nom et mon rôle dans l'outil et que mon agence soit déjà renseignée quand je réserve.

**Why this priority**: demandée par l'équipe projet pour la démonstration (pas par le dossier client : voir « Origine » ci-dessous). Elle ne change aucune règle de réservation.

**Independent Test**: se connecter avec le compte de Sandrine Morin, vérifier son nom en en-tête, se déconnecter.

**Acceptance Scenarios**:

1. **Given** l'outil vient d'être ouvert, **When** personne n'est connecté, **Then** seul l'écran de connexion est visible, avec la liste des comptes de démonstration.
2. **Given** le compte de démonstration de Sandrine Morin, **When** elle saisit son e-mail (majuscules ou espaces autour acceptés) et le bon mot de passe, **Then** l'outil s'ouvre et l'en-tête affiche « Sandrine Morin », « Responsable d'agence · Lyon Est » et un bouton « Se déconnecter ».
3. **Given** l'écran de connexion, **When** l'e-mail est inconnu ou le mot de passe faux, **Then** le message « E-mail ou mot de passe incorrect. » s'affiche, sans dire lequel des deux est faux, et rien ne s'ouvre.
4. **Given** Sandrine Morin est connectée, **When** elle ouvre le formulaire de réservation, **Then** « Agence qui saisit » vaut déjà « Lyon Est » et reste modifiable.
5. **Given** un utilisateur connecté, **When** il recharge la page, **Then** il reste connecté (les données reviennent à celles de départ, comme avant) ; **When** il clique sur « Se déconnecter », **Then** l'écran de connexion revient.

**Origine** : demande de l'équipe projet du 09/10/2026, hors dossier client. À annoncer à Brice comme un ajout s'il demande le journal des ajouts.

---

###### Edge Cases

- **Location d'un seul jour** : une réservation du 12/10 au 12/10 est valide et occupe la machine ce jour-là (cas de COMP21, M. Pereira).
- **Location déjà commencée** : ECH40 est sortie du 06/10 au 24/10. Elle est indisponible jusqu'au 24/10 inclus, même si la réservation a commencé avant aujourd'hui.
- **Jour de retour** : une machine rendue le 18/10 n'est réservable qu'à partir du 19/10 (clarification Q2).
- **VGP qui expire pendant la location** : la VGP de NAC118 (15/04/2026) arrive à échéance le 15/10/2026. Une location de NAC118 qui part le 15/10 est acceptée, même si elle dure au-delà. Une location qui part le 16/10 ou après est refusée (clarification Q1).
- **Machine sans VGP** : les mini-pelles, compacteurs et échafaudages n'ont pas de date de VGP dans les données. La règle VGP ne s'applique qu'aux nacelles (Doc 5 : « une nacelle sans VGP à jour ne doit pas sortir »).
- **Deux agences sur la même machine au même moment** : la règle anti-chevauchement est vérifiée au moment où la réservation est confirmée, pas seulement au moment de la recherche. Une machine proposée à deux agences ne peut donc être réservée que par la première qui confirme.
- **Recherche sans résultat** : l'outil indique clairement qu'aucune machine de ce type n'est disponible sur la période, et montre pourquoi chaque machine de ce type est indisponible.

##### Requirements *(mandatory)*

###### Functional Requirements

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

**Connexion (US5, demande de l'équipe projet)**

- **FR-016**: L'outil DOIT afficher un écran de connexion tant que personne n'est connecté ; aucun onglet n'est accessible avant.
- **FR-017**: L'outil DOIT accepter uniquement les comptes de démonstration fictifs : Sandrine Morin (Responsable d'agence, Lyon Est), Mehdi Arfaoui (Responsable atelier), Julie Ferrand (Commerciale grands comptes), Brice Vallet (Direction). L'e-mail est comparé sans tenir compte des majuscules ni des espaces autour.
- **FR-018**: Un échec de connexion DOIT afficher « E-mail ou mot de passe incorrect. » sans révéler lequel des deux est faux.
- **FR-019**: Une fois connecté, l'en-tête DOIT afficher le nom, le rôle, l'agence s'il y en a une, et un bouton « Se déconnecter ».
- **FR-020**: Le formulaire de réservation DOIT pré-remplir « Agence qui saisit » avec l'agence de l'utilisateur connecté, s'il en a une ; le champ reste modifiable.
- **FR-021**: La connexion DOIT survivre au rechargement de la page pendant la session du navigateur, et disparaître à la déconnexion.

###### Key Entities

- **Agence** : l'une des 7 agences (Lyon Est, Villeurbanne, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence).
- **Machine** : référence unique (ex. NAC112), type (ex. « Nacelle 12 m »), agence de rattachement, date de dernière VGP (nacelles seulement), immobilisation atelier éventuelle avec sa date de fin.
- **Réservation** : une machine, un client (texte libre : entreprise ou particulier), une date de début et une date de fin incluses, l'agence qui l'a saisie.
- **Immobilisation atelier** : une machine, une date de fin, un motif (ex. « vérin cassé »).
- **Utilisateur** (fictif) : nom, e-mail, mot de passe de démonstration, rôle, agence éventuelle.

##### Success Criteria *(mandatory)*

###### Measurable Outcomes

- **SC-001**: Trouver une machine disponible dans les 7 agences prend moins d'une minute, contre jusqu'à une demi-heure de téléphone aujourd'hui (Doc 2).
- **SC-002**: Il est impossible d'enregistrer deux réservations qui se chevauchent sur la même machine : 0 double réservation créée par l'outil, contre une dizaine par mois rien qu'à Lyon Est aujourd'hui (Doc 2).
- **SC-003**: Aucune nacelle sans VGP à jour ne peut être réservée (Doc 5).
- **SC-004**: Aucune machine bloquée par l'atelier ne peut être proposée ni réservée sur sa période d'immobilisation (Doc 5).
- **SC-005**: Sandrine, Mehdi et Julie réalisent seuls, sans explication, une recherche suivie d'une réservation lors de la recette du 9 octobre (consignes : « un vrai client teste seul »).

##### Assumptions

- **Utilisateurs internes uniquement** : l'outil est utilisé par le personnel de Vallet Location, pas par les clients (entretien Q1 : priorité aux grands comptes ; mail client : ouverture aux particuliers reportée).
- **Connexion fictive** : les comptes et le mot de passe de démonstration sont écrits dans le prototype et affichés sur l'écran de connexion. Ce n'est pas une sécurité réelle ; une vraie authentification (annuaire de l'entreprise) viendra avec un vrai serveur.
- **Ordre de saisie** : les fichiers Excel ne donnent pas d'horodatage ; l'ordre des lignes de l'extrait fourni fait foi pour savoir quelle réservation a été saisie en premier.
- **Fin d'atelier inclusive** : « à l'atelier jusqu'au 2026-10-20 » signifie que MINI07 est indisponible jusqu'au 20/10 inclus.
- **Recherche par type exact** : chercher « Nacelle 12 m » ne propose pas de nacelle 16 m ou 20 m.
- **Inventaire de référence** : le parc réel est celui de l'atelier (entretien Q2). Les 12 machines fournies en sont un extrait.

##### Hors périmètre ce matin

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

### `specs/001-reservation-multi-agences/plan.md`

#### Implementation Plan: Réservation multi-agences

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](specs/001-reservation-multi-agences/spec.md)

**Input**: Feature specification from `specs/001-reservation-multi-agences/spec.md`

##### Summary

Prototype cliquable pour la recette client du jour : chercher une machine par type et par période dans les 7 agences, la réserver en respectant les règles (pas de chevauchement, VGP valide le jour du départ, pas de machine à l'atelier), bloquer une machine côté atelier, et replacer les réservations héritées en conflit.

Approche : une page web statique sans compilation, qui s'ouvre par double-clic. Toutes les règles métier sont des fonctions pures dans un seul fichier, testé automatiquement. L'interface ne fait qu'appeler ces fonctions et afficher leur résultat. Les consignes priment : « Un outil simple qui marche vaut mieux qu'un outil complet qui plante. »

##### Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020 (scripts classiques, pas de modules ES, pour fonctionner en `file://`)

**Primary Dependencies**: aucune

**Storage**: en mémoire. Les données de départ sont embarquées dans `web/src/data.js` ; recharger la page revient aux données de départ.

**Testing**: `node:test` (intégré à Node), lancé dans Docker (`node:22-alpine`) puisque Node n'est pas installé sur le poste

**Target Platform**: navigateur récent (Edge, Chrome, Firefox) sur le poste de démonstration, sans serveur

**Project Type**: application web statique d'une page

**Performance Goals**: résultat de recherche immédiat (12 machines, 7 réservations ; SC-001 vise moins d'une minute de bout en bout pour l'utilisateur)

**Constraints**: doit démarrer à 10 h 15 sans installation ; aucun appel réseau ; date du jour figée au 2026-10-12

**Scale/Scope**: 7 agences, 12 machines, 7 réservations de départ, 3 profils d'utilisateurs, 3 onglets

##### Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` n'est pas encore rempli (modèle vide) : aucun principe à vérifier. Gate passée par défaut ; à revoir si une constitution est adoptée.

Re-vérification après la phase 1 : inchangé.

##### Affected Repos

Aucun dépôt enfant. Sur décision de l'utilisateur, le code du prototype vit dans `web/`, **dans le dépôt workspace `vallet` lui-même** (voir Complexity Tracking). `repos.yml` reste vide.

Conséquence pour `/speckit-implement` : le hook obligatoire `speckit.multirepo.branch` ne trouvera aucun dépôt à brancher et s'arrêtera. À la place, la branche `001-reservation-multi-agences` est créée dans le dépôt workspace avant d'écrire du code, ce qui remplit le même rôle : rien n'est écrit sur `main`.

##### Project Structure

###### Documentation (this feature)

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

###### Source Code

```text
web/
├── CLAUDE.md            # stack, lancement, tests, convention de commit
├── index.html           # la page : connexion, puis 3 onglets
├── styles.css           # charte XEFI
├── src/
│   ├── data.js          # parc, réservations de départ, comptes fictifs, date du jour
│   ├── rules.js         # règles métier, fonctions pures, sans DOM
│   ├── auth.js          # connexion fictive, fonction pure (US5)
│   └── app.js           # état en mémoire, session, rendu, gestion des clics
└── tests/               # node:test, un test par scénario de la spec
    ├── helpers.js
    ├── foundation.test.js
    ├── search.test.js       # US1
    ├── booking.test.js      # US2
    ├── workshop.test.js     # US3
    ├── relocation.test.js   # US4
    ├── auth.test.js         # US5
    └── invariants.test.js   # aucune double réservation, quelle que soit la suite d'actions
```

**Structure Decision**: une seule application statique dans `web/`. La séparation `rules.js` (pur, testé) / `app.js` (DOM) permet de tester toutes les règles de la spec sans navigateur, et garde l'interface mince.

##### Complexity Tracking

| Écart | Pourquoi | Alternative plus simple rejetée parce que |
|-------|----------|-------------------------------------------|
| Code applicatif dans le dépôt workspace (`web/` suivi par `vallet`) au lieu d'un dépôt enfant | Un seul dépôt GitHub disponible (`EwenLoudec/vallet`), choix de l'utilisateur | Un dépôt `vallet-web` séparé n'a pas pu être créé ; si c'est fait plus tard, `web/` s'y déplace tel quel et se déclare avec `./bin/repos add` |
| Le hook `speckit.multirepo.branch` est remplacé par une branche du workspace | Il n'y a aucun dépôt enfant à brancher | — |

### `specs/001-reservation-multi-agences/research.md`

#### Research: Réservation multi-agences

##### 1. Forme du prototype

- **Decision**: page HTML statique, scripts classiques, sans compilation ni dépendance, ouverte par double-clic sur `web/index.html`.
- **Rationale**: les consignes demandent un prototype qui démarre à 10 h 15 et précisent qu'« une simple page web suffit ». Le poste n'a ni Node ni PHP. Les modules ES sont bloqués en `file://` par les navigateurs, d'où des scripts classiques.
- **Alternatives considered**: Nuxt (défaut Xefi pour `web`) : build et serveur nécessaires, disproportionné pour une démo d'une matinée. Laravel + Livewire : pas de PHP sur le poste. Page servie par un conteneur : un point de panne de plus le jour de la démo.

##### 2. Où vivent les règles

- **Decision**: `web/src/rules.js` contient uniquement des fonctions pures (entrée : état + demande ; sortie : résultat). Il expose un objet global `ValletRules` dans le navigateur et `module.exports` sous Node.
- **Rationale**: les consignes pénalisent les régressions (« une règle qui n'est écrite que dans une conversation avec l'IA disparaît »). Des tests automatiques sur chaque scénario de la spec protègent les règles quand on corrige le prototype à l'étape 4.
- **Alternatives considered**: règles mêlées au code d'affichage : impossibles à tester sans navigateur.

##### 3. Tests

- **Decision**: `node --test 'web/tests/*.test.js'` dans `node:22-alpine` via Docker.
- **Rationale**: `node:test` est intégré à Node, donc aucune dépendance à installer ; Docker est déjà en place sur le poste.
- **Alternatives considered**: Jest, Vitest : nécessitent `npm install`. Tests manuels seuls : ne protègent pas des régressions.

##### 4. Dates

- **Decision**: dates manipulées comme chaînes ISO `AAAA-MM-JJ`, comparées en ordre lexicographique ; affichage `JJ/MM/AAAA`. Date du jour lue dans `data.js` (`2026-10-12`), jamais depuis l'horloge.
- **Rationale**: aucune ambiguïté de fuseau horaire ; la comparaison de chaînes ISO est exacte pour des dates sans heure ; la date figée est exigée par les consignes.
- **Alternatives considered**: objets `Date` : décalages de fuseau possibles au passage à minuit.

##### 5. Échéance VGP

- **Decision**: échéance = date de dernière VGP + 6 mois calendaires, échéance comprise. Si le jour n'existe pas dans le mois d'arrivée (31/08 + 6 mois), on prend le dernier jour du mois.
- **Rationale**: clarification Q1 (6 mois, valide le jour du départ). Exemples : 15/04/2026 → 15/10/2026 ; 05/03/2026 → 05/09/2026.

##### 6. Statut « à replacer »

- **Decision**: le statut n'est pas stocké, il est recalculé à chaque affichage. On parcourt les réservations dans l'ordre de saisie ; une réservation est « à replacer » si elle chevauche une réservation déjà gardée sur la même machine, si la nacelle n'a pas de VGP valide le jour du départ, ou si la machine est à l'atelier sur une partie de la période. Sinon elle est gardée.
- **Rationale**: un seul endroit décide ; le statut reste juste après un blocage atelier (FR-012) ou un transfert (FR-015), sans risque d'oubli de mise à jour.
- **Alternatives considered**: statut stocké sur la réservation : doit être tenu à jour à chaque action, source classique d'incohérence.

##### 7. Persistance

> Remplacée le 09/10/2026 par la feature 005 : l'état est désormais conservé dans le navigateur (`localStorage`), avec un bouton « Réinitialiser la démonstration » dans l'onglet Pilotage pour retrouver les scénarios reproductibles.

- **Decision**: aucune ; l'état vit en mémoire.
- **Rationale**: le prototype sert une recette de 8 minutes par binôme ; repartir des données de départ à chaque rechargement rend les scénarios de Brice reproductibles. La spec ne demande pas de conserver les saisies.
- **Alternatives considered**: `localStorage` : des réservations de test persisteraient d'une recette à l'autre.

##### 8. Connexion fictive (US5)

- **Decision**: comptes de démonstration dans `web/src/data.js` ; vérification par une fonction pure `ValletAuth.authenticate(users, email, password)` dans `web/src/auth.js`, testée sous Node ; l'e-mail de l'utilisateur connecté est gardé en `sessionStorage` (lecture et écriture protégées par `try/catch`, l'outil marche sans).
- **Rationale**: une vraie authentification exige un serveur, hors de portée du prototype. `sessionStorage` garde la connexion au rechargement sans la garder d'un jour à l'autre, et fonctionne en `file://`.
- **Alternatives considered**: `localStorage` : la connexion survivrait à la fermeture du navigateur, ce qui gêne l'enchaînement des binômes. Pas de mot de passe (choix d'un profil) : moins réaliste pour la démonstration demandée.

##### 9. Charte graphique

- **Decision**: couleurs de la charte XEFI relevées sur xefi.com (rouge `#E10600`, anthracite `#2B2D42`, gris `#F8F8F8` / `#EBEBEB`), police Montserrat chargée depuis Google Fonts avec repli sur les polices système si le poste est hors ligne ; icônes en SVG intégré, sans fichier externe.
- **Rationale**: demande de l'équipe projet ; le repli garantit que la page s'affiche correctement sans réseau le jour de la démo.

### `specs/001-reservation-multi-agences/data-model.md`

#### Data Model: Réservation multi-agences

##### Agence

Liste fixe, dans cet ordre : Lyon Est, Villeurbanne, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence.

##### Machine

| Champ | Type | Règle |
|-------|------|-------|
| `ref` | texte | unique (ex. `NAC112`) |
| `type` | texte | l'un des 7 types du parc (voir ci-dessous) |
| `agency` | agence | agence de rattachement |
| `lastVgp` | date ISO ou `null` | renseignée pour les nacelles uniquement |
| `workshop` | `{ until: date ISO, reason: texte }` ou `null` | immobilisation atelier, fin incluse |

Une machine est une **nacelle** si son type commence par « Nacelle ». La règle VGP ne s'applique qu'aux nacelles ; une nacelle sans `lastVgp` n'est jamais réservable.

Types du parc : Nacelle 12 m, Nacelle 16 m, Nacelle 20 m, Mini-pelle 1.8 t, Mini-pelle 3.5 t, Compacteur, Echafaudage 40 m2.

###### Données de départ (Vallet Location, telles quelles)

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

##### Réservation

| Champ | Type | Règle |
|-------|------|-------|
| `id` | entier | ordre de saisie (1 à 7 pour les données de départ, puis croissant) |
| `ref` | référence machine | doit exister |
| `client` | texte | obligatoire, non vide |
| `start` | date ISO | obligatoire, ≥ date du jour pour une nouvelle réservation |
| `end` | date ISO | obligatoire, ≥ `start` |
| `enteredBy` | agence | obligatoire |

Les dates `start` et `end` sont **incluses** : une réservation du 14 au 18 occupe la machine le 18 ; elle est réservable à partir du 19.

###### Données de départ (ordre = ordre de saisie)

| id | ref | client | du | au | saisie par |
|----|-----|--------|----|----|-----------|
| 1 | NAC112 | BTP Rhone | 2026-10-14 | 2026-10-18 | Lyon Est |
| 2 | NAC112 | Maconnerie Duclos | 2026-10-16 | 2026-10-17 | Villeurbanne |
| 3 | NAC089 | Facades Martin | 2026-10-20 | 2026-10-31 | Lyon Est |
| 4 | COMP21 | M. Pereira (particulier) | 2026-10-12 | 2026-10-12 | Lyon Est |
| 5 | ECH40 | Constructions Alpes | 2026-10-06 | 2026-10-24 | Lyon Est |
| 6 | NAC140 | BTP Rhone | 2026-10-19 | 2026-10-23 | Grenoble |
| 7 | MINI12 | Artisan Ferreira | 2026-10-13 | 2026-10-14 | Saint-Etienne |

##### Règles de disponibilité

Une machine est **disponible** pour une période `[start, end]` si les trois conditions suivantes sont remplies :

1. **Chevauchement** : aucune autre réservation de cette machine, gardée ou à replacer, ne partage un seul jour avec la période (FR-005) (`a.start ≤ b.end` et `b.start ≤ a.end`).
2. **Atelier** : la machine n'est pas immobilisée, ou `start > workshop.until`.
3. **VGP** : la machine n'est pas une nacelle, ou `start ≤ échéance VGP` (dernière VGP + 6 mois, échéance comprise).

Une nouvelle réservation doit en plus avoir un client, une agence de saisie, `start ≥ date du jour` et `end ≥ start`.

##### Statut dérivé d'une réservation

Calculé, jamais stocké. On parcourt les réservations par `id` croissant :

```text
gardée      → aucune des 3 règles n'est violée (le chevauchement ne compte que les réservations déjà gardées)
à replacer  → au moins une règle est violée ; motif(s) : chevauchement avec #id, atelier jusqu'au …, VGP échue le …
```

Une réservation « à replacer » **continue de bloquer sa machine sur ses dates** tant qu'elle n'est pas transférée : sinon une autre agence pourrait reprendre la machine et créer une double réservation (FR-005). Le calcul du statut, lui, ne compare qu'aux réservations déjà gardées, pour que la première saisie garde la machine (clarification Q3).

Transitions :

- **gardée → à replacer** : l'atelier immobilise la machine sur une partie de la période.
- **à replacer → gardée** : l'agence transfère la réservation sur une machine disponible du même type pour les mêmes dates, ou l'atelier lève le blocage.

Statuts attendus avec les données de départ : #2 (Duclos) est à replacer, en chevauchement avec #1, et l'alternative proposée est NAC140. #3 (Façades Martin) est à replacer pour VGP échue le 05/09/2026, sans alternative. Les autres réservations sont gardées.

##### Utilisateur (fictif, US5)

| Champ | Type | Règle |
|-------|------|-------|
| `email` | texte | unique ; comparé en minuscules, sans espaces autour |
| `password` | texte | mot de passe de démonstration, affiché sur l'écran de connexion |
| `name` | texte | affiché en en-tête |
| `role` | texte | affiché sous le nom |
| `agency` | agence ou `null` | pré-remplit « Agence qui saisit » |

| Nom | E-mail | Rôle | Agence |
|-----|--------|------|--------|
| Sandrine Morin | sandrine.morin@vallet-location.fr | Responsable d'agence | Lyon Est |
| Mehdi Arfaoui | mehdi.arfaoui@vallet-location.fr | Responsable atelier | — |
| Julie Ferrand | julie.ferrand@vallet-location.fr | Commerciale grands comptes | — |
| Brice Vallet | brice.vallet@vallet-location.fr | Direction | — |

Mot de passe de démonstration commun : `vallet2026`.

### `specs/001-reservation-multi-agences/contracts/rules-api.md`

#### Contract: `web/src/rules.js`

Global `ValletRules` in the browser, `module.exports` under Node. Every function is pure: it never mutates its arguments and never reads the clock. `state` is `{ today, machines, reservations }` as described in [data-model.md](specs/001-reservation-multi-agences/data-model.md).

| Function | Returns | Covers |
|----------|---------|--------|
| `vgpExpiry(lastVgp)` | ISO date: `lastVgp` + 6 months, clamped to month end | FR-007 |
| `machineBlockers(state, ref, start, end, ignoreId?)` | list of reasons why the machine cannot take that period; empty when available | FR-005, FR-006, FR-007 |
| `validatePeriod(state, start, end)` | reasons for missing dates, a start before today, or an end before the start; empty when valid | FR-008 |
| `search(state, type, start, end)` | `{ available: Machine[], unavailable: { machine, reasons }[] }`, across all agencies | FR-001, FR-002, FR-003 |
| `validateBooking(state, request)` | `{ ok: true }` or `{ ok: false, reasons }` | FR-004 to FR-009 |
| `book(state, request)` | `{ ok: true, state, reservation }` or `{ ok: false, reasons }` | FR-004, FR-010 |
| `reservationStatuses(state)` | per reservation: `{ reservation, status: 'kept' \| 'toRelocate', reasons }` | FR-012, FR-014 |
| `alternatives(state, reservationId)` | machines of the same type available on that reservation's dates | FR-015 |
| `relocate(state, reservationId, ref)` | `{ ok: true, state }` or `{ ok: false, reasons }` | FR-015 |
| `blockMachine(state, ref, until, reason)` | `{ ok: true, state }` or `{ ok: false, reasons }`; `until` and `reason` are required, `until` ≥ today | FR-011 |
| `unblockMachine(state, ref)` | `{ ok: true, state }` | FR-011 |

##### Reasons

Each reason is `{ code, message }`, where `message` is the French sentence shown to the user.

| code | Example message |
|------|-----------------|
| `overlap` | « Déjà réservée du 14/10/2026 au 18/10/2026 pour BTP Rhone (saisie par Lyon Est). » |
| `workshop` | « À l'atelier jusqu'au 20/10/2026 (verin casse). » |
| `vgp` | « VGP non à jour : échue le 05/09/2026. » |
| `past` | « La date de début ne peut pas être avant aujourd'hui (12/10/2026). » |
| `dateOrder` | « La date de fin doit être après la date de début ou le même jour. » |
| `missingField` | « Indiquez le client. » / « Indiquez l'agence qui saisit. » / « Indiquez les dates. » |
| `unknownMachine` | « Machine inconnue. » |
| `otherType` | « Cette machine n'est pas du même type (Nacelle 12 m). » |

### `specs/001-reservation-multi-agences/contracts/ui.md`

#### Contract: écrans de `web/index.html`

En-tête permanent : « Vallet Location — Réservations » et « Aujourd'hui : lundi 12 octobre 2026 ». Trois onglets. Textes en français, vouvoiement, boutons nommés par leur action.

##### Onglet « Rechercher et réserver » (US1, US2)

- Champs : **Type de machine** (liste des 7 types), **Du**, **Au** (dates, par défaut aujourd'hui).
- Bouton : « Rechercher ». Une période incomplète, qui commence avant aujourd'hui ou qui finit avant de commencer affiche « Refusé : » et le motif, sans résultat.
- Résultat « Disponibles » : référence, type, agence, et un bouton « Réserver » par machine.
- Réserver ouvre sous la machine : **Client**, **Agence qui saisit** (7 agences), bouton « Confirmer la réservation de NAC140 ». Les dates sont celles de la recherche.
- Succès : message « NAC140 réservée pour BTP Rhone du 16/10/2026 au 17/10/2026. », et les résultats sont recalculés.
- Refus : les messages de [rules-api.md](specs/001-reservation-multi-agences/contracts/rules-api.md) s'affichent au-dessus du bouton, et rien n'est enregistré.
- Résultat « Indisponibles » : référence, agence, et la ou les raisons.
- Aucun disponible : « Aucune machine de ce type n'est disponible du … au …. »

##### Onglet « Réservations » (US4)

- Bloc « À replacer » en tête, avec le nombre entre parenthèses. Pour chaque réservation : client, machine, dates, motif(s), puis un bouton « Transférer sur NAC140 » par alternative, ou « Aucune autre machine de ce type n'est disponible sur ces dates. ».
- Tableau de toutes les réservations triées par date de début : machine, type, agence de la machine, client, du, au, saisie par, statut (« OK » ou « À replacer »).

##### Onglet « Atelier » (US3)

- Tableau du parc : référence, type, agence, échéance VGP (nacelles, suivie de « (échue) » si elle est passée au 12/10/2026), état (« Disponible » ou « À l'atelier jusqu'au … »).
- Machine disponible : champs **Jusqu'au** et **Motif**, bouton « Immobiliser NAC112 ».
- Machine à l'atelier : bouton « Remettre en service MINI07 ».
- Après un blocage qui touche des réservations : « 1 réservation à replacer : voir l'onglet Réservations. »

##### Écran de connexion (US5)

- Plein écran, avant tout onglet. Champs **E-mail** et **Mot de passe**, bouton « Se connecter ».
- Bloc « Comptes de démonstration » : un bouton par compte (nom et rôle), qui remplit l'e-mail et le mot de passe ; mot de passe commun affiché.
- Échec : « E-mail ou mot de passe incorrect. ».

##### En-tête une fois connecté

- Nom de l'outil, date du jour, puis l'utilisateur : initiales en pastille, nom, « rôle · agence », bouton « Se déconnecter ».

##### Charte

- Couleurs XEFI (rouge `#E10600`, anthracite `#2B2D42`), Montserrat, icônes SVG intégrées dans les onglets. Aucune autre fonction ajoutée.

### `specs/001-reservation-multi-agences/quickstart.md`

#### Quickstart: Réservation multi-agences

##### Lancer le prototype

Double-cliquez sur `web/index.html`. Aucune installation ni aucun serveur n'est nécessaire. Les données sont conservées dans le navigateur ; pour rejouer la recette depuis les données de départ, utilisez « Réinitialiser la démonstration » dans l'onglet Pilotage.

##### Lancer les tests des règles

Depuis la racine du workspace, avec Docker démarré :

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W 2>/dev/null || pwd):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

Attendu : tous les tests passent, avec un test par scénario de la spec.

##### Recette manuelle (5 tests de la spec)

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

### `specs/001-reservation-multi-agences/tasks.md`

#### Tasks: Réservation multi-agences

**Input**: documents de conception dans `specs/001-reservation-multi-agences/`

**Prerequisites**: [plan.md](specs/001-reservation-multi-agences/plan.md), [spec.md](specs/001-reservation-multi-agences/spec.md), [research.md](specs/001-reservation-multi-agences/research.md), [data-model.md](specs/001-reservation-multi-agences/data-model.md), [contracts/](specs/001-reservation-multi-agences/contracts/), [quickstart.md](specs/001-reservation-multi-agences/quickstart.md)

**Tests**: demandés. Chaque scénario d'acceptation de la spec a un test `node:test`, écrit avant le code et vérifié en échec. Lancement depuis la racine du workspace :

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

**Organization**: une phase par user story. Les règles vont dans `web/src/rules.js` (fonctions pures, voir [contracts/rules-api.md](specs/001-reservation-multi-agences/contracts/rules-api.md)), l'affichage dans `web/src/app.js` (voir [contracts/ui.md](specs/001-reservation-multi-agences/contracts/ui.md)).

##### Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichier différent, aucune dépendance sur une tâche non terminée)
- **[Story]** : user story concernée (US1 à US4)

---

##### Phase 1: Setup

**Purpose**: squelette de `web/`

- [X] T001 Créer la branche `001-reservation-multi-agences` dans le dépôt workspace `vallet` à partir de `main` (remplace le hook `speckit.multirepo.branch`, voir plan.md « Affected Repos »)
- [X] T002 Créer `web/CLAUDE.md` : stack (HTML/CSS/JS statique, scripts classiques, aucune dépendance), lancement (double-clic sur `web/index.html`), tests (commande Docker ci-dessus), convention de commit (message à l'impératif, en anglais)
- [X] T003 [P] Créer `web/index.html` : en-tête « Vallet Location — Réservations » et « Aujourd'hui : lundi 12 octobre 2026 », trois onglets vides (« Rechercher et réserver », « Réservations », « Atelier »), chargement dans cet ordre de `src/data.js`, `src/rules.js`, `src/app.js` en scripts classiques (pas de `type="module"`)
- [X] T004 [P] Créer `web/styles.css` : mise en page lisible sur un écran de portable, onglets, tableaux, messages de succès et de refus visuellement distincts (pas seulement par la couleur : préfixe texte « Refusé : » / « Réservé : »)

---

##### Phase 2: Foundational

**Purpose**: données et briques de règles utilisées par toutes les stories

**⚠️ CRITICAL**: aucune story ne commence avant la fin de cette phase

- [X] T005 Créer `web/src/data.js` exposant `ValletData` (global navigateur et `module.exports` sous Node) avec `today: '2026-10-12'`, la liste des 7 agences dans l'ordre « Lyon Est, Villeurbanne, Grenoble, Saint-Étienne, Clermont-Ferrand, Annecy, Valence », les 12 machines et les 7 réservations **exactement** comme dans les tableaux « Données de départ » de [data-model.md](specs/001-reservation-multi-agences/data-model.md) (MINI07 : `workshop: { until: '2026-10-20', reason: 'verin casse' }` ; `lastVgp: null` pour les non-nacelles ; `id` 1 à 7 dans l'ordre donné)
- [X] T006 Créer `web/tests/helpers.js` : `freshState()` qui renvoie une copie profonde de `ValletData` sous la forme `{ today, machines, reservations }`, pour que chaque test parte des données de départ
- [X] T007 [P] Écrire `web/tests/foundation.test.js` (doit échouer) : `vgpExpiry('2026-04-15') === '2026-10-15'`, `vgpExpiry('2026-03-05') === '2026-09-05'`, `vgpExpiry('2026-08-31') === '2027-02-28'` ; `machineBlockers` renvoie `overlap` pour NAC112 du 17/10 au 20/10, rien pour NAC112 du 19/10 au 20/10 (dates incluses), `workshop` pour MINI07 du 19/10 au 22/10, rien pour MINI07 à partir du 21/10, `vgp` pour NAC118 au départ du 16/10, rien pour NAC118 au départ du 15/10 même jusqu'au 25/10, rien pour COMP21 (non-nacelle) quelle que soit la VGP
- [X] T008 Créer `web/src/rules.js` exposant `ValletRules` (global navigateur et `module.exports` sous Node) avec `vgpExpiry(lastVgp)` (6 mois calendaires, jour ramené au dernier jour du mois si besoin), `isNacelle(machine)` (type commençant par « Nacelle »), formatage `JJ/MM/AAAA`, et `machineBlockers(state, ref, start, end, ignoreId)` qui renvoie les raisons `{ code, message }` (`overlap`, `workshop`, `vgp`) avec les messages de [contracts/rules-api.md](specs/001-reservation-multi-agences/contracts/rules-api.md) ; le chevauchement ne compte que les réservations **gardées** et ignore `ignoreId` ; dates comparées en chaînes ISO, jamais via `new Date()` sur l'horloge. T007 doit passer.

**Checkpoint**: `foundation.test.js` passe.

---

##### Phase 3: User Story 1 — Chercher une machine dans les 7 agences (Priority: P1) 🎯 MVP

**Goal**: chercher un type sur une période et voir les machines disponibles et indisponibles (avec raison) des 7 agences.

**Independent Test**: chercher « Nacelle 12 m » du 16/10 au 17/10 sans rien réserver.

###### Tests for User Story 1

- [X] T009 [P] [US1] Écrire `web/tests/search.test.js` (doit échouer) : (1) « Nacelle 12 m » du 16/10 au 17/10 → disponible NAC140 (agence Grenoble) ; indisponibles NAC112 (`overlap`, BTP Rhone) et NAC118 (`vgp`) ; (2) « Mini-pelle 1.8 t » du 15/10 au 16/10 → MINI12 disponible, MINI07 indisponible avec `workshop` et message contenant « 20/10/2026 » ; (3) « Nacelle 16 m » du 13/10 au 14/10 → aucune disponible, NAC089 indisponible avec `vgp` ; (4) une recherche couvre les machines de toutes les agences (« Compacteur » du 13/10 au 13/10 → COMP21 Lyon Est et COMP30 Annecy disponibles)

###### Implementation for User Story 1

- [X] T010 [US1] Ajouter `search(state, type, start, end)` dans `web/src/rules.js` → `{ available, unavailable: [{ machine, reasons }] }`, toutes agences, type exact (« Nacelle 12 m » ne renvoie pas de 16 m). T009 doit passer.
- [X] T011 [US1] Dans `web/src/app.js`, créer l'état en mémoire à partir de `ValletData` et brancher l'onglet « Rechercher et réserver » : champs **Type de machine** (7 types), **Du**, **Au** (par défaut 12/10/2026), bouton « Rechercher » ; listes « Disponibles » (référence, type, agence) et « Indisponibles » (référence, agence, raisons) ; message « Aucune machine de ce type n'est disponible du … au …. » quand la liste est vide ; dates affichées `JJ/MM/AAAA`

**Checkpoint**: la recherche fonctionne seule dans le navigateur ; `search.test.js` passe.

---

##### Phase 4: User Story 2 — Réserver une machine sans erreur (Priority: P1)

**Goal**: réserver une machine proposée ; toute règle violée bloque l'enregistrement avec un message explicite.

**Independent Test**: réserver COMP30, puis retenter COMP30 sur des dates qui se chevauchent.

###### Tests for User Story 2

- [X] T012 [P] [US2] Écrire `web/tests/booking.test.js` (doit échouer) : (1) COMP30, client « BTP Rhône », du 13/10 au 15/10, saisie Valence → `ok`, la réservation porte `id` 8, `enteredBy: 'Valence'`, et `search` « Compacteur » du 14/10 au 14/10 ne propose plus COMP30 ; (2) NAC112 du 17/10 au 20/10 → refus `overlap` dont le message cite BTP Rhone, 14/10/2026, 18/10/2026 et Lyon Est ; (3) MINI07 du 19/10 au 22/10 → refus `workshop` ; (4) NAC089 du 13/10 au 14/10 → refus `vgp` ; (5) début le 10/10 → refus `past` ; fin le 13/10 pour un début le 15/10 → refus `dateOrder` ; (6) client vide ou agence vide → refus `missingField` ; (7) une réservation d'un seul jour (début = fin = 12/10) sur COMP30 → `ok` ; (8) après un `book` réussi, l'état d'origine passé en argument n'est pas modifié

###### Implementation for User Story 2

- [X] T013 [US2] Ajouter `validateBooking(state, request)` et `book(state, request)` dans `web/src/rules.js` : `request = { ref, client, start, end, enteredBy }` ; client **obligatoire, non vide** ; agence **obligatoire** ; `start` **≥ date du jour** ; `end` **≥ start** ; puis `machineBlockers` ; `book` renvoie un nouvel état avec la réservation ajoutée (`id` = plus grand id + 1), sans muter l'argument. T012 doit passer.
- [X] T014 [US2] Dans `web/src/app.js`, bouton « Réserver » sur chaque machine disponible : formulaire sous la machine avec **Client**, **Agence qui saisit** (7 agences), bouton « Confirmer la réservation de {ref} » ; la règle est revérifiée à la confirmation (pas seulement à la recherche) ; succès → « Réservé : {ref} pour {client} du … au …. » puis relance de la recherche ; refus → « Refusé : » suivi de chaque message, rien n'est enregistré

**Checkpoint**: US1 + US2 forment le MVP de la démo ; `booking.test.js` passe.

---

##### Phase 5: User Story 3 — L'atelier bloque une machine (Priority: P2)

**Goal**: l'atelier immobilise une machine jusqu'à une date ou la remet en service.

**Independent Test**: immobiliser ECH41 jusqu'au 16/10 et constater qu'elle n'est plus proposée du 14/10 au 15/10.

###### Tests for User Story 3

- [X] T015 [P] [US3] Écrire `web/tests/workshop.test.js` (doit échouer) : (1) `blockMachine` ECH41 jusqu'au 16/10, motif « bâche déchirée » → `search` « Echafaudage 40 m2 » du 14/10 au 15/10 ne la propose pas, et elle est de nouveau proposée à partir du 17/10 ; (2) `unblockMachine` MINI07 → MINI07 proposée du 15/10 au 16/10 ; (3) `blockMachine` MINI12 jusqu'au 14/10 → la réservation #7 (Artisan Ferreira) passe « à replacer » dans `reservationStatuses` avec le motif `workshop` ; (4) `blockMachine` avec une date avant aujourd'hui ou sans date → refus

###### Implementation for User Story 3

- [X] T016 [US3] Ajouter `blockMachine(state, ref, until, reason)`, `unblockMachine(state, ref)` et `reservationStatuses(state)` dans `web/src/rules.js` : statut **calculé, jamais stocké**, réservations parcourues par `id` croissant, une réservation est `toRelocate` si elle chevauche une réservation déjà gardée de la même machine, si la nacelle n'a pas de VGP valide le jour du départ, ou si la machine est à l'atelier sur une partie de la période ; sinon `kept`. T015 doit passer.
- [X] T017 [US3] Dans `web/src/app.js`, onglet « Atelier » : tableau du parc (référence, type, agence, échéance VGP pour les nacelles, état « Disponible » ou « À l'atelier jusqu'au … ») ; pour une machine disponible, champs **Jusqu'au** et **Motif** et bouton « Immobiliser {ref} » ; pour une machine à l'atelier, bouton « Remettre en service {ref} » ; si le blocage touche des réservations : « {n} réservation(s) à replacer : voir l'onglet Réservations. »

**Checkpoint**: `workshop.test.js` passe ; l'onglet Atelier fonctionne sans toucher aux autres.

---

##### Phase 6: User Story 4 — Voir et replacer les conflits hérités (Priority: P3)

**Goal**: les réservations en conflit sont marquées « à replacer » et peuvent être transférées sur une machine du même type.

**Independent Test**: ouvrir l'onglet Réservations avec les données de départ.

###### Tests for User Story 4

- [X] T018 [P] [US4] Écrire `web/tests/relocation.test.js` (doit échouer) : (1) avec les données de départ, `reservationStatuses` marque exactement #2 (Maconnerie Duclos, motif `overlap` avec #1) et #3 (Facades Martin, motif `vgp`, message contenant « 05/09/2026 ») comme `toRelocate`, et les 5 autres `kept` ; (2) `alternatives(state, 2)` → `[NAC140]` ; (3) `alternatives(state, 3)` → `[]` ; (4) `relocate(state, 2, 'NAC140')` → `ok`, la réservation #2 garde client, dates et `enteredBy`, porte la ref NAC140 et devient `kept` ; (5) `relocate(state, 2, 'NAC118')` → refus `vgp` ; (6) `relocate` vers une machine d'un autre type → refus

###### Implementation for User Story 4

- [X] T019 [US4] Ajouter `alternatives(state, reservationId)` et `relocate(state, reservationId, ref)` dans `web/src/rules.js` : mêmes dates, même type, `machineBlockers` en ignorant la réservation elle-même ; sans muter l'argument. T018 doit passer.
- [X] T020 [US4] Dans `web/src/app.js`, onglet « Réservations » : bloc « À replacer ({n}) » en tête avec client, machine, dates, motif(s) et un bouton « Transférer sur {ref} » par alternative, ou « Aucune autre machine de ce type n'est disponible sur ces dates. » ; puis tableau de toutes les réservations trié par date de début (machine, type, agence de la machine, client, du, au, saisie par, statut « OK » / « À replacer »)

**Checkpoint**: les 4 stories fonctionnent ; tous les fichiers de `web/tests/` passent.

---

##### Phase 7: Polish

- [X] T021 Rafraîchir les trois onglets après chaque action (réservation, blocage, remise en service, transfert) dans `web/src/app.js`, pour que les « à replacer » et les disponibilités soient toujours à jour
- [X] T022 Lancer toute la suite `web/tests/` via Docker et corriger jusqu'à 0 échec
- [X] T023 Dérouler à la main les 5 tests et les contrôles supplémentaires de [quickstart.md](specs/001-reservation-multi-agences/quickstart.md) en ouvrant `web/index.html` dans un navigateur, et noter le résultat de chacun
- [X] T024 Vérifier qu'aucun élément non prévu par la spec n'a été ajouté à l'interface (barème : −1 par ajout non demandé), puis commiter et pousser la branche `001-reservation-multi-agences`

---

##### Dependencies & Execution Order

###### Phase Dependencies

- **Setup (1)** : aucune dépendance.
- **Foundational (2)** : après la phase 1 ; bloque toutes les stories.
- **US1 (3)** : après la phase 2.
- **US2 (4)** : après US1, puisque le formulaire de réservation s'affiche dans les résultats de recherche (T014 dépend de T011). La règle `book` (T013) ne dépend que de la phase 2.
- **US3 (5)** : après la phase 2 pour les règles ; l'onglet Atelier est indépendant de US1 et US2.
- **US4 (6)** : après US3, car `reservationStatuses` (T016) est défini en US3.
- **Polish (7)** : après toutes les stories.

###### Within Each User Story

Test écrit et vu en échec → règle dans `rules.js` → test au vert → interface dans `app.js`.

###### Parallel Opportunities

- T003 et T004 en parallèle (fichiers différents).
- Les fichiers de test T009, T012, T015 et T018 peuvent être écrits en parallèle dès la fin de la phase 2.
- Les tâches de `rules.js` (T010, T013, T016, T019) touchent le même fichier : séquentielles. Même chose pour `app.js` (T011, T014, T017, T020, T021).

##### Parallel Example: après la phase 2

```text
T009 [US1] web/tests/search.test.js
T012 [US2] web/tests/booking.test.js
T015 [US3] web/tests/workshop.test.js
T018 [US4] web/tests/relocation.test.js
```

##### Implementation Strategy

###### MVP d'abord (pour 10 h 15)

1. Phases 1 et 2.
2. US1 (chercher) puis US2 (réserver) : c'est exactement la demande du client, « chercher une machine dans les 7 agences et la réserver sans erreur ».
3. **Stop et validation** : `search.test.js` et `booking.test.js` au vert, tests 1 à 4 du quickstart joués à la main.

###### Ensuite

4. US3 (atelier), pour Mehdi, qui viendra tester.
5. US4 (à replacer), pour le test 5 du quickstart.
6. Polish et commit.

Si le temps manque, livrer US1 + US2 qui marchent plutôt que les quatre stories à moitié (consignes : « Un outil simple qui marche vaut mieux qu'un outil complet qui plante »).

---

##### Phase 8: Convergence

- [X] T025 Restore `enteredBy: 'Saint-Etienne'` on reservation 7 in `web/src/data.js`, as in the Excel extract and data-model.md, per FR-013 (contradicts)

---

##### Phase 9: Correctifs après relecture

- [X] T026 Dans `web/src/rules.js`, faire compter à `machineBlockers` **toutes** les autres réservations de la machine (gardées ou à replacer) pour le chevauchement, conformément à FR-005 et à data-model.md corrigé ; mettre à jour dans `web/tests/` les cas où deux réservations chevauchent (NAC112 : #1 et #2) ; le test « a reservation to relocate still holds its machine on its dates » doit passer
- [X] T027 Refaire le style de `web/styles.css` (en-tête, onglets, cartes, tableaux, statuts « OK » / « À replacer » en pastilles avec texte, focus visible, espacements sur l'échelle 4/8/16/24/32 px) et ajouter dans `web/src/app.js` les seules classes nécessaires, sans ajouter d'élément ni de fonction à l'interface

---

##### Phase 10: User Story 5 — Connexion fictive, et charte XEFI (Priority: P2)

**Goal**: se connecter avec un compte de démonstration, voir son nom, avoir son agence pré-remplie ; interface aux couleurs XEFI.

**Independent Test**: connexion de Sandrine Morin, nom en en-tête, « Lyon Est » pré-rempli, déconnexion.

- [X] T028 [P] [US5] Écrire `web/tests/auth.test.js` (doit échouer) : compte valide → `ok` avec nom, rôle, agence ; e-mail en majuscules avec espaces → `ok` ; mot de passe faux et e-mail inconnu → même message « E-mail ou mot de passe incorrect. » ; champs vides → refus ; `findUser` par e-mail
- [X] T029 [US5] Ajouter les 4 comptes de data-model.md dans `web/src/data.js` (`ValletData.users`) et créer `web/src/auth.js` (`ValletAuth.authenticate`, `ValletAuth.findUser`, global navigateur et `module.exports`) ; T028 doit passer
- [X] T030 [US5] Dans `web/index.html` et `web/src/app.js` : écran de connexion (FR-016 à FR-018), en-tête utilisateur et déconnexion (FR-019), pré-remplissage de l'agence (FR-020), session en `sessionStorage` protégée par `try/catch` (FR-021) ; charger `src/auth.js` avant `src/app.js`
- [X] T031 Appliquer la charte XEFI dans `web/styles.css` et `web/index.html` (couleurs, Montserrat avec repli système, icônes SVG des onglets), sans aucune autre fonction
- [X] T032 Lancer toute la suite `web/tests/` et rejouer dans le navigateur les 5 tests du quickstart plus les scénarios US5, avant de commiter

### `specs/001-reservation-multi-agences/checklists/requirements.md`

#### Specification Quality Checklist: Réservation multi-agences

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-09
**Feature**: [spec.md](specs/001-reservation-multi-agences/spec.md)

##### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

##### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

##### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

##### Notes

- All 3 clarifications answered on 2026-10-09 (VGP: 6 months, valid on departure day; return day: next day; inherited double bookings: first entry keeps the machine, the other is "à replacer"). Ready for `/speckit-plan`.

## Feature 002-exploitation-parc

### `specs/002-exploitation-parc/spec.md`

#### Feature Specification: Exploitation du parc

**Feature Branch**: `001-reservation-multi-agences` (poursuite sur la même branche, même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Pouvoir modifier les VGP et alerter quand une nacelle arrive à échéance, le système d'état des lieux, les cautions, tout ce que contient le dossier (Word), sans régression."

##### Contexte

La feature 001 permet de chercher et de réserver une machine sans erreur. Cette feature 002 couvre le reste du dossier Vallet Location :

| Besoin | Source |
|--------|--------|
| Une vingtaine de nacelles ont leur VGP en retard, suivi sur papier | Doc 5 (Mehdi) |
| 85 000 € de réparations non refacturées faute de photo au départ | Doc 4 (DAF), Doc 2 (« on prend des photos quand on a le temps ») |
| Cautions des particuliers encaissées en retard | Doc 4 |
| Tout nouvel outil doit alimenter le logiciel de facturation (renouvelé pour 3 ans) | Doc 4, entretien Q8 |
| Les conducteurs de travaux veulent recevoir les attestations VGP sans les réclamer | Doc 6 |
| Réservation en ligne pour les particuliers, le soir ou le week-end | Doc 1 |
| Vendre les machines d'occasion par le même canal | Doc 1 |

**Arbitrages de l'équipe projet (09/10/2026)** : tout le dossier est inclus, y compris la réservation en ligne des particuliers et la vente d'occasion, que le mail au client reportait. Alerte VGP 30 jours avant l'échéance. Caution pour les clients particuliers seulement. Au moins une photo obligatoire au départ.

**Règle héritée de 001, inchangée** : aucune double réservation, VGP valide le jour du départ, pas de machine à l'atelier.

##### Clarifications

###### Session 2026-10-09

- Q : Quel périmètre ? → R : tout le dossier, y compris réservation en ligne des particuliers et vente d'occasion.
- Q : Délai d'alerte VGP ? → R : 30 jours avant l'échéance.
- Q : À qui s'applique la caution ? → R : aux clients particuliers seulement ; le montant est saisi par l'agence au départ.
- Q : Départ sans photo ? → R : interdit ; au moins une photo.

##### User Scenarios & Testing *(mandatory)*

###### User Story 6 - Suivre et mettre à jour les VGP (Priority: P1)

En tant que responsable atelier, je veux voir les nacelles dont la VGP est échue ou arrive à échéance dans les 30 jours, et enregistrer une nouvelle VGP, afin de ne plus suivre les VGP sur papier et de ne jamais faire sortir une nacelle hors règle.

**Why this priority**: obligation légale et responsabilité personnelle de Mehdi (Doc 5) ; une VGP enregistrée débloque immédiatement les réservations concernées.

**Independent Test**: au 12/10/2026, NAC089 est « échue », NAC118 est « à renouveler » (échéance 15/10) ; enregistrer une VGP du 12/10/2026 sur NAC089 la rend réservable.

**Acceptance Scenarios**:

1. **Given** les données de départ au 12/10/2026, **When** j'ouvre l'onglet Atelier, **Then** une alerte liste NAC089 « VGP échue depuis le 05/09/2026 » et NAC118 « VGP à renouveler avant le 15/10/2026 (3 jours) », et aucune autre nacelle.
2. **Given** NAC089 a une VGP échue, **When** l'atelier enregistre une VGP réalisée le 12/10/2026, **Then** son échéance devient le 12/04/2027, elle sort des alertes, devient réservable, et la réservation de Façades Martin n'est plus « à replacer ».
3. **Given** NAC112, **When** l'atelier saisit une date de VGP dans le futur, antérieure à la VGP déjà enregistrée, ou vide, **Then** l'enregistrement est refusé avec un message qui dit quoi corriger.
4. **Given** une machine qui n'est pas une nacelle, **When** on tente d'enregistrer une VGP, **Then** c'est refusé (la VGP ne concerne que les nacelles dans ce parc).
5. **Given** au moins une nacelle en alerte, **When** l'utilisateur est sur n'importe quel onglet, **Then** l'onglet Atelier affiche le nombre d'alertes.

---

###### User Story 7 - État des lieux au départ et au retour, avec photos (Priority: P1)

En tant que personnel d'agence, je veux enregistrer le départ puis le retour d'une machine avec des photos, des remarques et les dégâts constatés, afin de pouvoir refacturer les dégâts au client avec une preuve.

**Why this priority**: 85 000 € de pertes par an faute de preuve (Doc 4).

**Independent Test**: enregistrer le départ de COMP21 (M. Pereira) avec une photo et une caution, puis son retour avec un dégât de 120 €.

**Acceptance Scenarios**:

1. **Given** la réservation COMP21 de M. Pereira (particulier) du 12/10 au 12/10, **When** j'enregistre le départ sans photo, **Then** c'est refusé : « Ajoutez au moins une photo de la machine au départ. »
2. **Given** la même réservation, **When** j'enregistre le départ le 12/10 avec une photo, une caution de 500 € par empreinte bancaire, **Then** la réservation passe à « Sortie » avec la date, les photos, les remarques et la caution.
3. **Given** une réservation « Sortie », **When** j'enregistre le retour avec au moins une photo et un dégât « Rayure capot » de 120 €, **Then** elle passe à « Rendue », les photos du départ et du retour sont visibles côte à côte, et 120 € sont « à refacturer ».
4. **Given** une réservation « à replacer », qui commence après la date de départ saisie, ou déjà sortie, **When** j'enregistre un départ, **Then** c'est refusé avec la raison.
5. **Given** une réservation « Sortie », **When** le retour est daté avant le départ, sans photo, ou avec un dégât sans description ou de montant négatif, **Then** c'est refusé.
6. **Given** ECH40 est « Sortie » depuis le 06/10 (reprise du planning Excel, sans photo), **When** j'ouvre sa fiche, **Then** elle est marquée « Sortie sans photo (reprise Excel) ».
7. **Given** une machine rendue le 13/10 alors que la location courait jusqu'au 15/10, **When** on cherche cette machine pour le 14/10, **Then** elle est de nouveau disponible (le retour anticipé libère la machine dès le lendemain).

---

###### User Story 8 - Cautions des particuliers réglées au retour (Priority: P1)

En tant que DAF, je veux que la caution d'un particulier soit prise au départ et réglée automatiquement au retour, afin qu'aucune caution ne soit plus encaissée en retard.

**Why this priority**: trésorerie (Doc 4) ; empreinte bancaire validée en entretien (Q4).

**Independent Test**: caution de 500 €, dégâts de 120 € → 120 € retenus, 380 € restitués, 0 € à facturer en plus.

**Acceptance Scenarios**:

1. **Given** une réservation d'un client particulier, **When** j'enregistre le départ sans caution ou avec un montant nul, **Then** c'est refusé : « Enregistrez la caution du client particulier. »
2. **Given** une réservation d'un client professionnel, **When** j'enregistre le départ, **Then** aucune caution n'est demandée.
3. **Given** une caution de 500 € et 120 € de dégâts au retour, **When** le retour est enregistré, **Then** 120 € sont retenus sur la caution, 380 € restitués, et 0 € reste à facturer.
4. **Given** une caution de 500 € et 800 € de dégâts, **When** le retour est enregistré, **Then** 500 € sont retenus, 0 € restitué et 300 € restent à facturer.
5. **Given** aucune donnée de carte bancaire n'est jamais saisie, **When** l'agence choisit « Empreinte bancaire », **Then** l'outil enregistre seulement le mode et le montant (simulation : aucune donnée de paiement n'est collectée).

---

###### User Story 9 - Attestation VGP pour le client (Priority: P2)

En tant que commerciale grands comptes, je veux imprimer l'attestation VGP d'une nacelle louée, afin que le conducteur de travaux la reçoive sans la réclamer.

**Why this priority**: demande récurrente des conducteurs de travaux (Doc 6).

**Independent Test**: ouvrir l'attestation de la réservation NAC112 de BTP Rhone.

**Acceptance Scenarios**:

1. **Given** une réservation d'une nacelle avec une VGP valide, **When** je demande l'attestation, **Then** une page imprimable affiche : client, machine, agence, période de location, date de la dernière VGP, échéance, et la mention « VGP valide pendant toute la période » ou « VGP à renouveler le … ».
2. **Given** une réservation d'une machine qui n'est pas une nacelle, **When** j'ouvre sa fiche, **Then** aucune attestation VGP n'est proposée.

---

###### User Story 10 - Export pour le logiciel de facturation (Priority: P2)

En tant que DAF, je veux exporter les locations rendues dans un fichier lisible par le logiciel de facturation, afin que le nouvel outil l'alimente sans ressaisie.

**Why this priority**: exigence du DAF (Doc 4) ; facturation actuelle conservée (entretien Q8).

**Independent Test**: après un retour, exporter et vérifier la ligne.

**Acceptance Scenarios**:

1. **Given** au moins une location rendue, **When** j'exporte, **Then** un fichier CSV (séparateur « ; », UTF-8) est téléchargé avec une ligne par location rendue : référence de réservation, client, type de client, machine, agence, date de départ, date de retour, nombre de jours, dégâts à refacturer, caution retenue, reste à facturer.
2. **Given** aucune location rendue, **When** j'exporte, **Then** le message « Aucune location rendue à exporter. » s'affiche et aucun fichier n'est produit.

---

###### User Story 11 - Réservation en ligne pour les particuliers (Priority: P3)

En tant que particulier, je veux réserver une machine en ligne, le soir ou le week-end, sans compte, afin de ne pas devoir appeler une agence.

**Why this priority**: demande du DG (Doc 1), mais 10 % du chiffre d'affaires (Doc 6) ; la condition de Sandrine (Doc 2 : « pas pour réserver des machines qu'on n'a pas ») est respectée parce que la recherche en ligne applique exactement les mêmes règles que les agences.

**Independent Test**: depuis l'écran de connexion, ouvrir « Réserver en ligne », réserver COMP30 le 13/10, puis la voir côté agence.

**Acceptance Scenarios**:

1. **Given** l'écran de connexion, **When** je clique sur « Particuliers : réserver en ligne », **Then** un espace public s'ouvre sans connexion.
2. **Given** l'espace public, **When** je cherche un type et des dates, **Then** seules les machines réellement disponibles sont proposées, avec leur agence de retrait, jamais les indisponibles.
3. **Given** une machine proposée, **When** je réserve avec mon nom et un téléphone ou un e-mail, **Then** la réservation est créée comme client particulier, saisie par « Réservation en ligne », et le message rappelle qu'une caution sera demandée au retrait.
4. **Given** la même machine réservée en ligne, **When** une agence la cherche sur ces dates, **Then** elle est indisponible (aucune double réservation).
5. **Given** un nom vide ou ni téléphone ni e-mail, **When** je réserve en ligne, **Then** c'est refusé.

---

###### User Story 12 - Vente de machines d'occasion (Priority: P3)

En tant que direction, je veux mettre une machine en vente avec un prix, recevoir les demandes des acheteurs et la marquer vendue, afin de vendre l'occasion par le même canal.

**Why this priority**: idée du DG (Doc 1), jugée secondaire en entretien (Q5).

**Independent Test**: mettre ECH41 en vente à 2 500 €, la voir dans le catalogue public, envoyer une demande, la marquer vendue.

**Acceptance Scenarios**:

1. **Given** ECH41, **When** la direction la met en vente à 2 500 €, **Then** elle apparaît dans le catalogue public « Occasion » avec type, agence et prix, et reste louable tant qu'elle n'est pas vendue.
2. **Given** une machine en vente, **When** un visiteur envoie une demande avec son nom et un téléphone ou un e-mail, **Then** la demande apparaît dans l'onglet Ventes.
3. **Given** une machine en vente sans réservation en cours ni à venir, **When** la direction la marque vendue, **Then** elle disparaît du catalogue, des recherches et des réservations possibles.
4. **Given** une machine avec une réservation non rendue, **When** on la marque vendue, **Then** c'est refusé : « Cette machine a encore une réservation en cours ou à venir. »
5. **Given** un prix vide, nul ou négatif, **When** on met en vente, **Then** c'est refusé.

---

###### Edge Cases

- Une réservation « Rendue » ne compte plus pour le chevauchement après sa date de retour.
- Une réservation « Sortie » ou « Rendue » n'est jamais « à replacer » : le statut « à replacer » ne concerne que les réservations pas encore parties.
- Enregistrer une VGP ne peut pas créer de double réservation : les règles de 001 restent appliquées.
- Une machine vendue n'apparaît plus dans aucune recherche, ni agence ni en ligne, mais ses réservations passées restent visibles.
- Les photos restent dans le navigateur. Depuis la feature 005, elles sont réduites et conservées avec les autres données ; « Réinitialiser la démonstration » les efface.

##### Requirements *(mandatory)*

###### Functional Requirements

**VGP (US6)**

- **FR-022**: L'outil DOIT classer chaque nacelle : « valide », « à renouveler » (échéance dans 30 jours ou moins), « échue » (échéance passée).
- **FR-023**: L'outil DOIT afficher les alertes « à renouveler » et « échue » dans l'onglet Atelier, avec le nombre d'alertes sur l'onglet.
- **FR-024**: L'atelier DOIT pouvoir enregistrer une nouvelle VGP sur une nacelle ; la date est obligatoire, au plus tard aujourd'hui, et pas antérieure à la VGP déjà enregistrée.

**État des lieux (US7)**

- **FR-025**: Une réservation suit les étapes Réservée → Sortie → Rendue.
- **FR-026**: Le départ DOIT exiger au moins une photo, une date comprise dans la période de location, une réservation non « à replacer » et, pour une nacelle, une VGP valide à cette date.
- **FR-027**: Le retour DOIT exiger au moins une photo et une date au moins égale à la date de départ ; chaque dégât a une description et un montant positif ou nul.
- **FR-028**: La fiche d'une réservation DOIT montrer les photos du départ et du retour côte à côte, les remarques et les dégâts.
- **FR-029**: Un retour anticipé DOIT libérer la machine dès le lendemain du retour.

**Cautions (US8)**

- **FR-030**: Une réservation DOIT indiquer si le client est particulier ou professionnel ; M. Pereira est particulier dans les données de départ.
- **FR-031**: Le départ d'un particulier DOIT exiger une caution (montant positif, mode : empreinte bancaire, chèque ou espèces). Aucune donnée de paiement n'est saisie.
- **FR-032**: Au retour, l'outil DOIT régler la caution automatiquement : retenue = min(dégâts, caution), restitution = caution − retenue, reste à facturer = dégâts − retenue.

**Attestation VGP (US9)**

- **FR-033**: L'outil DOIT produire une attestation VGP imprimable pour toute réservation de nacelle.

**Facturation (US10)**

- **FR-034**: L'outil DOIT exporter les locations rendues en CSV (« ; », UTF-8, en-têtes en français) avec les colonnes de US10.

**Réservation en ligne (US11)**

- **FR-035**: L'outil DOIT offrir un espace public sans connexion, qui ne propose que les machines disponibles et applique les règles de 001.
- **FR-036**: Une réservation en ligne DOIT avoir un nom et un téléphone ou un e-mail ; elle est créée comme particulier, saisie par « Réservation en ligne ».

**Occasion (US12)**

- **FR-037**: La direction DOIT pouvoir mettre une machine en vente avec un prix positif, la retirer de la vente, et la marquer vendue si elle n'a aucune réservation non rendue.
- **FR-038**: Le catalogue public DOIT lister les machines en vente ; une demande d'achat exige un nom et un téléphone ou un e-mail, et apparaît dans l'onglet Ventes.
- **FR-039**: Une machine vendue NE DOIT plus être proposée ni réservable.

###### Key Entities

- **Réservation** (complétée) : type de client (particulier / professionnel), étape (réservée, sortie, rendue), état des lieux de départ (date, photos, remarques, caution), état des lieux de retour (date, photos, remarques, dégâts, règlement de la caution).
- **Dégât** : description, montant.
- **Caution** : montant, mode (empreinte bancaire, chèque, espèces).
- **Annonce d'occasion** : machine, prix, statut (en vente, vendue).
- **Demande d'achat** : machine, nom, contact, date.

##### Success Criteria *(mandatory)*

###### Measurable Outcomes

- **SC-006**: 100 % des sorties enregistrées ont au moins une photo (contre « quand on a le temps », Doc 2).
- **SC-007**: 100 % des cautions de particuliers sont réglées le jour du retour (contre « souvent encaissées en retard », Doc 4).
- **SC-008**: Toute nacelle dont la VGP échoit dans les 30 jours est visible dans l'onglet Atelier, sans tableau papier (Doc 5).
- **SC-009**: Aucune réservation, en agence ou en ligne, ne crée de double réservation ni ne porte sur une machine vendue.

##### Assumptions

- **Tarifs** : le dossier ne donne aucun tarif de location ; l'export liste les jours et les dégâts, la tarification reste dans le logiciel de facturation.
- **Caution** : pas de montant par type de machine dans le dossier ; le montant est saisi par l'agence.
- **Paiement** : l'empreinte bancaire est simulée ; aucune donnée de carte n'est saisie ni stockée.
- **Rôles** : tous les comptes de démonstration accèdent à tous les onglets ; la séparation des droits viendra avec une vraie authentification.
- **Photos** : prises avec l'appareil photo ou choisies sur le poste ; gardées en mémoire le temps de la session.
- **Date de départ** : comme la date du jour est figée au 12/10/2026, la date de départ et de retour est saisie, dans les limites des règles ci-dessus.

### `specs/002-exploitation-parc/plan.md`

#### Implementation Plan: Exploitation du parc

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](specs/002-exploitation-parc/spec.md)

**Input**: Feature specification from `specs/002-exploitation-parc/spec.md`

##### Summary

Compléter le prototype de 001 avec la gestion des VGP et leurs alertes, l'état des lieux avec photos, les cautions réglées au retour, l'attestation VGP, l'export facturation, la réservation en ligne des particuliers et la vente d'occasion. Même architecture : règles pures et testées, interface mince. Les règles de 001 restent la seule source de vérité de la disponibilité : la réservation en ligne, les VGP et la vente passent toutes par elles.

##### Technical Context

**Language/Version**: HTML5, CSS3, JavaScript ES2020, scripts classiques (ouverture en `file://`)

**Primary Dependencies**: aucune

**Storage**: en mémoire ; photos gardées comme URL d'objet du navigateur (`URL.createObjectURL`) le temps de la session

**Testing**: `node:test` dans Docker (`node:22-alpine`) ; recette navigateur rejouée par script après chaque phase

**Target Platform**: navigateur récent, sans serveur

**Project Type**: application web statique

**Constraints**: zéro régression sur les 41 tests de 001 ; aucune donnée de paiement saisie ; fichiers de moins de 350 lignes

**Scale/Scope**: 12 machines, 4 comptes, 6 onglets internes (Rechercher, Réservations, Atelier, Ventes) + 2 écrans publics (Louer, Occasion)

##### Constitution Check

Constitution non remplie (modèle vide) : aucune gate. Inchangé après la phase 1.

##### Affected Repos

Aucun dépôt enfant (voir plan 001) : code dans `web/` du dépôt workspace, branche `001-reservation-multi-agences`.

##### Project Structure

###### Documentation

```text
specs/002-exploitation-parc/
├── spec.md
├── plan.md
├── data-model.md
├── contracts/
│   ├── rules-api.md
│   └── ui.md
├── quickstart.md
├── checklists/requirements.md
└── tasks.md
```

###### Source Code

```text
web/
├── index.html               # charge les scripts dans l'ordre ci-dessous
├── styles.css
├── styles-operations.css    # styles des écrans de 002
├── src/
│   ├── data.js              # + type de client, étape, ventes, demandes
│   ├── rules.js             # disponibilité (001) + retour anticipé, vente, réservation en ligne
│   ├── fleet.js             # VGP (statut, alertes, saisie) et vente d'occasion — pur
│   ├── operations.js        # départ, retour, caution, attestation, export CSV — pur
│   ├── auth.js
│   ├── ui/
│   │   ├── dom.js           # fabrique d'éléments partagée
│   │   ├── login.js
│   │   ├── search.js
│   │   ├── reservations.js  # liste, à replacer, export
│   │   ├── reservation-detail.js # fiche, départ, retour, photos, caution
│   │   ├── workshop.js      # parc, immobilisations, VGP et alertes
│   │   ├── sales.js         # onglet Ventes
│   │   ├── certificate.js   # attestation VGP imprimable
│   │   └── public.js        # espace public : louer, occasion
│   └── app.js               # état, session, navigation, rendu
└── tests/
    ├── (tests de 001, inchangés sauf ajouts)
    ├── fleet.test.js        # US6, US12
    ├── operations.test.js   # US7, US8, US9, US10
    ├── online.test.js       # US11
    └── availability.test.js # retour anticipé, étapes, machine vendue
```

**Structure Decision**: `app.js` (546 lignes) est découpé en vues sous `web/src/ui/`, chacune recevant un contexte commun (état, utilisateur, rendu). Les nouvelles règles vont dans deux modules purs, `fleet.js` et `operations.js`, testés sans navigateur ; `rules.js` ne gagne que ce qui touche la disponibilité.

##### Complexity Tracking

| Écart | Pourquoi | Alternative plus simple rejetée parce que |
|-------|----------|-------------------------------------------|
| Réservation en ligne et vente d'occasion incluses | Arbitrage de l'équipe projet (« vraiment tout ») | Les reporter, comme le proposait le mail au client : refusé par l'équipe |
| Découpage de `app.js` | Le fichier dépasserait 1 000 lignes | Un seul fichier : illisible et risqué pour les corrections de l'étape 4 |

### `specs/002-exploitation-parc/data-model.md`

#### Data Model: Exploitation du parc

Complète le [data-model de 001](specs/001-reservation-multi-agences/data-model.md).

##### Machine (ajouts)

| Champ | Type | Règle |
|-------|------|-------|
| `sale` | `{ price, status: 'forSale' \| 'sold' }` ou `null` | prix entier positif en euros |

**Statut VGP** (nacelles, calculé) : `expired` si échéance < aujourd'hui ; `dueSoon` si échéance − aujourd'hui ≤ 30 jours ; sinon `valid`.

| Nacelle | Dernière VGP | Échéance | Statut au 12/10/2026 |
|---------|--------------|----------|----------------------|
| NAC112 | 10/07/2026 | 10/01/2027 | valide |
| NAC140 | 20/08/2026 | 20/02/2027 | valide |
| NAC118 | 15/04/2026 | 15/10/2026 | à renouveler (3 jours) |
| NAC089 | 05/03/2026 | 05/09/2026 | échue |
| NAC201 | 02/09/2026 | 02/03/2027 | valide |

Nouvelle VGP : date obligatoire, ≤ aujourd'hui, ≥ dernière VGP, nacelle uniquement.

##### Réservation (ajouts)

| Champ | Type | Règle |
|-------|------|-------|
| `customerType` | `'particulier'` \| `'professionnel'` | défaut `professionnel` ; #4 (M. Pereira) est `particulier` |
| `contact` | texte ou `null` | téléphone ou e-mail, réservations en ligne |
| `stage` | `'booked'` \| `'out'` \| `'returned'` | défaut `booked` ; #5 (ECH40) est `out` |
| `departure` | voir ci-dessous ou `null` | |
| `return` | voir ci-dessous ou `null` | |

```text
departure = { date, photos: [{ name, url }], notes, deposit: { amount, method } | null, imported: boolean }
return    = { date, photos: [{ name, url }], notes, damages: [{ description, amount }],
              settlement: { damagesTotal, retained, refunded, toInvoice } }
```

`method` ∈ `card-hold` (empreinte bancaire), `cheque`, `cash`. #5 (ECH40) : `departure = { date: '2026-10-06', photos: [], notes: 'Reprise du planning Excel', deposit: null, imported: true }`.

###### Étapes

```text
booked ──départ──▶ out ──retour──▶ returned
```

- Départ : étape `booked` ; pas « à replacer » ; `start ≤ date ≤ end` ; ≥ 1 photo ; VGP valide à cette date pour une nacelle ; caution (montant > 0, mode connu) si particulier.
- Retour : étape `out` ; `date ≥ departure.date` ; ≥ 1 photo ; chaque dégât a une description non vide et un montant ≥ 0.
- Règlement : `damagesTotal = Σ montants` ; `retained = min(damagesTotal, caution)` (0 sans caution) ; `refunded = caution − retained` ; `toInvoice = damagesTotal − retained`.

###### Effet sur la disponibilité (rules.js)

- Période occupée : `[start, end]` ; pour une réservation `returned`, `[start, return.date]`.
- « À replacer » ne s'applique qu'aux réservations `booked`.
- Machine vendue : absente des recherches, toute réservation refusée (code `sold`).

##### Demande d'achat

| Champ | Type | Règle |
|-------|------|-------|
| `id` | entier | croissant |
| `ref` | machine en vente | |
| `name` | texte | obligatoire |
| `contact` | texte | obligatoire (téléphone ou e-mail) |
| `date` | date ISO | date du jour |

Vente : prix entier > 0 ; « marquer vendue » refusé si une réservation de la machine n'est pas `returned`.

##### Export facturation (CSV)

Séparateur `;`, UTF-8 avec BOM, une ligne par réservation `returned` :

`Réservation;Client;Type de client;Machine;Agence;Départ;Retour;Jours;Dégâts à refacturer (€);Caution retenue (€);Reste à facturer (€)`

Jours = retour − départ + 1. Montants avec virgule décimale.

### `specs/002-exploitation-parc/contracts/rules-api.md`

#### Contract: modules purs de 002

Toutes les fonctions sont pures, ne lisent jamais l'horloge et renvoient `{ ok: true, state }` ou `{ ok: false, reasons: [{ code, message }] }` quand elles modifient l'état.

##### `web/src/fleet.js` — `ValletFleet`

| Fonction | Rôle | Exigences |
|----------|------|-----------|
| `vgpStatus(state, machine)` | `{ status: 'valid' \| 'dueSoon' \| 'expired', expiry, daysLeft }` ou `null` hors nacelle | FR-022 |
| `vgpAlerts(state)` | nacelles `dueSoon` et `expired`, les échues d'abord | FR-023 |
| `recordVgp(state, ref, date)` | enregistre une VGP | FR-024 |
| `putOnSale(state, ref, price)` / `withdrawSale(state, ref)` | mise en vente | FR-037 |
| `markSold(state, ref)` | vente conclue | FR-037, FR-039 |
| `catalogue(state)` | machines `forSale` | FR-038 |
| `requestPurchase(state, { ref, name, contact })` | demande d'achat | FR-038 |

##### `web/src/operations.js` — `ValletOperations`

| Fonction | Rôle | Exigences |
|----------|------|-----------|
| `recordDeparture(state, id, { date, photos, notes, deposit })` | départ | FR-026, FR-031 |
| `recordReturn(state, id, { date, photos, notes, damages })` | retour et règlement | FR-027, FR-032 |
| `settle(deposit, damages)` | calcul du règlement | FR-032 |
| `certificate(state, id)` | données de l'attestation VGP, ou `null` hors nacelle | FR-033 |
| `billingCsv(state)` | `{ ok: true, content, rowCount }` ou `{ ok: false, message }` | FR-034 |

##### `web/src/rules.js` — ajouts

| Fonction | Rôle | Exigences |
|----------|------|-----------|
| `bookOnline(state, { ref, start, end, name, phone, email })` | réservation particulier en ligne | FR-035, FR-036 |
| `book(state, request)` | accepte `customerType` (défaut `professionnel`) | FR-030 |

Nouveaux codes : `noPhoto`, `deposit`, `stage`, `departureDate`, `returnDate`, `damage`, `notNacelle`, `vgpDate`, `price`, `sold`, `activeReservation`, `contact`.

### `specs/002-exploitation-parc/contracts/ui.md`

#### Contract: écrans de 002

##### Onglet « Réservations » (US7 à US10)

- Bouton « Exporter pour la facturation (CSV) » au-dessus du tableau.
- Colonne « Étape » : pastille « Réservée », « Sortie » ou « Rendue » ; bouton « Ouvrir la fiche » par ligne.
- Fiche, dans une fenêtre superposée (modale) qui s'ouvre par-dessus l'écran en cours depuis la liste, le planning, l'agenda ou une notification ; fermeture par ×, « Fermer la fiche », Échap ou clic à côté ; le focus revient sur le bouton d'origine (titre « Réservation n° … ») :
  - en-tête : client (et « Particulier »), machine, agence, dates, étape ;
  - **Départ** : si réservée, formulaire *Date du départ*, *Photos* (appareil photo ou fichier, plusieurs), *Remarques*, et pour un particulier *Caution (€)* et *Mode* (Empreinte bancaire — simulation, Chèque, Espèces) ; bouton « Enregistrer le départ » ;
  - **Retour** : si sortie, *Date du retour*, *Photos*, *Remarques*, lignes de dégâts (*Description*, *Montant (€)*, « Ajouter un dégât ») ; bouton « Enregistrer le retour » ;
  - **État des lieux** : photos du départ et du retour côte à côte, remarques, dégâts, règlement de la caution ;
  - « Attestation VGP » pour une nacelle.
- Formulaire de réservation (001) : case « Client particulier ».

##### Onglet « Atelier » (US6)

- Carte « Alertes VGP » en tête : une ligne par nacelle échue ou à renouveler.
- Tableau « Suivi des VGP des nacelles » : dernière VGP, échéance, pastille « Valide », « À renouveler » ou « Échue », champ *Nouvelle VGP le* et bouton « Enregistrer la VGP de NACxxx ». Il remplace la colonne « Échéance VGP » du tableau du parc décrite dans le contrat de 001.
- Tableau « Parc et immobilisations atelier » : inchangé par rapport à 001, sans la colonne VGP ; les machines vendues n'y figurent plus.
- Onglet : « Atelier (n) » quand n alertes.

##### Onglet « Ventes » (US12)

- Tableau du parc : prix et statut de vente ; « Mettre en vente » (prix), « Retirer de la vente », « Marquer vendue ».
- Liste « Demandes d'achat ».

##### Attestation VGP (US9)

- Fenêtre superposée, bouton « Imprimer » (impression de l'attestation seule) et « Fermer ».

##### Espace public (US11, US12)

- Liens sur l'écran de connexion : « Particuliers : réserver en ligne », « Machines d'occasion ».
- En-tête public avec « Espace personnel » pour revenir à la connexion ; onglets « Louer » et « Occasion ».
- Louer : type, dates, « Rechercher » ; seules les machines disponibles ; formulaire *Nom*, *Téléphone*, *E-mail*, « Réserver cette machine » ; rappel de la caution au retrait.
- Occasion : cartes machine (type, agence, prix) ; formulaire de demande *Nom*, *Téléphone ou e-mail*, « Envoyer ma demande ».

### `specs/002-exploitation-parc/quickstart.md`

#### Quickstart: Exploitation du parc

Lancement et tests : voir le [quickstart de 001](specs/001-reservation-multi-agences/quickstart.md). Les 5 tests de 001 doivent toujours passer.

##### Recette manuelle

| # | Étant donné | Quand | Alors |
|---|-------------|-------|-------|
| 6 | Connecté (Mehdi) | J'ouvre Atelier | L'onglet affiche « Atelier (2) » ; alertes NAC089 échue et NAC118 à renouveler (3 jours) |
| 7 | Idem | J'enregistre une VGP du 12/10/2026 sur NAC089 | Échéance 12/04/2027 ; plus qu'1 alerte ; Façades Martin n'est plus à replacer |
| 8 | Connecté (Sandrine) | J'ouvre la fiche COMP21 (M. Pereira) et j'enregistre le départ sans photo | Refus « Ajoutez au moins une photo… » |
| 9 | Idem | Départ le 12/10 avec une photo et 500 € par empreinte | Étape « Sortie » |
| 10 | Idem | Retour le 12/10 avec une photo et un dégât de 120 € | « Rendue » ; 120 € retenus, 380 € restitués, 0 € à facturer ; photos côte à côte |
| 11 | Idem | « Exporter pour la facturation » | Un fichier CSV avec la ligne de M. Pereira |
| 12 | Fiche NAC112 (BTP Rhone) | « Attestation VGP » | Attestation imprimable, échéance 10/01/2027 |
| 13 | Écran de connexion | « Particuliers : réserver en ligne », COMP30 le 13/10, nom + téléphone | Réservation confirmée ; côté agence COMP30 indisponible le 13/10, client particulier |
| 14 | Connecté (Brice) | Ventes : ECH41 en vente à 2 500 € | Visible dans « Machines d'occasion » ; une demande y apparaît dans Ventes ; « Marquer vendue » la retire des recherches |

### `specs/002-exploitation-parc/tasks.md`

#### Tasks: Exploitation du parc

**Input**: [spec.md](specs/002-exploitation-parc/spec.md), [plan.md](specs/002-exploitation-parc/plan.md), [data-model.md](specs/002-exploitation-parc/data-model.md), [contracts/](specs/002-exploitation-parc/contracts/), [quickstart.md](specs/002-exploitation-parc/quickstart.md)

**Tests**: obligatoires ; chaque scénario a son test `node:test`, écrit avant le code. Les 41 tests de 001 doivent rester verts à chaque phase.

```bash
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/ws" -w /ws node:22-alpine node --test 'web/tests/*.test.js'
```

##### Phase 1: Foundational — données et disponibilité

- [X] T101 Compléter `web/src/data.js` selon [data-model.md](specs/002-exploitation-parc/data-model.md) : `customerType` (#4 `particulier`, autres `professionnel`), `contact: null`, `stage` (#5 `out` avec son `departure` importé, autres `booked`), `departure: null`, `return: null`, `sale: null` sur chaque machine, `leads: []`
- [X] T102 Écrire dans `web/tests/availability.test.js` les tests de disponibilité (doivent échouer) : retour anticipé qui libère la machine (US7-7), réservation sortie ou rendue jamais « à replacer », machine vendue absente des recherches et refusée (`sold`), `book` avec `customerType`
- [X] T103 Adapter `web/src/rules.js` : période occupée jusqu'à `return.date` pour une réservation rendue, « à replacer » limité à `booked`, machines vendues exclues de `search` et bloquées, `customerType` et `contact` dans `book` ; T102 et les 41 tests de 001 passent

##### Phase 2: US6 — VGP et alertes (P1)

- [X] T104 [P] [US6] Écrire `web/tests/fleet.test.js` (VGP) : statuts au 12/10/2026 (NAC089 échue, NAC118 à renouveler 3 jours, autres valides), alertes triées, `recordVgp` (NAC089 au 12/10 → échéance 12/04/2027 et Façades Martin gardée), refus date future, antérieure, vide, machine non nacelle
- [X] T105 [US6] Créer `web/src/fleet.js` (`vgpStatus`, `vgpAlerts`, `recordVgp`) ; T104 passe

##### Phase 3: US7 et US8 — état des lieux et cautions (P1)

- [X] T106 [P] [US7] [US8] Écrire dans `web/tests/operations.test.js` : départ refusé sans photo, avant le début, sur réservation à replacer, déjà sortie, nacelle à VGP échue à la date ; caution obligatoire pour particulier, pas pour professionnel ; retour refusé avant le départ, sans photo, dégât invalide ; règlements 500/120 → 120/380/0 et 500/800 → 500/0/300 ; professionnel 0 caution, 200 de dégâts → 200 à facturer
- [X] T107 [US7] [US8] Créer `web/src/operations.js` (`recordDeparture`, `recordReturn`, `settle`) ; T106 passe

##### Phase 4: US9 et US10 — attestation et export (P2)

- [X] T108 [P] [US9] [US10] Tests dans `web/tests/operations.test.js` : `certificate` pour NAC112 (#1) et `null` pour COMP21 ; mention « valide pendant toute la période » ou « à renouveler le … » ; `billingCsv` sans location rendue → message ; après un retour → en-têtes exacts et ligne de M. Pereira (jours, montants à virgule)
- [X] T109 [US9] [US10] Ajouter `certificate` et `billingCsv` dans `web/src/operations.js` ; T108 passe

##### Phase 5: US11 et US12 — en ligne et occasion (P3)

- [X] T110 [P] [US11] Tests dans `web/tests/online.test.js` : `bookOnline` crée un particulier saisi par « Réservation en ligne », refus sans nom ou sans contact, aucune double réservation avec une agence
- [X] T111 [US11] Ajouter `bookOnline` dans `web/src/rules.js` ; T110 passe
- [X] T112 [P] [US12] Tests dans `web/tests/fleet.test.js` (ventes) : mise en vente (prix > 0), catalogue, demande d'achat (nom et contact obligatoires), retrait, `markSold` refusé avec réservation non rendue (NAC112) et accepté sur ECH41, machine vendue absente de `search`
- [X] T113 [US12] Ajouter la vente dans `web/src/fleet.js` ; T112 passe

##### Phase 6: Interface

- [X] T114 Découper `web/src/app.js` en `web/src/ui/dom.js`, `login.js`, `search.js`, `reservations.js`, `workshop.js` sans changer le comportement ; rejouer la recette 001 + connexion dans le navigateur
- [X] T115 [US7] [US8] [US9] [US10] Fiche réservation, départ, retour, photos, caution, attestation et export dans `web/src/ui/reservations.js` et `web/src/ui/certificate.js` ; case « Client particulier » dans `web/src/ui/search.js`
- [X] T116 [US6] Alertes et saisie VGP dans `web/src/ui/workshop.js`, compteur sur l'onglet
- [X] T117 [US12] Onglet Ventes dans `web/src/ui/sales.js` et `web/index.html`
- [X] T118 [US11] [US12] Espace public dans `web/src/ui/public.js`, liens depuis `web/src/ui/login.js`
- [X] T119 Styles de tous les nouveaux écrans dans `web/styles-operations.css`, y compris l'impression de l'attestation

##### Phase 7: Validation

- [X] T120 Toute la suite `web/tests/` au vert
- [X] T121 Rejouer dans le navigateur les recettes de 001 (tests 1 à 5, atelier, connexion) et de 002 (tests 6 à 14) ; 0 erreur console
- [X] T122 Commiter et pousser

##### Dependencies

Phase 1 bloque tout. Phases 2 à 5 indépendantes entre elles après la phase 1. Phase 6 après les phases 2 à 5. T114 avant T115 à T118.

### `specs/002-exploitation-parc/checklists/requirements.md`

#### Specification Quality Checklist: Exploitation du parc

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-09
**Feature**: [spec.md](specs/002-exploitation-parc/spec.md)

##### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

##### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

##### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

##### Notes

- 4 clarifications answered on 2026-10-09 (scope: everything; VGP alert: 30 days; deposit: private customers only; at least one photo at departure).

## Feature 003-pilotage-agences

### `specs/003-pilotage-agences/spec.md`

#### Feature Specification: Pilotage des agences

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Continue de faire progresser le site pour qu'il ressemble à ce qui est demandé dans le dossier."

##### Contexte

Ce que le dossier demande encore et que 001 et 002 ne couvrent pas :

| Besoin | Source |
|--------|--------|
| Le planning de chaque agence est un fichier Excel par semaine (semaines 41 à 44) | Doc 3 |
| « Un collègue d'une autre agence promet une machine qui est chez moi, et je ne le sais pas » | Doc 2 (Sandrine) |
| « Le lundi matin, avec 15 départs, on n'a pas le temps » | Doc 2 |
| 40 grands comptes = 70 % du CA, tarifs négociés, bons de commande ; ils ne réserveront jamais « comme un particulier » | Doc 6 (Julie) |
| Les conducteurs de travaux veulent savoir en temps réel ce qui est disponible et recevoir les attestations VGP sans les réclamer | Doc 6 |
| Le directeur veut une proposition qui le mette à niveau face au concurrent, à montrer au salon | Doc 1, entretien Q7 |

**Règles inchangées** : toutes celles de 001 et 002. Aucune nouvelle règle ne bloque une réservation existante.

##### User Scenarios & Testing *(mandatory)*

###### User Story 13 - Planning multi-agences, semaines 41 à 44 (Priority: P1)

En tant que personnel d'agence, je veux voir sur une grille les machines et les jours des semaines 41 à 44, avec les réservations, les immobilisations et les VGP échues, afin de remplacer le fichier Excel de mon agence par une vue partagée.

**Why this priority**: c'est l'outil quotidien des agences (Doc 3) ; il rend visible ce que le téléphone cachait.

**Independent Test**: ouvrir le planning, filtrer sur Lyon Est.

**Acceptance Scenarios**:

1. **Given** les données de départ, **When** j'ouvre le planning, **Then** il couvre du lundi 05/10/2026 au dimanche 01/11/2026 (semaines 41 à 44), une ligne par machine non vendue, et marque aujourd'hui (12/10).
2. **Given** le planning, **When** je regarde NAC112, **Then** les jours du 14 au 18/10 sont « BTP Rhone » et les 16 et 17/10 sont signalés en conflit (double réservation héritée).
3. **Given** le planning, **When** je regarde MINI07, **Then** les jours du 12 au 20/10 sont « Atelier » ; **When** je regarde NAC089, **Then** les jours sans réservation sont « VGP échue » et ceux du 20 au 31/10 (Façades Martin, à replacer) sont en conflit.
4. **Given** le planning, **When** je filtre sur « Lyon Est », **Then** seules les machines de Lyon Est s'affichent.
5. **Given** une case de réservation, **When** je clique dessus, **Then** la fiche de la réservation s'ouvre.

---

###### User Story 14 - Être prévenu quand une autre agence réserve ma machine (Priority: P1)

En tant que responsable d'agence, je veux être prévenu quand une autre agence ou un client en ligne réserve une machine de mon agence, et quand une réservation que mon agence a saisie devient « à replacer », afin de ne plus découvrir le problème le jour du départ.

**Why this priority**: cause directe des doubles réservations décrites par Sandrine (Doc 2).

**Independent Test**: connectée en Sandrine (Lyon Est), voir la notification « Villeurbanne a réservé votre NAC112 ».

**Acceptance Scenarios**:

1. **Given** Sandrine (Lyon Est) connectée, **When** elle ouvre les notifications, **Then** elle voit que Villeurbanne a réservé NAC112 du 16 au 17/10 pour Maçonnerie Duclos.
2. **Given** Grenoble réserve COMP21 (Lyon Est), **When** Sandrine ouvre les notifications, **Then** une nouvelle notification l'en informe et le compteur augmente.
3. **Given** une réservation saisie par Lyon Est devient « à replacer » (atelier, VGP), **When** Sandrine ouvre les notifications, **Then** elle en est prévenue.
4. **Given** une notification, **When** Sandrine la marque comme lue, **Then** le compteur baisse ; « Tout marquer comme lu » vide le compteur.
5. **Given** un utilisateur sans agence (atelier, commerciale, direction), **Then** aucune cloche de notification n'est affichée.

---

###### User Story 15 - Départs et retours du jour (Priority: P2)

En tant que personnel d'agence, je veux la liste des départs et des retours prévus aujourd'hui dans mon agence, avec un accès direct à l'état des lieux, afin de tenir le rush du lundi matin.

**Why this priority**: Doc 2 (15 départs le lundi) et Doc 4 (photos au départ).

**Independent Test**: au 12/10 à Lyon Est, voir le départ de COMP21 (M. Pereira).

**Acceptance Scenarios**:

1. **Given** le 12/10 à Lyon Est, **When** j'ouvre le planning, **Then** « Aujourd'hui à Lyon Est » liste 1 départ (COMP21, M. Pereira) et 0 retour, avec un bouton qui ouvre la fiche pour l'état des lieux.
2. **Given** le départ de COMP21 enregistré, **When** je reviens au planning, **Then** il apparaît comme fait et le retour du jour est attendu.

---

###### User Story 16 - Grands comptes : fiche client, bon de commande, attestation envoyée (Priority: P2)

En tant que commerciale grands comptes, je veux que les grands comptes soient reconnus à la réservation, que leur bon de commande soit noté et que l'attestation VGP leur soit envoyée automatiquement au départ d'une nacelle, afin qu'ils n'aient plus à la réclamer.

**Why this priority**: 70 % du chiffre d'affaires (Doc 6).

**Independent Test**: réserver pour BTP Rhone avec un bon de commande, enregistrer le départ de NAC112, voir l'attestation envoyée.

**Acceptance Scenarios**:

1. **Given** l'annuaire des grands comptes (BTP Rhone), **When** je saisis « BTP Rhone » ou « BTP Rhône » comme client, **Then** l'outil le reconnaît comme grand compte et propose le champ « Bon de commande ».
2. **Given** une réservation de grand compte sans bon de commande, **When** je l'enregistre, **Then** elle est acceptée mais signalée « Bon de commande à fournir » dans sa fiche.
3. **Given** une nacelle louée à un grand compte, **When** le départ est enregistré, **Then** la fiche indique « Attestation VGP envoyée à conducteurs@btp-rhone.fr le … » (envoi simulé).
4. **Given** un client particulier ou une machine qui n'est pas une nacelle, **When** le départ est enregistré, **Then** aucune attestation n'est envoyée.

---

###### User Story 17 - Espace grands comptes : disponibilités et attestations (Priority: P2)

En tant que conducteur de travaux d'un grand compte, je veux me connecter pour voir les disponibilités en temps réel, mes réservations et mes attestations VGP, sans réserver moi-même, afin de ne plus appeler l'agence pour savoir.

**Why this priority**: demande récurrente des conducteurs de travaux (Doc 6) ; les grands comptes passent par des bons de commande et ne réservent pas « comme un particulier », donc pas de réservation en libre-service.

**Independent Test**: se connecter avec le compte de démonstration BTP Rhone.

**Acceptance Scenarios**:

1. **Given** le compte de démonstration du conducteur de travaux de BTP Rhone, **When** il se connecte, **Then** il arrive dans un espace client qui affiche son entreprise, ses réservations (NAC112 du 14 au 18/10, NAC140 du 19 au 23/10) avec leur étape, et rien des autres clients.
2. **Given** l'espace client, **When** il cherche un type et des dates, **Then** il voit les machines disponibles et leur agence, sans bouton de réservation, avec « Pour réserver, contactez Julie Ferrand, votre commerciale ».
3. **Given** une réservation de nacelle, **When** il ouvre l'attestation VGP, **Then** il obtient l'attestation imprimable de 002.

---

###### User Story 18 - Tableau de bord de la direction (Priority: P3)

En tant que directeur, je veux un tableau de bord des indicateurs du dossier, afin de suivre les effets de l'outil et de les montrer au salon.

**Why this priority**: Doc 1 (salon de fin novembre), entretien Q7 (démonstration fonctionnelle).

**Independent Test**: ouvrir le tableau de bord avec les données de départ.

**Acceptance Scenarios**:

1. **Given** les données de départ, **When** j'ouvre le tableau de bord, **Then** il affiche : réservations en cours ou à venir (7), réservations à replacer (2), nacelles en alerte VGP (2), machines à l'atelier (1), sorties sans photo (1), part des réservations grands comptes (2 sur 7).
2. **Given** des retours avec dégâts, **When** j'ouvre le tableau de bord, **Then** il affiche le montant des dégâts refacturés (retenu sur caution + reste à facturer), à comparer aux 85 000 € perdus l'an dernier (Doc 4).
3. **Given** le tableau de bord, **Then** il affiche l'occupation de chaque agence sur les semaines 42 à 44 (jours réservés / jours disponibles).

---

###### Edge Cases

- Une réservation « rendue » n'apparaît plus dans le planning après sa date de retour.
- Une machine vendue n'apparaît plus dans le planning.
- Une réservation saisie par l'agence propriétaire de la machine ne génère pas de notification.
- La reconnaissance d'un grand compte ignore les majuscules, les accents et les espaces autour.
- Le compte client ne voit jamais le nom des autres clients, ni dans ses réservations ni dans les disponibilités.

##### Requirements *(mandatory)*

###### Functional Requirements

- **FR-040**: L'outil DOIT afficher un planning des semaines 41 à 44 (05/10 au 01/11/2026), une ligne par machine non vendue, filtrable par agence, avec pour chaque jour : libre, réservée (client), conflit, sortie, atelier, VGP échue (nacelle).
- **FR-041**: Cliquer une case réservée DOIT ouvrir la fiche de la réservation.
- **FR-042**: L'outil DOIT notifier l'agence propriétaire d'une machine quand une autre agence ou un client en ligne la réserve, et l'agence qui a saisi une réservation quand elle devient « à replacer ».
- **FR-043**: Les notifications DOIVENT avoir un compteur de non-lues et pouvoir être marquées lues une à une ou toutes.
- **FR-044**: L'outil DOIT lister, pour une agence et la date du jour, les départs prévus (début aujourd'hui, pas encore sortis) et les retours attendus (fin aujourd'hui, sortis), avec accès à la fiche.
- **FR-045**: L'outil DOIT tenir un annuaire des grands comptes (nom, e-mail des conducteurs de travaux, commerciale) et reconnaître un client à la réservation sans tenir compte des majuscules, accents et espaces.
- **FR-046**: Une réservation de grand compte DOIT pouvoir porter un numéro de bon de commande ; son absence est signalée, sans bloquer.
- **FR-047**: Le départ d'une nacelle louée à un grand compte DOIT enregistrer l'envoi (simulé) de l'attestation VGP à l'e-mail de l'annuaire.
- **FR-048**: Un compte client DOIT ouvrir un espace dédié : ses réservations, ses attestations VGP, la recherche des disponibilités sans réservation ; aucune donnée d'un autre client n'y apparaît.
- **FR-049**: L'outil DOIT afficher un tableau de bord avec les indicateurs de US18.

###### Key Entities

- **Grand compte** : nom, e-mail des conducteurs de travaux, commerciale référente.
- **Compte client** (fictif) : e-mail, mot de passe de démonstration, nom affiché, grand compte associé.
- **Notification** : clé stable, agence destinataire, texte, réservation liée, lue ou non.
- **Réservation** (ajouts) : grand compte associé éventuel, bon de commande, attestation envoyée (e-mail, date).

##### Success Criteria *(mandatory)*

- **SC-010**: Une agence voit en un écran l'occupation de toutes ses machines sur 4 semaines, sans fichier Excel (Doc 3).
- **SC-011**: 100 % des réservations prises par une autre agence sur une machine sont notifiées à l'agence propriétaire (Doc 2).
- **SC-012**: 100 % des départs de nacelles louées à un grand compte ont une attestation VGP envoyée (Doc 6).
- **SC-013**: Un conducteur de travaux connaît la disponibilité sans appeler (Doc 6).

##### Assumptions

- **Annuaire** : le dossier ne nomme qu'un grand compte, BTP Rhone (Doc 6) ; c'est le seul de l'annuaire de démonstration. Son e-mail de conducteurs (conducteurs@btp-rhone.fr) et le compte client sont fictifs.
- **Envoi** : l'envoi d'e-mail est simulé ; aucun message ne part.
- **Tarifs négociés** : le dossier n'en donne pas ; ils restent dans le logiciel de facturation.
- **Occupation** : jours réservés ou sortis ÷ (machines non vendues × jours de la période), par agence de la machine.

### `specs/003-pilotage-agences/plan.md`

#### Implementation Plan: Pilotage des agences

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](specs/003-pilotage-agences/spec.md)

##### Summary

Ajouter au prototype le planning des semaines 41 à 44, les notifications entre agences, les départs et retours du jour, l'annuaire des grands comptes avec bon de commande et envoi d'attestation, l'espace client des grands comptes et le tableau de bord. Même architecture que 001 et 002 : modules purs testés, vues minces.

##### Technical Context

Identique à 002 (HTML/CSS/JS statique, scripts classiques, `node:test` dans Docker). **Contrainte** : 87 tests existants inchangés et verts ; aucune nouvelle règle bloquante ; fichiers de moins de 350 lignes.

##### Constitution Check

Constitution non remplie : aucune gate.

##### Affected Repos

Aucun dépôt enfant : `web/` du dépôt workspace.

##### Project Structure

```text
web/src/
├── data.js           # + keyAccounts, clientUsers, inboxRead
├── rules.js          # book : keyAccountId, purchaseOrder (non bloquant)
├── operations.js     # recordDeparture : attestation envoyée pour une nacelle de grand compte
├── planning.js       # ValletPlanning : jours S41-S44, grille, agenda du jour — pur
├── inbox.js          # ValletInbox : notifications dérivées de l'état, lues/non lues — pur
├── accounts.js       # ValletAccounts : annuaire, reconnaissance, réservations d'un client — pur
├── dashboard.js      # ValletDashboard : indicateurs — pur
└── ui/
    ├── planning.js   # onglet Planning + « Aujourd'hui à … »
    ├── inbox.js      # cloche et panneau de notifications
    ├── dashboard.js  # onglet Pilotage
    └── client.js     # espace grands comptes
web/tests/
├── planning.test.js
├── inbox.test.js
├── accounts.test.js
└── dashboard.test.js
```

**Décision clé — notifications dérivées** : les notifications ne sont pas créées par chaque action ; elles sont **calculées** à partir de l'état (réservation d'une machine par une agence qui n'en est pas propriétaire ; réservation saisie par l'agence et « à replacer »). Seules les clés lues sont stockées (`inboxRead[agence]`). Aucune action existante n'a donc à être modifiée, ce qui supprime le risque de régression et garantit SC-011.

**Décision clé — comptes clients** : stockés à part (`clientUsers`), pour ne pas changer la liste des 4 comptes du personnel testée en 001.

##### Complexity Tracking

Aucun écart nouveau.

### `specs/003-pilotage-agences/tasks.md`

#### Tasks: Pilotage des agences

**Tests**: obligatoires, écrits avant le code ; les 87 tests existants restent verts.

##### Phase 1: Données

- [X] T201 Ajouter dans `web/src/data.js` : `keyAccounts` (BTP Rhone, conducteurs@btp-rhone.fr, Julie Ferrand), `clientUsers` (conducteur BTP Rhone, mot de passe de démonstration), `inboxRead: {}` ; `keyAccountId` et `purchaseOrder` sur les réservations (#1 et #6 : BTP Rhone)

##### Phase 2: Modules purs (tests d'abord)

- [X] T202 [P] [US16] `web/tests/accounts.test.js` puis `web/src/accounts.js` : reconnaissance « BTP Rhône », « btp rhone », espaces ; réservations d'un compte ; `book` enregistre `keyAccountId` et `purchaseOrder` ; signalement « bon de commande à fournir »
- [X] T203 [P] [US16] Tests dans `web/tests/accounts.test.js` puis `web/src/operations.js` : attestation envoyée au départ d'une nacelle de grand compte ; rien pour COMP21 ni pour un particulier
- [X] T204 [P] [US13] [US15] `web/tests/planning.test.js` puis `web/src/planning.js` : 28 jours du 05/10 au 01/11, cases NAC112, MINI07, NAC089, ECH40, filtre agence, machine vendue absente, agenda du jour Lyon Est
- [X] T205 [P] [US14] `web/tests/inbox.test.js` puis `web/src/inbox.js` : notification Duclos pour Lyon Est, nouvelle réservation Grenoble → Lyon Est, réservation en ligne, à replacer, pas de notification pour l'agence propriétaire, lecture une à une et toutes
- [X] T206 [P] [US18] `web/tests/dashboard.test.js` puis `web/src/dashboard.js` : indicateurs de US18-1, dégâts refacturés, occupation par agence

##### Phase 3: Interface

- [X] T207 [US13] [US15] Onglet Planning dans `web/src/ui/planning.js` et `web/index.html`
- [X] T208 [US14] Cloche et panneau dans `web/src/ui/inbox.js`, en-tête de `web/src/app.js`
- [X] T209 [US16] Bon de commande dans `web/src/ui/search.js`, signalement et attestation envoyée dans `web/src/ui/reservation-detail.js`
- [X] T210 [US17] Espace client dans `web/src/ui/client.js`, connexion des comptes clients dans `web/src/ui/login.js` et `web/src/app.js`
- [X] T211 [US18] Onglet Pilotage dans `web/src/ui/dashboard.js`
- [X] T212 Styles dans `web/styles-pilotage.css`

##### Phase 4: Validation

- [X] T213 Toute la suite `web/tests/` au vert
- [X] T214 Rejouer dans le navigateur les recettes 001, 002 et 003 ; 0 erreur console ; 1366 px sans débordement
- [X] T215 Commiter et pousser

### `specs/003-pilotage-agences/checklists/requirements.md`

#### Specification Quality Checklist: Pilotage des agences

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-09
**Feature**: [spec.md](specs/003-pilotage-agences/spec.md)

##### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

##### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

##### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

##### Notes

- No clarification needed: every requirement traces to Docs 1, 2, 3, 4 and 6; the only assumption (BTP Rhone as the sole demo key account) is listed in the spec.

## Feature 004-fiabiliser-exploitation

### `specs/004-fiabiliser-exploitation/spec.md`

#### Feature Specification: Fiabiliser l'exploitation

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Continue de faire progresser le site."

##### Contexte

001 à 003 couvrent les besoins du dossier. Cette feature rend l'outil tenable au quotidien, en partant des mêmes problèmes :

| Besoin | Source |
|--------|--------|
| Les réservations se prennent et se modifient par téléphone ; une réservation figée ne reflète plus la réalité | Doc 2 |
| « Sans photo au départ, le client conteste les dégâts au retour et on finit par payer » : la photo seule ne prouve pas l'accord du client | Doc 4 |
| « Quand je n'ai pas la machine, j'appelle les autres agences une par une » : quand rien n'est libre, il faut proposer une date | Doc 2 |
| « Un collègue promet une machine qui est chez moi, et je ne le sais pas » : savoir qui a fait quoi | Doc 2 |

**Règles inchangées** : toutes celles de 001 à 003. Aucune action existante ne devient bloquante.

##### User Scenarios & Testing *(mandatory)*

###### User Story 19 - Modifier ou annuler une réservation (Priority: P1)

En tant que personnel d'agence, je veux changer les dates d'une réservation pas encore partie, compléter son bon de commande, ou l'annuler avec un motif, afin que le planning reste juste.

**Independent Test**: décaler la réservation COMP21 de M. Pereira au 13/10, puis l'annuler.

**Acceptance Scenarios**:

1. **Given** la réservation NAC112 de BTP Rhone (14 au 18/10), **When** je la décale du 19 au 20/10, **Then** les dates changent et la réservation de Duclos (16 au 17/10) n'est plus en conflit.
2. **Given** NAC140 réservée du 19 au 23/10, **When** je décale la réservation de NAC112 sur des dates qui chevauchent une autre réservation de NAC112, sont passées ou incohérentes, **Then** la modification est refusée avec le motif, comme une réservation.
3. **Given** une réservation pas encore partie, **When** je l'annule avec un motif, **Then** elle passe à « Annulée », libère immédiatement la machine, disparaît du planning, des alertes et des indicateurs, et reste visible dans la liste.
4. **Given** une réservation sortie, rendue ou déjà annulée, **When** je tente de la modifier ou de l'annuler, **Then** c'est refusé ; une annulation sans motif est refusée.
5. **Given** une réservation de grand compte sans bon de commande, **When** je saisis le bon de commande dans sa fiche, **Then** l'alerte « Bon de commande à fournir » disparaît.
6. **Given** Villeurbanne annule la réservation de Duclos sur NAC112 (Lyon Est), **When** Sandrine ouvre ses notifications, **Then** elle est prévenue de l'annulation.

---

###### User Story 20 - Signature du client à l'état des lieux (Priority: P1)

En tant que personnel d'agence, je veux faire signer le client sur l'écran au départ et au retour, avec son nom, afin qu'il ne puisse plus contester l'état constaté.

**Independent Test**: départ de COMP21 avec photo, caution et signature de M. Pereira.

**Acceptance Scenarios**:

1. **Given** le formulaire de départ, **When** le client signe dans le cadre et que je saisis son nom, **Then** la signature et le nom sont enregistrés avec l'état des lieux.
2. **Given** une signature sans nom de signataire, **When** j'enregistre, **Then** c'est refusé : « Indiquez le nom de la personne qui signe. »
3. **Given** un état des lieux sans signature, **When** je consulte la fiche, **Then** il est marqué « Non signé par le client » (la signature reste facultative pour ne bloquer aucun départ).
4. **Given** le cadre de signature, **When** je clique sur « Effacer », **Then** la signature est retirée.

---

###### User Story 21 - Bon de sortie imprimable (Priority: P2)

En tant que personnel d'agence, je veux imprimer un bon de sortie avec l'état des lieux, afin d'avoir une preuve à présenter au client.

**Independent Test**: après le départ de COMP21, imprimer son bon de sortie.

**Acceptance Scenarios**:

1. **Given** une réservation sortie, **When** j'ouvre « Bon de sortie », **Then** un document imprimable affiche client, machine, agence, période, date de départ, photos, remarques, caution et signature (ou « Non signé »).
2. **Given** une réservation rendue, **When** j'ouvre le document, **Then** il contient aussi le retour : date, photos, dégâts, règlement de la caution et signature du retour.
3. **Given** une réservation pas encore partie ou annulée, **Then** aucun bon de sortie n'est proposé.

---

###### User Story 22 - Prochaine disponibilité (Priority: P2)

En tant que personnel d'agence, je veux voir, pour chaque machine indisponible, la première période libre de même durée, et la réserver en un clic, afin de proposer une date au client au lieu d'appeler les autres agences.

**Independent Test**: chercher « Nacelle 12 m » du 17 au 20/10.

**Acceptance Scenarios**:

1. **Given** NAC112 réservée du 14 au 18/10 et NAC140 du 19 au 23/10, **When** je cherche « Nacelle 12 m » du 17 au 20/10 (4 jours), **Then** NAC112 propose « Disponible du 19/10 au 22/10 » et NAC140 « Disponible du 24/10 au 27/10 ».
2. **Given** MINI07 à l'atelier jusqu'au 20/10, **When** je la cherche du 15 au 16/10, **Then** elle propose « Disponible du 21/10 au 22/10 ».
3. **Given** une nacelle sans VGP valide, **When** elle est indisponible, **Then** elle indique « Pas de disponibilité dans les 60 jours » (tant que la VGP n'est pas renouvelée).
4. **Given** une proposition, **When** je clique sur « Réserver ces dates », **Then** la recherche passe sur ces dates et le formulaire de réservation de la machine s'ouvre.

---

###### User Story 23 - Journal d'activité (Priority: P3)

En tant que direction, je veux un journal de qui a fait quoi, afin de retrouver qui a promis une machine ou constaté un dégât.

**Independent Test**: après une réservation de Sandrine, voir la ligne dans le journal.

**Acceptance Scenarios**:

1. **Given** Sandrine connectée, **When** elle réserve COMP30, **Then** le journal du tableau de bord affiche « Sandrine Morin — Réservation n° 8 : COMP30 pour BTP Rhone du 13/10/2026 au 15/10/2026 » en premier.
2. **Given** les actions de réservation, transfert, modification, annulation, départ, retour, VGP, immobilisation, remise en service, mise en vente, vente, réservation en ligne et demande d'achat, **Then** chacune ajoute une ligne avec son auteur (« Client en ligne » ou « Visiteur » pour l'espace public).
3. **Given** les données de départ, **Then** le journal est vide.

---

###### Edge Cases

- Une réservation annulée ne compte ni pour le chevauchement, ni pour « à replacer », ni pour la vente d'une machine, ni pour l'occupation.
- Décaler une réservation peut la sortir d'un conflit (elle redevient « gardée ») ou en sortir une autre.
- La prochaine disponibilité est cherchée à partir de la date de début demandée (ou d'aujourd'hui si elle est passée), sur 60 jours.
- La signature est une image dessinée à la souris, au doigt ou au stylet ; elle reste dans le navigateur comme les photos.

##### Requirements *(mandatory)*

- **FR-050**: Une réservation « Réservée » DOIT pouvoir changer de dates, sous les mêmes règles qu'une réservation (FR-005 à FR-008), en ignorant sa propre période.
- **FR-051**: Une réservation « Réservée » DOIT pouvoir être annulée avec un motif obligatoire ; elle passe à l'étape « Annulée », avec la date, le motif et l'auteur.
- **FR-052**: Une réservation annulée NE DOIT plus bloquer sa machine ni apparaître dans le planning, les alertes, les notifications de réservation, les indicateurs d'activité et l'occupation.
- **FR-053**: L'agence propriétaire de la machine DOIT être notifiée d'une annulation faite par une autre agence.
- **FR-054**: Le bon de commande d'une réservation de grand compte DOIT pouvoir être saisi après coup.
- **FR-055**: Le départ et le retour DOIVENT accepter une signature dessinée et le nom du signataire ; une signature sans nom est refusée ; l'absence de signature est signalée sans bloquer.
- **FR-056**: L'outil DOIT produire un bon de sortie imprimable pour une réservation sortie ou rendue.
- **FR-057**: Pour chaque machine indisponible d'une recherche, l'outil DOIT proposer la première période libre de même durée dans les 60 jours, et permettre de la réserver en un clic.
- **FR-058**: Chaque action qui modifie les données DOIT ajouter au journal une ligne datée avec son auteur ; le tableau de bord affiche les 20 dernières lignes.

##### Success Criteria *(mandatory)*

- **SC-014**: Le planning reflète toute modification ou annulation dès qu'elle est saisie.
- **SC-015**: Chaque état des lieux signé porte l'image et le nom du signataire.
- **SC-016**: Pour une machine indisponible, une date de remplacement est proposée sans appel téléphonique.
- **SC-017**: Toute action est attribuable à une personne.

##### Assumptions

- **Horodatage** : la date du jour est figée (12/10/2026) ; le journal numérote les actions dans l'ordre plutôt que de lire l'horloge.
- **Signature** : simple preuve visuelle dans le prototype ; une signature électronique à valeur légale demanderait un prestataire.
- **Modification** : seules les dates changent ; changer de machine passe par le transfert existant.

### `specs/004-fiabiliser-exploitation/plan.md`

#### Implementation Plan: Fiabiliser l'exploitation

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](specs/004-fiabiliser-exploitation/spec.md)

##### Summary

Modification et annulation des réservations, signature du client à l'état des lieux, bon de sortie imprimable, prochaine disponibilité dans la recherche, journal d'activité. Même architecture : modules purs testés, vues minces.

##### Technical Context

Identique à 001–003. **Contraintes** : 114 tests existants verts sans modification ; aucune action existante ne devient bloquante ; fichiers de moins de 350 lignes (`rules.js` en est à 335 : les nouvelles règles vont dans un nouveau module).

##### Constitution Check

Constitution non remplie : aucune gate.

##### Project Structure

```text
web/src/
├── rules.js           # + isCancelled ; une réservation annulée est ignorée (chevauchement, à replacer)
├── changes.js         # ValletChanges : reschedule, cancel, setPurchaseOrder, nextAvailability — pur
├── journal.js         # ValletJournal : record, latest — pur
├── operations.js      # + signature facultative au départ et au retour
├── planning.js        # ignore les annulées
├── inbox.js           # ignore les annulées ; notifie l'annulation à l'agence propriétaire
├── dashboard.js       # ignore les annulées
├── fleet.js           # markSold ignore les annulées
└── ui/
    ├── dom.js         # + signaturePad
    ├── search.js      # prochaine disponibilité, « Réserver ces dates »
    ├── reservation-detail.js  # signature, bon de sortie, état « Annulée »
    ├── reservation-changes.js # modifier les dates, bon de commande, annuler
    ├── handover.js    # bon de sortie imprimable
    └── dashboard.js   # journal d'activité
web/tests/
├── changes.test.js
├── signature.test.js
└── journal.test.js
```

**Décision — annulation** : étape `cancelled`, jamais supprimée (traçabilité). Un seul prédicat `ValletRules.isCancelled` utilisé par tous les modules.

**Décision — journal** : `app.commit(nextState, texte)` remplace `app.setState` dans les vues pour toute action métier ; l'auteur est l'utilisateur connecté, « Client en ligne » ou « Visiteur » dans l'espace public. Le journal est une donnée de l'état, donc testable.

**Décision — documents imprimables** : la racine d'impression de l'attestation devient générique (`view.document = { kind, id }`) et sert aussi au bon de sortie.

##### Complexity Tracking

Aucun écart.

### `specs/004-fiabiliser-exploitation/tasks.md`

#### Tasks: Fiabiliser l'exploitation

**Tests**: obligatoires, écrits avant le code ; les 114 tests existants restent verts sans modification.

##### Phase 1: Modules purs (tests d'abord)

- [X] T301 [US19] `web/tests/changes.test.js` puis `web/src/changes.js` et `isCancelled` dans `web/src/rules.js` : décalage (US19-1, US19-2), annulation (US19-3, US19-4), bon de commande (US19-5), annulée ignorée par planning, notifications, tableau de bord, vente
- [X] T302 [US19] Notification d'annulation dans `web/src/inbox.js` (US19-6) ; annulées ignorées dans `web/src/planning.js`, `web/src/dashboard.js`, `web/src/fleet.js`
- [X] T303 [US22] `nextAvailability` dans `web/src/changes.js`, testé dans `web/tests/changes.test.js` (US22-1 à US22-3)
- [X] T304 [US20] `web/tests/signature.test.js` puis signature facultative dans `web/src/operations.js`
- [X] T305 [US23] `web/tests/journal.test.js` puis `web/src/journal.js`

##### Phase 2: Interface

- [X] T306 [US19] Modifier, annuler, bon de commande dans `web/src/ui/reservation-detail.js` ; étape « Annulée » dans `web/src/ui/reservations.js`
- [X] T307 [US20] `signaturePad` dans `web/src/ui/dom.js`, utilisé au départ et au retour ; « Non signé » dans la fiche
- [X] T308 [US21] `web/src/ui/handover.js` et racine d'impression générique dans `web/src/app.js`
- [X] T309 [US22] Prochaine disponibilité dans `web/src/ui/search.js`
- [X] T310 [US23] `app.commit` dans `web/src/app.js`, appelé par toutes les vues ; journal dans `web/src/ui/dashboard.js`
- [X] T311 Styles dans `web/styles-exploitation.css`

##### Phase 3: Validation

- [X] T312 Toute la suite `web/tests/` au vert
- [X] T313 Rejouer les recettes 001 à 004 dans le navigateur ; 0 erreur console ; 1366 px sans débordement
- [X] T314 Commiter et pousser

---

##### Phase 4: Fiche dans une fenêtre (demande de l'équipe, 09/10/2026)

- [X] T315 Ouvrir la fiche d'une réservation dans une fenêtre superposée depuis la liste, le planning, l'agenda et les notifications, sans changer d'onglet : `web/src/ui/modal.js`, `app.openReservation` / `app.closeReservation` dans `web/src/app.js`, styles dans `web/styles-exploitation.css`
- [X] T316 Fermeture par ×, « Fermer la fiche », Échap (après l'attestation ou le bon de sortie s'ils sont ouverts) ou clic à côté (pas quand un trait de signature se termine hors de la fenêtre) ; focus piégé dans la fenêtre puis rendu au bouton d'origine ; défilement de la page bloqué ; plein écran sur téléphone
- [X] T317 Rejouer les recettes 001 à 004 avec la fiche en fenêtre ; 0 erreur console ; 375 et 1366 px sans débordement

### `specs/004-fiabiliser-exploitation/checklists/requirements.md`

#### Specification Quality Checklist: Fiabiliser l'exploitation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-09
**Feature**: [spec.md](specs/004-fiabiliser-exploitation/spec.md)

##### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

##### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

##### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

##### Notes

- No clarification needed: every story traces to Docs 2 and 4; the signature stays optional so no existing departure becomes blocked.

## Feature 005-continuite-et-recherche

### `specs/005-continuite-et-recherche/spec.md`

#### Feature Specification: Continuité et recherche

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Continue de faire progresser le site sans régressions."

##### Contexte

| Besoin | Source |
|--------|--------|
| Le prototype oublie tout au rechargement : réservations, photos, signatures, journal. Un planning qui oublie ne remplace pas le fichier Excel de l'agence | Doc 3 ; décision 7 de la recherche 001, remplacée ici |
| Un client appelle pour « sa » réservation : il faut la retrouver par son nom, la machine, le numéro ou le bon de commande | Doc 2 (90 % des réservations par téléphone), Doc 6 (bons de commande) |
| Mehdi détient l'inventaire réel et suivait tout sur un tableau papier : il faut l'historique de chaque machine | Doc 5, entretien Q2 |

**Règles inchangées** : toutes celles de 001 à 004.

##### User Scenarios & Testing *(mandatory)*

###### User Story 24 - Conserver les données entre deux ouvertures (Priority: P1)

En tant que personnel d'agence, je veux retrouver mes réservations, photos, signatures et le journal quand je rouvre l'outil, et pouvoir remettre la démonstration à zéro, afin d'utiliser l'outil d'un jour à l'autre.

**Independent Test**: réserver COMP30, recharger la page, la réservation est toujours là ; « Réinitialiser la démonstration » remet les données de départ.

**Acceptance Scenarios**:

1. **Given** une réservation, un départ avec photo et signature, et une VGP enregistrée, **When** je recharge ou ferme puis rouvre la page, **Then** tout est retrouvé à l'identique, journal compris.
2. **Given** des données conservées, **When** je clique sur « Réinitialiser la démonstration » et confirme, **Then** les données de départ reviennent et la connexion est conservée.
3. **Given** des données conservées illisibles ou d'une version antérieure du prototype, **When** j'ouvre l'outil, **Then** il repart des données de départ sans planter.
4. **Given** le stockage du navigateur plein ou indisponible, **When** une action est enregistrée, **Then** l'outil continue de fonctionner et affiche « Les dernières modifications ne seront pas conservées après fermeture : stockage du navigateur indisponible ou plein. »
5. **Given** une photo prise au téléphone, **When** elle est ajoutée, **Then** elle est réduite (côté le plus long 1 024 px, JPEG) avant d'être conservée.

---

###### User Story 25 - Retrouver une réservation (Priority: P1)

En tant que personnel d'agence, je veux filtrer la liste des réservations par texte, agence et étape, afin de répondre au client au téléphone.

**Independent Test**: taper « duclos » dans la recherche.

**Acceptance Scenarios**:

1. **Given** les données de départ, **When** je tape « duclos », « DUCLOS » ou « Maçonnerie », **Then** seule la réservation de Maconnerie Duclos reste.
2. **Given** les données de départ, **When** je tape « NAC112 », **Then** les deux réservations de NAC112 restent ; **When** je tape « 4 » ou « n° 4 », **Then** la réservation n° 4 reste en premier.
3. **Given** une réservation avec le bon de commande BC-2026-118, **When** je tape « bc-2026-118 », **Then** elle est trouvée.
4. **Given** le filtre agence « Grenoble », **Then** seules les réservations des machines de Grenoble restent ; **Given** le filtre étape « Sortie », **Then** seule ECH40 reste.
5. **Given** aucun résultat, **Then** « Aucune réservation ne correspond à ces critères. » et un bouton « Effacer les filtres ».
6. **Given** je tape dans la recherche, **Then** la liste se met à jour à chaque frappe sans perdre le curseur.

---

###### User Story 26 - Fiche machine (Priority: P2)

En tant que responsable atelier, je veux ouvrir la fiche d'une machine avec son état, sa VGP, ses locations et ses dégâts cumulés, afin de remplacer mon tableau papier.

**Independent Test**: ouvrir la fiche de NAC112.

**Acceptance Scenarios**:

1. **Given** NAC112, **When** j'ouvre sa fiche, **Then** elle affiche type, agence, VGP (dernière, échéance, statut), état (disponible, à l'atelier, en vente, vendue), et ses 2 réservations avec leur étape.
2. **Given** des locations rendues avec dégâts, **Then** la fiche affiche le total des dégâts et le nombre de jours loués.
3. **Given** la fiche machine, **When** je clique une réservation, **Then** la fiche de la réservation la remplace.
4. **Given** l'onglet Atelier, le planning ou la fiche d'une réservation, **Then** la référence de la machine ouvre sa fiche.

---

###### Edge Cases

- La connexion reste gérée à part (session du navigateur), comme en 001 : réinitialiser les données ne déconnecte pas.
- Les photos déjà ajoutées avant cette version (adresses temporaires du navigateur) ne survivent pas à un rechargement ; les nouvelles, si.
- La recherche ignore les majuscules, les accents et les espaces autour.

##### Requirements *(mandatory)*

- **FR-059**: L'état complet (machines, réservations, demandes d'achat, notifications lues, journal) DOIT être enregistré dans le navigateur après chaque action et relu à l'ouverture.
- **FR-060**: Un enregistrement illisible, incomplet ou d'une autre version DOIT être ignoré au profit des données de départ.
- **FR-061**: L'outil DOIT proposer « Réinitialiser la démonstration », avec confirmation, qui remet les données de départ.
- **FR-062**: Un échec d'enregistrement DOIT être signalé à l'utilisateur sans bloquer l'outil.
- **FR-063**: Les photos DOIVENT être réduites à 1 024 px de côté maximum, en JPEG, avant d'être conservées.
- **FR-064**: La liste des réservations DOIT être filtrable par texte (client, machine, numéro, contact, bon de commande, agence de saisie), agence de la machine et étape, sans tenir compte des majuscules ni des accents.
- **FR-065**: L'outil DOIT afficher une fiche machine : identité, VGP, état, réservations (avec étape), jours loués et dégâts cumulés des locations rendues.

##### Success Criteria *(mandatory)*

- **SC-018**: 100 % des saisies sont retrouvées après rechargement, tant que le stockage du navigateur le permet.
- **SC-019**: Une réservation est retrouvée en moins de 5 secondes à partir d'un nom, d'une machine ou d'un numéro.
- **SC-020**: L'historique d'une machine est consultable sans tableau papier.

##### Assumptions

- **Stockage** : `localStorage` du navigateur, propre à chaque poste ; un partage entre agences demandera un serveur.
- **Version** : un numéro de version des données permet d'ignorer un enregistrement d'une version antérieure du prototype.

### `specs/005-continuite-et-recherche/plan.md`

#### Implementation Plan: Continuité et recherche

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](specs/005-continuite-et-recherche/spec.md)

##### Summary

Conserver l'état dans le navigateur avec une remise à zéro, réduire les photos pour qu'elles tiennent, filtrer la liste des réservations, et ajouter une fiche machine dans la fenêtre superposée de 004.

##### Technical Context

Identique à 001–004. **Contraintes** : 136 tests existants verts sans modification ; aucune règle métier modifiée ; fichiers de moins de 350 lignes.

##### Constitution Check

Constitution non remplie : aucune gate.

##### Project Structure

```text
web/src/
├── persistence.js     # ValletPersistence : serialize, restore (version, contrôle de forme) — pur
├── filters.js         # ValletFilters : reservations(state, { query, agency, stage }) — pur
├── machines.js        # ValletMachines : history(state, ref) — pur
├── app.js             # lecture/écriture localStorage, avertissement, réinitialisation, focus conservé au rendu
└── ui/
    ├── dom.js         # photoPicker : réduction 1 024 px JPEG
    ├── reservations.js # barre de filtres
    ├── machine-detail.js # fiche machine
    └── modal.js       # la fenêtre accepte une réservation ou une machine
web/tests/
├── persistence.test.js
├── filters.test.js
└── machines.test.js
```

**Décision — stockage** : `localStorage`, clé `vallet.data`, enveloppe `{ version, state }`. Écriture après chaque `app.commit` et chaque `app.setState` (notifications lues) ; toute erreur d'écriture devient un avertissement visible (FR-062). Lecture à l'ouverture via `ValletPersistence.restore`, qui retombe sur les données de départ en cas de problème (FR-060). Remplace la décision 7 de la recherche 001.

**Décision — focus au rendu** : `app.render` mémorise l'élément actif (clé `data-focus-key`) et la position du curseur, puis les restaure : la recherche se met à jour à chaque frappe sans perdre la saisie.

##### Complexity Tracking

Aucun écart.

### `specs/005-continuite-et-recherche/tasks.md`

#### Tasks: Continuité et recherche

**Tests**: obligatoires, écrits avant le code ; les 136 tests existants restent verts sans modification.

##### Phase 1: Modules purs (tests d'abord)

- [X] T401 [US24] `web/tests/persistence.test.js` puis `web/src/persistence.js` : aller-retour complet (photos et signatures en data URL, journal), absence, JSON illisible, autre version, forme incomplète
- [X] T402 [US25] `web/tests/filters.test.js` puis `web/src/filters.js` : US25-1 à US25-4, numéro exact en premier, accents
- [X] T403 [US26] `web/tests/machines.test.js` puis `web/src/machines.js` : US26-1, US26-2, états atelier, en vente, vendue

##### Phase 2: Interface

- [X] T404 [US24] `web/src/app.js` : lecture à l'ouverture, écriture après chaque action, avertissement, « Réinitialiser la démonstration » avec confirmation dans l'onglet Pilotage ; session déplacée dans `web/src/ui/session.js` pour garder `app.js` sous 350 lignes
- [X] T405 [US24] `web/src/ui/dom.js` : photos réduites à 1 024 px JPEG
- [X] T406 [US25] Barre de filtres dans `web/src/ui/reservations.js` ; focus et curseur conservés au rendu dans `web/src/app.js`
- [X] T407 [US26] `web/src/ui/machine-detail.js`, `web/src/ui/modal.js` ; liens depuis l'Atelier, le planning et la fiche réservation
- [X] T408 Styles dans `web/styles-continuite.css` ; mise à jour de la recherche 001 (décision 7), du cas limite de 002, de `web/CLAUDE.md` et du quickstart 001

##### Phase 3: Validation

- [X] T409 Toute la suite `web/tests/` au vert
- [X] T410 Rejouer les recettes 001 à 005 dans le navigateur, en partant de « Réinitialiser la démonstration » ; 0 erreur console ; 375 et 1366 px sans débordement
- [X] T411 Commiter et pousser

### `specs/005-continuite-et-recherche/checklists/requirements.md`

#### Specification Quality Checklist: Continuité et recherche

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-09
**Feature**: [spec.md](specs/005-continuite-et-recherche/spec.md)

##### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

##### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

##### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

##### Notes

- No clarification needed: persistence replaces decision 7 of the 001 research, with a reset to keep the demo reproducible.

## Feature 006-recherche-et-navigation

### `specs/006-recherche-et-navigation/spec.md`

#### Feature Specification: Recherche et navigation

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Dans la première page, pouvoir filtrer par référence en plus des modèles ; sur la page des stats, pouvoir cliquer sur les stats ; dans le planning, rechercher le nom des entreprises. Sans régression."

##### Contexte

Demande de l'équipe projet. Elle prolonge des besoins du dossier : un client qui rappelle pour « sa » machine (Doc 2), le suivi des grands comptes comme BTP Rhone (Doc 6), le pilotage par la direction (Doc 1).

**Règles inchangées** : toutes celles de 001 à 005. La recherche par type seul donne exactement les mêmes résultats qu'avant.

##### User Scenarios & Testing *(mandatory)*

###### User Story 27 - Chercher par référence (Priority: P1)

En tant que personnel d'agence, je veux chercher une machine par sa référence, avec ou sans type, afin de répondre au client qui donne le numéro de la machine.

**Independent Test**: chercher « nac1 » sur tous les types du 16 au 17/10.

**Acceptance Scenarios**:

1. **Given** le type « Nacelle 12 m » et aucune référence, **When** je cherche du 16 au 17/10, **Then** le résultat est identique à celui de 001 (NAC140 disponible ; NAC112 et NAC118 indisponibles).
2. **Given** « Tous les types » et la référence « nac1 » (majuscules ou non), **When** je cherche du 16 au 17/10, **Then** seules NAC112, NAC140 et NAC118 apparaissent, avec leur disponibilité.
3. **Given** « Tous les types » et aucune référence, **When** je cherche, **Then** toutes les machines non vendues apparaissent, chacune avec son type.
4. **Given** le type « Nacelle 12 m » et la référence « COMP », **When** je cherche, **Then** « Aucune machine ne correspond à ce type et à cette référence. »
5. **Given** un résultat obtenu par référence, **When** je réserve ou clique « Réserver ces dates », **Then** la réservation fonctionne comme avant et la référence reste dans la recherche.

---

###### User Story 28 - Cliquer sur les statistiques du pilotage (Priority: P1)

En tant que direction, je veux cliquer sur une statistique pour voir les éléments qu'elle compte, afin de passer du chiffre à l'action.

**Independent Test**: cliquer « Sorties sans photo » et voir ECH40.

**Acceptance Scenarios**:

1. **Given** le pilotage, **When** je clique « Réservations en cours ou à venir », **Then** l'onglet Réservations s'ouvre filtré sur les réservations réservées ou sorties (7 avec les données de départ).
2. **When** je clique « Réservations à replacer », **Then** la liste est filtrée sur les 2 réservations à replacer.
3. **When** je clique « Nacelles en alerte VGP », **Then** l'onglet Atelier s'ouvre sur les alertes VGP ; **When** je clique « Machines à l'atelier », **Then** l'onglet Atelier s'ouvre sur le parc.
4. **When** je clique « Sorties sans photo », **Then** la liste est filtrée sur ECH40 ; **When** je clique « Part grands comptes », **Then** sur les 2 réservations de BTP Rhone ; **When** je clique « Dégâts refacturés », **Then** sur les locations rendues avec dégâts.
5. **When** je clique une agence dans « Occupation par agence », **Then** le planning s'ouvre filtré sur cette agence.
6. **Given** un filtre appliqué depuis le pilotage, **Then** il est affiché dans la barre de filtres et « Effacer les filtres » le retire.

---

###### User Story 29 - Chercher une entreprise dans le planning (Priority: P1)

En tant que commerciale grands comptes, je veux taper le nom d'une entreprise dans le planning et ne voir que les machines qu'elle a réservées, ses jours mis en évidence, afin de répondre au client d'un coup d'œil.

**Independent Test**: taper « btp » dans le planning.

**Acceptance Scenarios**:

1. **Given** le planning, **When** je tape « btp » (ou « BTP Rhône »), **Then** seules NAC112 et NAC140 restent, et les jours de BTP Rhone sont mis en évidence, les autres atténués.
2. **Given** une recherche combinée avec le filtre agence « Grenoble », **Then** seule NAC140 reste.
3. **Given** aucune entreprise ne correspond, **Then** « Aucune machine réservée par une entreprise correspondant à « … » sur ces 4 semaines. »
4. **Given** je tape dans la recherche, **Then** le planning se met à jour à chaque frappe sans perdre le curseur, et l'agenda du jour ne change pas.

---

###### User Story 30 - Choisir l'agence dans « Aujourd'hui » (Priority: P2)

En tant que personnel d'agence, je veux choisir l'agence directement dans le bloc « Aujourd'hui », afin de voir ses départs et retours sans chercher le filtre plus bas.

**Independent Test**: dans le planning sans agence, choisir « Lyon Est » dans le bloc « Aujourd'hui ».

**Acceptance Scenarios**:

1. **Given** le planning sans agence, **When** je choisis « Lyon Est » dans le bloc « Aujourd'hui », **Then** les départs et retours de Lyon Est s'affichent (départ de COMP21) et le filtre Agence du planning passe aussi sur Lyon Est.
2. **Given** l'agence choisie dans le filtre du planning, **Then** le bloc « Aujourd'hui » affiche la même agence ; **When** je choisis « Toutes les agences » dans le bloc, **Then** le message invitant à choisir une agence revient et le planning montre toutes les agences.
3. **Given** un utilisateur rattaché à une agence (Sandrine), **Then** son agence est présélectionnée, comme avant.

---

###### Edge Cases

- Les réservations annulées ne sont pas trouvées par la recherche du planning (elles n'y figurent pas).
- La recherche ignore majuscules, accents et espaces autour.
- Un filtre rapide du pilotage s'ajoute aux autres filtres de la liste ; « Effacer les filtres » les retire tous.

##### Requirements *(mandatory)*

- **FR-066**: La recherche de machines DOIT accepter « Tous les types » et une référence facultative (recherche partielle, sans tenir compte des majuscules) ; sans référence, un type donne le résultat de FR-001.
- **FR-067**: Chaque statistique du pilotage DOIT ouvrir la liste correspondante : réservations filtrées (en cours ou à venir, à replacer, sorties sans photo, grands comptes, avec dégâts), atelier (alertes VGP, parc) ou planning d'une agence.
- **FR-068**: La liste des réservations DOIT accepter les filtres « En cours ou à venir », « À replacer » et un filtre rapide (sans photo, grand compte, avec dégâts), visibles et effaçables.
- **FR-069**: Le planning DOIT pouvoir être filtré par nom d'entreprise : ne garder que les machines dont une case porte ce nom, mettre ces cases en évidence et atténuer les autres.
- **FR-070**: Le bloc « Aujourd'hui » DOIT proposer le choix de l'agence ; ce choix et le filtre Agence du planning sont un seul et même réglage.

##### Success Criteria *(mandatory)*

- **SC-021**: Une machine est retrouvée par sa référence en une recherche.
- **SC-022**: Chaque chiffre du pilotage mène à son détail en un clic.
- **SC-023**: Les réservations d'une entreprise sont visibles sur 4 semaines en une saisie.

##### Assumptions

- La référence se tape librement (avec des suggestions) ; une référence partielle (« NAC1 ») est acceptée.

### `specs/006-recherche-et-navigation/plan.md`

#### Implementation Plan: Recherche et navigation

**Branch**: `001-reservation-multi-agences` | **Date**: 2026-10-09 | **Spec**: [spec.md](specs/006-recherche-et-navigation/spec.md)

##### Summary

Recherche de machines par référence, statistiques cliquables, recherche d'entreprise dans le planning. Aucune règle métier ne change : tout passe par des fonctions pures de filtrage, testées.

##### Technical Context

Identique à 001–005. **Contraintes** : 152 tests existants verts sans modification ; `ValletRules.search` et `ValletPlanning.grid` inchangés ; fichiers de moins de 350 lignes.

##### Project Structure

```text
web/src/
├── filters.js        # + searchMachines (type facultatif, référence) ; reservations : étapes « active », « toRelocate », filtre rapide « only »
├── planning.js       # + filterByClient(rows, query) — pur
├── app.js            # + showTab(tabId, cible) pour naviguer depuis le pilotage
└── ui/
    ├── search.js     # « Tous les types », champ Référence avec suggestions
    ├── reservations.js # nouvelles étapes, filtre rapide affiché et effaçable
    ├── dashboard.js  # tuiles et lignes d'occupation cliquables
    └── planning.js   # recherche d'entreprise, cases mises en évidence
web/tests/
└── navigation.test.js
```

**Décision** : les tuiles du pilotage ne calculent rien de nouveau ; elles positionnent les filtres existants (`view.reservationFilter`, `view.planningAgency`) puis ouvrent l'onglet, pour que le chiffre et la liste viennent des mêmes fonctions.

##### Complexity Tracking

Aucun écart.

### `specs/006-recherche-et-navigation/tasks.md`

#### Tasks: Recherche et navigation

**Tests**: écrits avant le code et vus en échec ; les 152 tests existants restent verts sans modification.

##### Phase 1: Fonctions pures (tests d'abord)

- [X] T501 [US27] `web/tests/navigation.test.js` puis `ValletFilters.searchMachines` dans `web/src/filters.js` : US27-1 à US27-4
- [X] T502 [US28] Tests puis `ValletFilters.reservations` : étapes « active » et « toRelocate », filtre rapide `noPhoto`, `keyAccount`, `damages` ; les nombres correspondent aux indicateurs du pilotage
- [X] T503 [US29] Tests puis `ValletPlanning.filterByClient` dans `web/src/planning.js` : US29-1 à US29-3, annulées absentes

##### Phase 2: Interface

- [X] T504 [US27] `web/src/ui/search.js` : « Tous les types », champ Référence avec suggestions, référence conservée par « Réserver ces dates »
- [X] T505 [US28] `web/src/ui/dashboard.js` et `app.showTab` dans `web/src/app.js` ; filtre rapide affiché dans `web/src/ui/reservations.js`
- [X] T506 [US29] `web/src/ui/planning.js` : champ de recherche, cases mises en évidence ; styles dans `web/styles-continuite.css`

##### Phase 3: Validation

- [X] T507 Suite `web/tests/` au vert
- [X] T508 Recettes 001 à 006 rejouées dans le navigateur après « Réinitialiser la démonstration » ; 0 erreur console ; 375 et 1366 px sans débordement
- [X] T509 Commiter et pousser

---

##### Phase 4: Agence dans « Aujourd'hui » (demande de l'équipe, 09/10/2026)

- [X] T510 [US30] Liste « Agence » dans le bloc « Aujourd'hui » de `web/src/ui/planning.js`, branchée sur `view.planningAgency` (même réglage que le filtre du planning)
- [X] T511 Rejouer les recettes 001 à 006 et US30 dans le navigateur ; commiter, pousser, régénérer `vallet-speckit-complet.md`

### `specs/006-recherche-et-navigation/checklists/requirements.md`

#### Specification Quality Checklist: Recherche et navigation

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-09
**Feature**: [spec.md](specs/006-recherche-et-navigation/spec.md)

##### Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

##### Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

##### Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

##### Notes

- No clarification needed: team request; no business rule changes, type-only search returns exactly the 001 result.
