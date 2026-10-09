# Research: Réservation multi-agences

## 1. Forme du prototype

- **Decision**: page HTML statique, scripts classiques, sans compilation ni dépendance, ouverte par double-clic sur `web/index.html`.
- **Rationale**: les consignes demandent un prototype qui démarre à 10 h 15 et précisent qu'« une simple page web suffit ». Le poste n'a ni Node ni PHP. Les modules ES sont bloqués en `file://` par les navigateurs, d'où des scripts classiques.
- **Alternatives considered**: Nuxt (défaut Xefi pour `web`) : build et serveur nécessaires, disproportionné pour une démo d'une matinée. Laravel + Livewire : pas de PHP sur le poste. Page servie par un conteneur : un point de panne de plus le jour de la démo.

## 2. Où vivent les règles

- **Decision**: `web/src/rules.js` contient uniquement des fonctions pures (entrée : état + demande ; sortie : résultat). Il expose un objet global `ValletRules` dans le navigateur et `module.exports` sous Node.
- **Rationale**: les consignes pénalisent les régressions (« une règle qui n'est écrite que dans une conversation avec l'IA disparaît »). Des tests automatiques sur chaque scénario de la spec protègent les règles quand on corrige le prototype à l'étape 4.
- **Alternatives considered**: règles mêlées au code d'affichage : impossibles à tester sans navigateur.

## 3. Tests

- **Decision**: `node --test 'web/tests/*.test.js'` dans `node:22-alpine` via Docker.
- **Rationale**: `node:test` est intégré à Node, donc aucune dépendance à installer ; Docker est déjà en place sur le poste.
- **Alternatives considered**: Jest, Vitest : nécessitent `npm install`. Tests manuels seuls : ne protègent pas des régressions.

## 4. Dates

- **Decision**: dates manipulées comme chaînes ISO `AAAA-MM-JJ`, comparées en ordre lexicographique ; affichage `JJ/MM/AAAA`. Date du jour lue dans `data.js` (`2026-10-12`), jamais depuis l'horloge.
- **Rationale**: aucune ambiguïté de fuseau horaire ; la comparaison de chaînes ISO est exacte pour des dates sans heure ; la date figée est exigée par les consignes.
- **Alternatives considered**: objets `Date` : décalages de fuseau possibles au passage à minuit.

## 5. Échéance VGP

- **Decision**: échéance = date de dernière VGP + 6 mois calendaires, échéance comprise. Si le jour n'existe pas dans le mois d'arrivée (31/08 + 6 mois), on prend le dernier jour du mois.
- **Rationale**: clarification Q1 (6 mois, valide le jour du départ). Exemples : 15/04/2026 → 15/10/2026 ; 05/03/2026 → 05/09/2026.

## 6. Statut « à replacer »

- **Decision**: le statut n'est pas stocké, il est recalculé à chaque affichage. On parcourt les réservations dans l'ordre de saisie ; une réservation est « à replacer » si elle chevauche une réservation déjà gardée sur la même machine, si la nacelle n'a pas de VGP valide le jour du départ, ou si la machine est à l'atelier sur une partie de la période. Sinon elle est gardée.
- **Rationale**: un seul endroit décide ; le statut reste juste après un blocage atelier (FR-012) ou un transfert (FR-015), sans risque d'oubli de mise à jour.
- **Alternatives considered**: statut stocké sur la réservation : doit être tenu à jour à chaque action, source classique d'incohérence.

## 7. Persistance

> Remplacée le 09/10/2026 par la feature 005 : l'état est désormais conservé dans le navigateur (`localStorage`), avec un bouton « Réinitialiser la démonstration » dans l'onglet Pilotage pour retrouver les scénarios reproductibles.

- **Decision**: aucune ; l'état vit en mémoire.
- **Rationale**: le prototype sert une recette de 8 minutes par binôme ; repartir des données de départ à chaque rechargement rend les scénarios de Brice reproductibles. La spec ne demande pas de conserver les saisies.
- **Alternatives considered**: `localStorage` : des réservations de test persisteraient d'une recette à l'autre.

## 8. Connexion fictive (US5)

- **Decision**: comptes de démonstration dans `web/src/data.js` ; vérification par une fonction pure `ValletAuth.authenticate(users, email, password)` dans `web/src/auth.js`, testée sous Node ; l'e-mail de l'utilisateur connecté est gardé en `sessionStorage` (lecture et écriture protégées par `try/catch`, l'outil marche sans).
- **Rationale**: une vraie authentification exige un serveur, hors de portée du prototype. `sessionStorage` garde la connexion au rechargement sans la garder d'un jour à l'autre, et fonctionne en `file://`.
- **Alternatives considered**: `localStorage` : la connexion survivrait à la fermeture du navigateur, ce qui gêne l'enchaînement des binômes. Pas de mot de passe (choix d'un profil) : moins réaliste pour la démonstration demandée.

## 9. Charte graphique

- **Decision**: couleurs de la charte XEFI relevées sur xefi.com (rouge `#E10600`, anthracite `#2B2D42`, gris `#F8F8F8` / `#EBEBEB`), police Montserrat chargée depuis Google Fonts avec repli sur les polices système si le poste est hors ligne ; icônes en SVG intégré, sans fichier externe.
- **Rationale**: demande de l'équipe projet ; le repli garantit que la page s'affiche correctement sans réseau le jour de la démo.
