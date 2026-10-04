# Nidoo — app mobile (Expo / React Native)

Marketplace de vêtements d'enfants 0-10 ans entre parents : pièces uniques ou lots à prix fixe.
Implémentation du design Claude Design `project/Nidoo Directions.dc.html` (système Organic).

## Lancer

```bash
cd app
npm install
npx expo start        # puis i (simulateur iOS), a (Android) ou scanner le QR avec Expo Go
npx expo start --web  # aperçu navigateur
npm run typecheck
```

## Ce qui est inclus

- Onboarding (3 écrans + âges des enfants)
- **Accueil en 3 directions** : 1a Classique, 1b Éditorial, 1c Par enfant. Se choisit dans Profil › Réglages, avec la commission vendeur (8 % par défaut). Les réglages sont conservés sur l'appareil.
- Recherche + filtres (âge, fille/garçon, saison, état, prix, marque, couleur), Tout / Pièces / Lots
- Fiche pièce ou lot (contenu du lot, prix à la pièce), profil vendeur (dressing, avis, suivre)
- Vendre en 4 étapes (type, photos, description, prix avec net après commission, modes de livraison)
- Panier groupé par vendeur, paiement (point relais / domicile / main propre, carte / Apple Pay)
- Messagerie avec réponses rapides, favoris, mes achats / ventes, suivi de commande + notation, notifications

## Structure

```
src/app/          routes Expo Router (tabs : home, search, messages, profile ; + écrans empilés)
src/components/   UI partagée (ui.tsx, products.tsx, Screen, FilterSheet, home/Home1a|1b|1c)
src/store/        état Zustand (panier, favoris, filtres, annonces, conversations, commandes)
src/data/         catalogue de démo (repris du prototype)
src/theme/        tokens Organic (couleurs, polices, ombres)
```

## À brancher ensuite

- **Photos** : les visuels sont des rayures de remplacement (`Stripes`). Les remplacer par de vraies images (avec `expo-image-picker` dans l'étape « photos »).
- **Back-end** : tout est local et en mémoire (données de démo). Paiement, messagerie et suivi sont simulés (« Démo : passer à l'étape suivante »).
