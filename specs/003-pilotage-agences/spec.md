# Feature Specification: Pilotage des agences

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Continue de faire progresser le site pour qu'il ressemble à ce qui est demandé dans le dossier."

## Contexte

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

## User Scenarios & Testing *(mandatory)*

### User Story 13 - Planning multi-agences, semaines 41 à 44 (Priority: P1)

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

### User Story 14 - Être prévenu quand une autre agence réserve ma machine (Priority: P1)

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

### User Story 15 - Départs et retours du jour (Priority: P2)

En tant que personnel d'agence, je veux la liste des départs et des retours prévus aujourd'hui dans mon agence, avec un accès direct à l'état des lieux, afin de tenir le rush du lundi matin.

**Why this priority**: Doc 2 (15 départs le lundi) et Doc 4 (photos au départ).

**Independent Test**: au 12/10 à Lyon Est, voir le départ de COMP21 (M. Pereira).

**Acceptance Scenarios**:

1. **Given** le 12/10 à Lyon Est, **When** j'ouvre le planning, **Then** « Aujourd'hui à Lyon Est » liste 1 départ (COMP21, M. Pereira) et 0 retour, avec un bouton qui ouvre la fiche pour l'état des lieux.
2. **Given** le départ de COMP21 enregistré, **When** je reviens au planning, **Then** il apparaît comme fait et le retour du jour est attendu.

---

### User Story 16 - Grands comptes : fiche client, bon de commande, attestation envoyée (Priority: P2)

En tant que commerciale grands comptes, je veux que les grands comptes soient reconnus à la réservation, que leur bon de commande soit noté et que l'attestation VGP leur soit envoyée automatiquement au départ d'une nacelle, afin qu'ils n'aient plus à la réclamer.

**Why this priority**: 70 % du chiffre d'affaires (Doc 6).

**Independent Test**: réserver pour BTP Rhone avec un bon de commande, enregistrer le départ de NAC112, voir l'attestation envoyée.

**Acceptance Scenarios**:

1. **Given** l'annuaire des grands comptes (BTP Rhone), **When** je saisis « BTP Rhone » ou « BTP Rhône » comme client, **Then** l'outil le reconnaît comme grand compte et propose le champ « Bon de commande ».
2. **Given** une réservation de grand compte sans bon de commande, **When** je l'enregistre, **Then** elle est acceptée mais signalée « Bon de commande à fournir » dans sa fiche.
3. **Given** une nacelle louée à un grand compte, **When** le départ est enregistré, **Then** la fiche indique « Attestation VGP envoyée à conducteurs@btp-rhone.fr le … » (envoi simulé).
4. **Given** un client particulier ou une machine qui n'est pas une nacelle, **When** le départ est enregistré, **Then** aucune attestation n'est envoyée.

---

### User Story 17 - Espace grands comptes : disponibilités et attestations (Priority: P2)

En tant que conducteur de travaux d'un grand compte, je veux me connecter pour voir les disponibilités en temps réel, mes réservations et mes attestations VGP, sans réserver moi-même, afin de ne plus appeler l'agence pour savoir.

**Why this priority**: demande récurrente des conducteurs de travaux (Doc 6) ; les grands comptes passent par des bons de commande et ne réservent pas « comme un particulier », donc pas de réservation en libre-service.

**Independent Test**: se connecter avec le compte de démonstration BTP Rhone.

**Acceptance Scenarios**:

1. **Given** le compte de démonstration du conducteur de travaux de BTP Rhone, **When** il se connecte, **Then** il arrive dans un espace client qui affiche son entreprise, ses réservations (NAC112 du 14 au 18/10, NAC140 du 19 au 23/10) avec leur étape, et rien des autres clients.
2. **Given** l'espace client, **When** il cherche un type et des dates, **Then** il voit les machines disponibles et leur agence, sans bouton de réservation, avec « Pour réserver, contactez Julie Ferrand, votre commerciale ».
3. **Given** une réservation de nacelle, **When** il ouvre l'attestation VGP, **Then** il obtient l'attestation imprimable de 002.

---

### User Story 18 - Tableau de bord de la direction (Priority: P3)

En tant que directeur, je veux un tableau de bord des indicateurs du dossier, afin de suivre les effets de l'outil et de les montrer au salon.

**Why this priority**: Doc 1 (salon de fin novembre), entretien Q7 (démonstration fonctionnelle).

**Independent Test**: ouvrir le tableau de bord avec les données de départ.

**Acceptance Scenarios**:

1. **Given** les données de départ, **When** j'ouvre le tableau de bord, **Then** il affiche : réservations en cours ou à venir (7), réservations à replacer (2), nacelles en alerte VGP (2), machines à l'atelier (1), sorties sans photo (1), part des réservations grands comptes (2 sur 7).
2. **Given** des retours avec dégâts, **When** j'ouvre le tableau de bord, **Then** il affiche le montant des dégâts refacturés (retenu sur caution + reste à facturer), à comparer aux 85 000 € perdus l'an dernier (Doc 4).
3. **Given** le tableau de bord, **Then** il affiche l'occupation de chaque agence sur les semaines 42 à 44 (jours réservés / jours disponibles).

---

### Edge Cases

- Une réservation « rendue » n'apparaît plus dans le planning après sa date de retour.
- Une machine vendue n'apparaît plus dans le planning.
- Une réservation saisie par l'agence propriétaire de la machine ne génère pas de notification.
- La reconnaissance d'un grand compte ignore les majuscules, les accents et les espaces autour.
- Le compte client ne voit jamais le nom des autres clients, ni dans ses réservations ni dans les disponibilités.

## Requirements *(mandatory)*

### Functional Requirements

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

### Key Entities

- **Grand compte** : nom, e-mail des conducteurs de travaux, commerciale référente.
- **Compte client** (fictif) : e-mail, mot de passe de démonstration, nom affiché, grand compte associé.
- **Notification** : clé stable, agence destinataire, texte, réservation liée, lue ou non.
- **Réservation** (ajouts) : grand compte associé éventuel, bon de commande, attestation envoyée (e-mail, date).

## Success Criteria *(mandatory)*

- **SC-010**: Une agence voit en un écran l'occupation de toutes ses machines sur 4 semaines, sans fichier Excel (Doc 3).
- **SC-011**: 100 % des réservations prises par une autre agence sur une machine sont notifiées à l'agence propriétaire (Doc 2).
- **SC-012**: 100 % des départs de nacelles louées à un grand compte ont une attestation VGP envoyée (Doc 6).
- **SC-013**: Un conducteur de travaux connaît la disponibilité sans appeler (Doc 6).

## Assumptions

- **Annuaire** : le dossier ne nomme qu'un grand compte, BTP Rhone (Doc 6) ; c'est le seul de l'annuaire de démonstration. Son e-mail de conducteurs (conducteurs@btp-rhone.fr) et le compte client sont fictifs.
- **Envoi** : l'envoi d'e-mail est simulé ; aucun message ne part.
- **Tarifs négociés** : le dossier n'en donne pas ; ils restent dans le logiciel de facturation.
- **Occupation** : jours réservés ou sortis ÷ (machines non vendues × jours de la période), par agence de la machine.
