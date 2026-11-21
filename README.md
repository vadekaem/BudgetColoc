# BudgetColoc — deux pages

Application de gestion de budget entre colocataires, projet L3 MIAGE.

## Pages
- `index.html` : compte commun virtuel, charges mensuelles, dépenses ponctuelles, profils et dettes.
- `budget.html` : revenus disponibles, calcul automatique des charges fixes, budget variable, enveloppes et graphique.

Les deux pages utilisent `script.js` et le même stockage local (`budgetcoloc-v3`). Les données restent sur le navigateur de l’ordinateur utilisé, sans synchronisation entre appareils.

## Mise en ligne
Déposer **les cinq fichiers** à la racine du dépôt GitHub Pages : `index.html`, `budget.html`, `style.css`, `script.js`, `README.md`.

Ne pas supprimer `budget.html` : la navigation y renvoie.

## Loyers individuels et budget
Dans budget.html, chaque colocataire peut saisir son loyer propre et ses autres charges personnelles. Le budget variable est calculé automatiquement : somme des revenus mensuels - loyers individuels - autres charges personnelles - charges fixes communes de la page principale. Les loyers individuels ne créent aucune dette ni opération bancaire.


## Contributions réalistes
La répartition égalitaire ou proportionnelle est plafonnée à la capacité de chaque colocataire (revenu moins loyer et charges personnelles). Tout manque de financement est signalé, sans créer de dette. Les enveloppes sont des prévisions.


## Mode démonstration

Sur chacune des deux pages, utiliser **🎬 Mode démonstration** pour charger un jeu fictif de cinq étudiants (revenus, loyers individualisés, dépenses personnelles, charges fixes, dépenses ponctuelles et dettes). Les données de démonstration sont sauvegardées séparément sous `budgetcoloc-demo-v1` et n'écrasent jamais les données manuelles (`budgetcoloc-v3`). Le choix du mode est mémorisé dans `budgetcoloc-active-mode` et fonctionne sur les deux pages. **✍️ Mode manuel** revient aux données personnelles, sans les modifier. **↻ Recharger les exemples** remet uniquement le scénario de démonstration à zéro après confirmation. Les données restent locales au navigateur et ne sont pas partagées entre ordinateurs.

## Démonstration et échéances
Au chargement des exemples, les charges dont la date d’échéance est passée dans le mois courant sont enregistrées comme payées (versement, prélèvement et dettes correspondantes). Les échéances futures restent impayées. Pour appliquer la correction à une démonstration déjà chargée, cliquer sur « Recharger les exemples » en mode démonstration.


## Scénario de démonstration — situation au 8 du mois
Les quatre responsables virent automatiquement leur provision sur le compte commun le 5 du mois. Au 8, l’assurance (5) et Internet (8) sont prélevés ; l’électricité (10) et l’eau (12) restent à prélever. Le solde du compte correspond donc aux provisions en attente (143 €). La démonstration est un instantané fictif au 8, quel que soit le jour réel de présentation. Le bouton de paiement détecte les versements déjà effectués pour éviter de les compter deux fois. Cliquer sur « Recharger les exemples » pour réinitialiser ce scénario.

## Mise à jour — colocataires et disponibilités
- Ajouter un colocataire, supprimer un colocataire sans opération liée.
- Correction du prénom Yasmine avec migration des sauvegardes Yassine.
- Disponible actuel : revenu - loyer - frais personnels - avances et achats + remboursements reçus - remboursements versés.
- Après remboursements : disponible actuel - dettes ouvertes + créances ouvertes.
- Ces indicateurs sont des estimations et non des soldes bancaires.
\n## Recommandation pour les prochaines courses\nSaisir un montant estimé sur la page Gestion ou Budget. La recommandation classe les colocataires par disponibilité actuelle, vérifie qu’ils peuvent avancer le montant, et affiche leur reste avant et après remboursements. Aucun paiement n’est créé.\n
## Budget & Prévisions — lisibilité et suivi des contributions
La répartition des contributions est placée sous les enveloppes afin de supprimer le grand vide. Le tableau récapitulatif compare pour chaque personne la contribution prévue, les montants sortants enregistrés ce mois, le reste à contribuer, le disponible actuel et le disponible après remboursements. Les avances sont comptées au titre du suivi indicatif des contributions, sans créer de nouvelle opération.

