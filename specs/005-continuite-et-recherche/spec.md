# Feature Specification: Continuité et recherche

**Feature Branch**: `001-reservation-multi-agences` (même prototype)

**Created**: 2026-10-09

**Status**: Draft

**Input**: User description: "Continue de faire progresser le site sans régressions."

## Contexte

| Besoin | Source |
|--------|--------|
| Le prototype oublie tout au rechargement : réservations, photos, signatures, journal. Un planning qui oublie ne remplace pas le fichier Excel de l'agence | Doc 3 ; décision 7 de la recherche 001, remplacée ici |
| Un client appelle pour « sa » réservation : il faut la retrouver par son nom, la machine, le numéro ou le bon de commande | Doc 2 (90 % des réservations par téléphone), Doc 6 (bons de commande) |
| Mehdi détient l'inventaire réel et suivait tout sur un tableau papier : il faut l'historique de chaque machine | Doc 5, entretien Q2 |

**Règles inchangées** : toutes celles de 001 à 004.

## User Scenarios & Testing *(mandatory)*

### User Story 24 - Conserver les données entre deux ouvertures (Priority: P1)

En tant que personnel d'agence, je veux retrouver mes réservations, photos, signatures et le journal quand je rouvre l'outil, et pouvoir remettre la démonstration à zéro, afin d'utiliser l'outil d'un jour à l'autre.

**Independent Test**: réserver COMP30, recharger la page, la réservation est toujours là ; « Réinitialiser la démonstration » remet les données de départ.

**Acceptance Scenarios**:

1. **Given** une réservation, un départ avec photo et signature, et une VGP enregistrée, **When** je recharge ou ferme puis rouvre la page, **Then** tout est retrouvé à l'identique, journal compris.
2. **Given** des données conservées, **When** je clique sur « Réinitialiser la démonstration » et confirme, **Then** les données de départ reviennent et la connexion est conservée.
3. **Given** des données conservées illisibles ou d'une version antérieure du prototype, **When** j'ouvre l'outil, **Then** il repart des données de départ sans planter.
4. **Given** le stockage du navigateur plein ou indisponible, **When** une action est enregistrée, **Then** l'outil continue de fonctionner et affiche « Les dernières modifications ne seront pas conservées après fermeture : stockage du navigateur indisponible ou plein. »
5. **Given** une photo prise au téléphone, **When** elle est ajoutée, **Then** elle est réduite (côté le plus long 1 024 px, JPEG) avant d'être conservée.

---

### User Story 25 - Retrouver une réservation (Priority: P1)

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

### User Story 26 - Fiche machine (Priority: P2)

En tant que responsable atelier, je veux ouvrir la fiche d'une machine avec son état, sa VGP, ses locations et ses dégâts cumulés, afin de remplacer mon tableau papier.

**Independent Test**: ouvrir la fiche de NAC112.

**Acceptance Scenarios**:

1. **Given** NAC112, **When** j'ouvre sa fiche, **Then** elle affiche type, agence, VGP (dernière, échéance, statut), état (disponible, à l'atelier, en vente, vendue), et ses 2 réservations avec leur étape.
2. **Given** des locations rendues avec dégâts, **Then** la fiche affiche le total des dégâts et le nombre de jours loués.
3. **Given** la fiche machine, **When** je clique une réservation, **Then** la fiche de la réservation la remplace.
4. **Given** l'onglet Atelier, le planning ou la fiche d'une réservation, **Then** la référence de la machine ouvre sa fiche.

---

### Edge Cases

- La connexion reste gérée à part (session du navigateur), comme en 001 : réinitialiser les données ne déconnecte pas.
- Les photos déjà ajoutées avant cette version (adresses temporaires du navigateur) ne survivent pas à un rechargement ; les nouvelles, si.
- La recherche ignore les majuscules, les accents et les espaces autour.

## Requirements *(mandatory)*

- **FR-059**: L'état complet (machines, réservations, demandes d'achat, notifications lues, journal) DOIT être enregistré dans le navigateur après chaque action et relu à l'ouverture.
- **FR-060**: Un enregistrement illisible, incomplet ou d'une autre version DOIT être ignoré au profit des données de départ.
- **FR-061**: L'outil DOIT proposer « Réinitialiser la démonstration », avec confirmation, qui remet les données de départ.
- **FR-062**: Un échec d'enregistrement DOIT être signalé à l'utilisateur sans bloquer l'outil.
- **FR-063**: Les photos DOIVENT être réduites à 1 024 px de côté maximum, en JPEG, avant d'être conservées.
- **FR-064**: La liste des réservations DOIT être filtrable par texte (client, machine, numéro, contact, bon de commande, agence de saisie), agence de la machine et étape, sans tenir compte des majuscules ni des accents.
- **FR-065**: L'outil DOIT afficher une fiche machine : identité, VGP, état, réservations (avec étape), jours loués et dégâts cumulés des locations rendues.

## Success Criteria *(mandatory)*

- **SC-018**: 100 % des saisies sont retrouvées après rechargement, tant que le stockage du navigateur le permet.
- **SC-019**: Une réservation est retrouvée en moins de 5 secondes à partir d'un nom, d'une machine ou d'un numéro.
- **SC-020**: L'historique d'une machine est consultable sans tableau papier.

## Assumptions

- **Stockage** : `localStorage` du navigateur, propre à chaque poste ; un partage entre agences demandera un serveur.
- **Version** : un numéro de version des données permet d'ignorer un enregistrement d'une version antérieure du prototype.
