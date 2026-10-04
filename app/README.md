# Pimou — app mobile (Expo / React Native)

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

- Onboarding (3 écrans + passeports des enfants), puis guide interactif « Comment ça marche » (6 démos à manipuler, dont affichage et taille du texte, revoir depuis le profil)
- **Accueil « par enfant »** (direction 1c) : un flux par passeport, à sa taille, trié selon ses couleurs préférées, avec rappel d'anniversaire et option « taille au-dessus »
- **Passeport enfant** : prénom, avatar, naissance (âge calculé), taille portée, cm, pointure, couleurs, style, petits mots. Conservé sur l'appareil.
- **Prix négociables** : « Faire une offre », contre-offre du vendeur dans la messagerie, prix négocié appliqué au panier. Le vendeur peut refuser les offres sur son annonce.
- **Il grandit** : alerte quand un enfant approche de la taille suivante (≤ 3 mois), sur l'accueil, le passeport et les notifications
- **Garde-robe de saison** par enfant (liste automne-hiver / printemps-été), « Trouver » lance la recherche, les achats cochent la liste
- **Badges** « Parent vérifié » (vérification du compte dans Réglages, simulée) et « Lavé et plié » (promis par le vendeur, confirmé par l'acheteur à la réception)
- **Guide des états** (de « Neuf avec étiquette » à « Satisfaisant »), accessible depuis la fiche, la vente et le profil
- **Près de chez toi** : distance du vendeur, filtre « moins de 2 / 5 / 10 km », lieux sûrs proposés pour la remise en main propre
- **Compteur d'impact** : vêtements sauvés, estimations CO₂ et eau, paliers
- **Mode sombre** (clair par défaut, ou sombre / automatique) et **taille du texte** (normal / grand / très grand) dans Réglages
- Recherche + filtres (âge, distance, fille/garçon, saison, état, prix, marque, couleur), Tout / Pièces / Lots
- Fiche pièce ou lot (contenu du lot, prix à la pièce), profil vendeur (dressing, avis, suivre)
- Vendre en 4 étapes (type, photos, description, prix avec montant reçu, modes de livraison)
- Panier groupé par vendeur, paiement (point relais / domicile / main propre, carte / Apple Pay)
- Messagerie avec réponses rapides, favoris, mes achats / ventes, suivi de commande + notation, notifications

## Structure

```
src/app/          routes Expo Router (tabs : home, search, messages, profile ; + écrans empilés)
src/components/   UI partagée (ui.tsx, products.tsx, Screen, FilterSheet, OfferSheet, Logo, KidAvatar, home/Home1c)
src/store/        état Zustand (passeports, panier, offres, favoris, filtres, annonces, conversations, commandes)
src/lib/kids.ts   âge, taille et anniversaire à partir du passeport
src/data/         catalogue de démo (repris du prototype)
src/theme/        tokens Organic (couleurs, polices, ombres)
```

## À brancher ensuite

- **Photos** : les visuels sont des rayures de remplacement (`Stripes`). Les remplacer par de vraies images (avec `expo-image-picker` dans l'étape « photos »).
- **Back-end** : tout est local et en mémoire (données de démo). Paiement, messagerie, réponses aux offres et suivi sont simulés (« Démo : passer à l'étape suivante »).