## Correctifs de répartition (21 novembre)
- Sélecteur égalitaire/proportionnel repositionné au-dessus des contributions prévues.
- La page Gestion utilise les mêmes contributions calculées et le même mode enregistré que la page Budget ; synchronisation des onglets ouverts.
- La recommandation courses privilégie le colocataire ayant le plus de contribution prévue restant à couvrir, sous réserve d'une disponibilité actuelle suffisante.
- Les dépenses et remboursements enregistrés restent pris en compte. Aucun paiement automatique.

Synchronisation corrigée : changement de mode enregistre aussi les valeurs du formulaire avant recalcul ; actualisation au retour sur chaque page, et cache JavaScript invalidé. Pour tester, ouvrir les deux pages sur le même domaine GitHub Pages et dans le même navigateur/mode.

## Progression des contributions sur la page Gestion
Les tableaux de budgets individuels et la recommandation pour les prochaines courses sont exclusivement dans Budget & Prévisions. La page Gestion affiche dans chaque carte une barre : avances et versements enregistrés ce mois / contribution prévue, recalculée suivant le mode égalitaire ou proportionnel sauvegardé. La barre est plafonnée à 100 %, et les dépassements restent indiqués.


## Correction v4 — revenus synchronisés
Les revenus, loyers et frais personnels sont sauvegardés automatiquement après saisie (350 ms) et au changement de champ. Les contributions prévues et les barres de progression se recalculent depuis ces valeurs sauvegardées. Les deux pages doivent être ouvertes sur la même origine et dans le même mode (manuel/démo).

## V5 — cohérence entre les deux pages
- Toutes les charges mensuelles ajoutées dans Gestion sont prises en compte dans le total des charges récurrentes sur Budget, même si leur catégorie est Courses/Loisirs/etc.
- Les barres de progression et la répartition de la page Budget appellent désormais exactement la même fonction `calculatePlannedContributions()`.
- Les deux pages relisent les données sauvegardées à chaque retour (pageshow/focus).
- Les charges mensuelles et les enveloppes variables sont deux budgets distincts : éviter de prévoir la même dépense dans les deux.

## V6 — corrections de synchronisation
- Les charges mensuelles saisies sur Gestion figurent toutes dans « Charges fixes prévues » de Budget, avec recalcul immédiat du total et de la répartition lors de l'ouverture de Budget.
- La répartition affichée dans Budget et l'objectif des barres sur Gestion proviennent de la même fonction `currentContributionAllocation()`.
- Le mode égalitaire/proportionnel est stocké dans les données du mode manuel ou démo actif ; plus de mode global concurrent qui écrase le choix.
- La page est actualisée à chaque retour (`pageshow`), focus et changement de visibilité.
- Ne pas compter deux fois une charge mensuelle dans une enveloppe variable.

## V7 : retour au mode manuel
Lors du retour depuis la démonstration, une confirmation propose de remettre toutes les données manuelles à zéro (y compris le budget). Annuler conserve les anciennes données. Le mode démo reste isolé.

## V8 : charges fixes
- Une charge ajoutée sur Gestion avec la catégorie « Charges fixes » figure dans « Charges fixes prévues » sur Budget.
- Le montant total et la répartition sont recalculés lors de chaque affichage de Budget, à partir du stockage local du mode actif.
- Les charges des autres catégories ne figurent pas dans la liste des charges fixes : elles restent visibles sur Gestion.
- IMPORTANT : vérifier que les deux pages sont sur le même site/origine et dans le même mode (manuel ou démonstration).
- Les changements ne se synchronisent pas entre un fichier local (`file://`) et GitHub Pages, ni entre deux navigateurs différents.
