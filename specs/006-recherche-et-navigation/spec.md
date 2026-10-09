# Feature Specification: Recherche et navigation

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Dans la première page, pouvoir filtrer par référence en plus des modèles ; sur la page des stats, pouvoir cliquer sur les stats ; dans le planning, rechercher le nom des entreprises. Sans régression."

## Contexte

Demande de l'équipe projet. Elle prolonge des besoins du dossier : un client qui rappelle pour « sa » machine (Doc 2), le suivi des grands comptes comme BTP Rhone (Doc 6), le pilotage par la direction (Doc 1).

**Règles inchangées** : toutes celles de 001 à 005. La recherche par type seul donne exactement les mêmes résultats qu'avant.

## User Scenarios & Testing *(mandatory)*

### User Story 27 - Chercher par référence (Priority: P1)

En tant que personnel d'agence, je veux chercher une machine par sa référence, avec ou sans type, afin de répondre au client qui donne le numéro de la machine.

**Independent Test**: chercher « nac1 » sur tous les types du 16 au 17/10.

**Acceptance Scenarios**:

1. **Given** le type « Nacelle 12 m » et aucune référence, **When** je cherche du 16 au 17/10, **Then** le résultat est identique à celui de 001 (NAC140 disponible ; NAC112 et NAC118 indisponibles).
2. **Given** « Tous les types » et la référence « nac1 » (majuscules ou non), **When** je cherche du 16 au 17/10, **Then** seules NAC112, NAC140 et NAC118 apparaissent, avec leur disponibilité.
3. **Given** « Tous les types » et aucune référence, **When** je cherche, **Then** toutes les machines non vendues apparaissent, chacune avec son type.
4. **Given** le type « Nacelle 12 m » et la référence « COMP », **When** je cherche, **Then** « Aucune machine ne correspond à ce type et à cette référence. »
5. **Given** un résultat obtenu par référence, **When** je réserve ou clique « Réserver ces dates », **Then** la réservation fonctionne comme avant et la référence reste dans la recherche.

---

### User Story 28 - Cliquer sur les statistiques du pilotage (Priority: P1)

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

### User Story 29 - Chercher une entreprise dans le planning (Priority: P1)

En tant que commerciale grands comptes, je veux taper le nom d'une entreprise dans le planning et ne voir que les machines qu'elle a réservées, ses jours mis en évidence, afin de répondre au client d'un coup d'œil.

**Independent Test**: taper « btp » dans le planning.

**Acceptance Scenarios**:

1. **Given** le planning, **When** je tape « btp » (ou « BTP Rhône »), **Then** seules NAC112 et NAC140 restent, et les jours de BTP Rhone sont mis en évidence, les autres atténués.
2. **Given** une recherche combinée avec le filtre agence « Grenoble », **Then** seule NAC140 reste.
3. **Given** aucune entreprise ne correspond, **Then** « Aucune machine réservée par une entreprise correspondant à « … » sur ces 4 semaines. »
4. **Given** je tape dans la recherche, **Then** le planning se met à jour à chaque frappe sans perdre le curseur, et l'agenda du jour ne change pas.

---

### User Story 30 - Choisir l'agence dans « Aujourd'hui » (Priority: P2)

En tant que personnel d'agence, je veux choisir l'agence directement dans le bloc « Aujourd'hui », afin de voir ses départs et retours sans chercher le filtre plus bas.

**Independent Test**: dans le planning sans agence, choisir « Lyon Est » dans le bloc « Aujourd'hui ».

**Acceptance Scenarios**:

1. **Given** le planning sans agence, **When** je choisis « Lyon Est » dans le bloc « Aujourd'hui », **Then** les départs et retours de Lyon Est s'affichent (départ de COMP21) et le filtre Agence du planning passe aussi sur Lyon Est.
2. **Given** l'agence choisie dans le filtre du planning, **Then** le bloc « Aujourd'hui » affiche la même agence ; **When** je choisis « Toutes les agences » dans le bloc, **Then** le message invitant à choisir une agence revient et le planning montre toutes les agences.
3. **Given** un utilisateur rattaché à une agence (Sandrine), **Then** son agence est présélectionnée, comme avant.

---

### Edge Cases

- Les réservations annulées ne sont pas trouvées par la recherche du planning (elles n'y figurent pas).
- La recherche ignore majuscules, accents et espaces autour.
- Un filtre rapide du pilotage s'ajoute aux autres filtres de la liste ; « Effacer les filtres » les retire tous.

## Requirements *(mandatory)*

- **FR-066**: La recherche de machines DOIT accepter « Tous les types » et une référence facultative (recherche partielle, sans tenir compte des majuscules) ; sans référence, un type donne le résultat de FR-001.
- **FR-067**: Chaque statistique du pilotage DOIT ouvrir la liste correspondante : réservations filtrées (en cours ou à venir, à replacer, sorties sans photo, grands comptes, avec dégâts), atelier (alertes VGP, parc) ou planning d'une agence.
- **FR-068**: La liste des réservations DOIT accepter les filtres « En cours ou à venir », « À replacer » et un filtre rapide (sans photo, grand compte, avec dégâts), visibles et effaçables.
- **FR-069**: Le planning DOIT pouvoir être filtré par nom d'entreprise : ne garder que les machines dont une case porte ce nom, mettre ces cases en évidence et atténuer les autres.
- **FR-070**: Le bloc « Aujourd'hui » DOIT proposer le choix de l'agence ; ce choix et le filtre Agence du planning sont un seul et même réglage.

## Success Criteria *(mandatory)*

- **SC-021**: Une machine est retrouvée par sa référence en une recherche.
- **SC-022**: Chaque chiffre du pilotage mène à son détail en un clic.
- **SC-023**: Les réservations d'une entreprise sont visibles sur 4 semaines en une saisie.

## Assumptions

- La référence se tape librement (avec des suggestions) ; une référence partielle (« NAC1 ») est acceptée.
