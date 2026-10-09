# Contract: écrans de `web/index.html`

En-tête permanent : « Vallet Location — Réservations » et « Aujourd'hui : lundi 12 octobre 2026 ». Trois onglets. Textes en français, vouvoiement, boutons nommés par leur action.

## Onglet « Rechercher et réserver » (US1, US2)

- Champs : **Type de machine** (liste des 7 types), **Du**, **Au** (dates, par défaut aujourd'hui).
- Bouton : « Rechercher ». Une période incomplète, qui commence avant aujourd'hui ou qui finit avant de commencer affiche « Refusé : » et le motif, sans résultat.
- Résultat « Disponibles » : référence, type, agence, et un bouton « Réserver » par machine.
- Réserver ouvre sous la machine : **Client**, **Agence qui saisit** (7 agences), bouton « Confirmer la réservation de NAC140 ». Les dates sont celles de la recherche.
- Succès : message « NAC140 réservée pour BTP Rhone du 16/10/2026 au 17/10/2026. », et les résultats sont recalculés.
- Refus : les messages de [rules-api.md](rules-api.md) s'affichent au-dessus du bouton, et rien n'est enregistré.
- Résultat « Indisponibles » : référence, agence, et la ou les raisons.
- Aucun disponible : « Aucune machine de ce type n'est disponible du … au …. »

## Onglet « Réservations » (US4)

- Bloc « À replacer » en tête, avec le nombre entre parenthèses. Pour chaque réservation : client, machine, dates, motif(s), puis un bouton « Transférer sur NAC140 » par alternative, ou « Aucune autre machine de ce type n'est disponible sur ces dates. ».
- Tableau de toutes les réservations triées par date de début : machine, type, agence de la machine, client, du, au, saisie par, statut (« OK » ou « À replacer »).

## Onglet « Atelier » (US3)

- Tableau du parc : référence, type, agence, échéance VGP (nacelles, suivie de « (échue) » si elle est passée au 12/10/2026), état (« Disponible » ou « À l'atelier jusqu'au … »).
- Machine disponible : champs **Jusqu'au** et **Motif**, bouton « Immobiliser NAC112 ».
- Machine à l'atelier : bouton « Remettre en service MINI07 ».
- Après un blocage qui touche des réservations : « 1 réservation à replacer : voir l'onglet Réservations. »

## Écran de connexion (US5)

- Plein écran, avant tout onglet. Champs **E-mail** et **Mot de passe**, bouton « Se connecter ».
- Bloc « Comptes de démonstration » : un bouton par compte (nom et rôle), qui remplit l'e-mail et le mot de passe ; mot de passe commun affiché.
- Échec : « E-mail ou mot de passe incorrect. ».

## En-tête une fois connecté

- Nom de l'outil, date du jour, puis l'utilisateur : initiales en pastille, nom, « rôle · agence », bouton « Se déconnecter ».

## Charte

- Couleurs XEFI (rouge `#E10600`, anthracite `#2B2D42`), Montserrat, icônes SVG intégrées dans les onglets. Aucune autre fonction ajoutée.
