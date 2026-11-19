# 🏡 BudgetColoc — édition colorée

Projet pédagogique L3 MIAGE : Valérie, Amandine, Yassine, Maya, Jihad.

## Démarrer
Ouvrir `index.html` dans un navigateur ou publier les fichiers à la racine du dépôt GitHub Pages.

## Fonctionnalités
- Compte commun virtuel et charges mensuelles, responsable désigné
- Dépenses ponctuelles réparties entre les participants
- Dettes détaillées et validation des remboursements
- **Cartes de profils cliquables** : dettes dues, créances, charges sous responsabilité, remboursements validés
- Bouton de réinitialisation des données

## Attention
Les données restent dans le `localStorage` du navigateur. Aucune synchronisation entre appareils et aucun mouvement bancaire réel. Les profils sont des vues partagées, **pas des comptes privés ni une authentification**. Les charges mensuelles affichées sur la fiche sont celles dont la personne est responsable ; les dettes montrent les parts qu'elle doit rembourser pour les charges payées.

## Mise à jour de GitHub Pages
Remplacer à la racine du dépôt les quatre fichiers `index.html`, `style.css`, `script.js`, `README.md`. Après le commit, patienter jusqu'au déploiement dans Actions, puis recharger le site avec Ctrl+F5. La clé de stockage est inchangée (`budgetcoloc-v3`) : les données locales existantes sont conservées.
