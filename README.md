# BudgetColoc — prototype L3 MIAGE

Application pédagogique de gestion d'une colocation pour **Valérie, Amandine, Yassine, Maya et Jihad**.

## Fonctionnalités
- Charges mensuelles : un responsable avance la totalité sur un compte commun **virtuel**, puis la facture est débitée ; les autres lui doivent leur part.
- Dépenses ponctuelles payées personnellement et partagées entre les participants sélectionnés.
- Dettes détaillées (qui doit combien, à qui et pour quelle dépense), total dû et total à recevoir par colocataire.
- Confirmation manuelle des remboursements, historique, données d'exemple et export JSON.

## Démarrer
Ouvrir `index.html` dans un navigateur. Aucun serveur ni installation nécessaires.

## Publier avec GitHub Pages
1. Créer un dépôt GitHub public nommé `budgetcoloc`.
2. Envoyer `index.html`, `style.css`, `script.js` et `README.md` **à la racine** du dépôt.
3. `Settings` → `Pages` → `Deploy from a branch` → branche `main` → dossier `/ (root)` → `Save`.
4. Ouvrir `https://VOTRE-PSEUDO.github.io/budgetcoloc/` après le déploiement.

## Scénario de démonstration
Cliquer sur **Charger l'exemple** : électricité de 100 € avancée par Valérie et courses de 75 € payées par Maya. Vérifier le tableau des dettes et le bilan individuel. Marquer une dette remboursée et vérifier l'actualisation des totaux.

## Limites
- Aucun vrai paiement ni connexion bancaire ; le « compte commun » est une simulation.
- Stockage local (`localStorage`) : **pas de synchronisation entre appareils**, ni authentification.
- Répartition à parts égales entre participants, arrondie au centime ; pas de parts personnalisées.
- Les charges sont déclenchées manuellement une fois par mois, et non automatiquement.
- Le solde du compte commun et les dettes entre personnes sont deux calculs distincts.
- Ne pas utiliser avec des données financières réelles ou sensibles.
