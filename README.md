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
