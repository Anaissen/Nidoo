# Pimou — app mobile (Expo / React Native)

Marketplace de vêtements d'enfants 0-10 ans entre parents : pièces uniques ou lots, pour les parents et pour offrir.
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

- Onboarding (3 écrans illustrés, **création de compte** ou connexion, passeports des enfants), puis guide interactif « Comment ça marche » (6 démos à manipuler, dont affichage et taille du texte, revoir depuis le profil)
- **Compte** : prénom, nom, e-mail, téléphone, adresse, mot de passe ; « Mes informations » dans le profil, déconnexion, bouton « Connexion » en haut de l'accueil. Acheter, vendre et faire une offre demandent d'être connecté. Comptes et passeports enregistrés sur **Supabase** (voir `supabase/schema.sql`, à lancer une fois dans le SQL Editor).
- **Accueil « par enfant »** (direction 1c) : un flux par passeport, à sa taille, trié selon ses couleurs préférées, avec rappel d'anniversaire et option « taille au-dessus »
- **Passeport enfant** : prénom, avatar, date de naissance complète (âge calculé), taille portée, cm, pointure, couleurs, style, petits mots. Conservé sur l'appareil.
- **Sans enfant** : « 🎁 Pour offrir » sur l'accueil pour dénicher à toutes les tailles sans passeport
- Confirmation / saisie de l'adresse à domicile au paiement (les vrais bordereaux d'envoi sont dans la feuille de route)
- **Prix négociables** : « Faire une offre », contre-offre du vendeur dans la messagerie, prix négocié appliqué au panier. Le vendeur peut refuser les offres sur son annonce.
- **Il grandit** : alerte quand un enfant approche de la taille suivante (≤ 3 mois), sur l'accueil, le passeport et les notifications
- **Garde-robe de saison** par enfant (liste automne-hiver / printemps-été), « Trouver » lance la recherche, les achats cochent la liste
- **Badges** « Parent vérifié » (vérification d'identité à venir) et « Lavé et plié » (promis par le vendeur, confirmé par l'acheteur à la réception)
- **Guide des états** (de « Neuf avec étiquette » à « Satisfaisant »), accessible depuis la fiche, la vente et le profil
- **Près de chez toi** : distance du vendeur, filtre « moins de 2 / 5 / 10 km », conseils de lieu public pour la remise en main propre
- **Compteur d'impact** : vêtements sauvés, estimations CO₂ et eau, et un **arbre qui grandit** (graine → petite pousse 10 → jeune arbre 25 → grand chêne 50 → forêt entière 100), aussi sur le profil et dans le guide
- **Mode sombre** (clair par défaut, ou sombre / automatique) et **taille du texte** (normal / grand / très grand) dans Réglages
- Recherche + filtres (âge, distance, fille/garçon, saison, état, prix, marque, couleur), Tout / Pièces / Lots
- Fiche pièce ou lot (contenu du lot, prix à la pièce), profil vendeur (dressing, avis, suivre)
- Vendre en 4 étapes (type, photos, description, prix avec montant reçu, modes de livraison)
- Panier groupé par vendeur, paiement Stripe (point relais / domicile / main propre)
- **Panier lié au compte** (`supabase/schema-14-panier.sql`, `src/lib/basket.ts`) : enregistré sur le serveur, chaque parent le retrouve en se reconnectant, sur n'importe quel appareil. Ce qui est mis au panier sans être connecté s'y ajoute à la connexion ; à la déconnexion, le panier quitte l'appareil. Le téléphone garde une copie et ce que le serveur avait au dernier échange (`cartBase`) : il envoie ses changements et reprend ceux faits ailleurs (à chaque rechargement du fil, toutes les minutes). Un article vendu, retiré ou à soi en sort tout seul. Tant que le script 14 n'est pas lancé, le panier reste sur l'appareil.
- Messagerie avec réponses rapides, favoris, mes achats / ventes, suivi de commande + avis, notifications
- **Informations légales** (`src/app/legal`, textes dans `src/data/legal.ts`) : CGU, politique de confidentialité, mentions légales, acceptation à l'inscription, « Signaler cette annonce », rappel impôts / URSSAF au vendeur dès 30 ventes ou 2 000 € dans l'année. Les champs de `LEGAL` (éditeur, SIREN, médiateur, région des serveurs) sont à remplir une fois la structure créée ; vides, ils s'affichent « [à compléter] ».
- **Trace des acceptations** (`supabase/schema-8-cgu.sql`, `src/lib/terms.ts`) : chaque acceptation des CGU et de la confidentialité est enregistrée (version, date et heure du serveur, e-mail, appareil), à l'inscription par la base elle-même, puis dans l'appli pour les comptes plus anciens. Les lignes ne peuvent être ni modifiées ni supprimées depuis l'appli et restent après la fermeture du compte. Changer `TERMS_VERSION` (avec `LEGAL.updated`) redemande l'acceptation à tout le monde.
- **Supprimer mon compte** (Profil → Mes informations ; `src/app/delete-account.tsx`, action `delete-account` de la fonction `payments`, `supabase/schema-9-suppression-compte.sql`) : profil, passeports, annonces, photos et conversations supprimés ; commandes gardées sans nom ni adresse, avis laissés gardés sans nom, e-mail et compte Stripe gardés dans `closed_accounts` pour les déclarations. Refusé tant qu'une commande est en cours ; un paiement resté ouvert sur Stripe est clôturé.

## Structure

```
src/app/          routes Expo Router (tabs : home, search, messages, profile ; + écrans empilés)
src/components/   UI partagée (ui.tsx, products.tsx, Screen, FilterSheet, OfferSheet, Logo, KidAvatar, home/Home1c)
src/store/        état Zustand (passeports, panier, offres, favoris, filtres, annonces, conversations, commandes)
src/lib/kids.ts   âge, taille et anniversaire à partir du passeport
src/data/         tailles, couleurs, états, livraisons (les annonces sont sur Supabase)
src/theme/        tokens Organic (couleurs, polices, ombres)
```

## À brancher ensuite

- **Photos** : les annonces ont de vraies photos (galerie ou appareil photo, redimensionnées puis envoyées dans le stockage Supabase).
- **Back-end** : comptes, profils et passeports sont sur Supabase (`src/lib/backend.ts`). Les annonces publiées et les fiches vendeurs aussi (`src/lib/listings.ts`, `supabase/schema-2-annonces.sql`). La messagerie et les offres entre vrais parents aussi, en direct (`src/lib/messaging.ts`, `supabase/schema-3-messages.sql`). Paiement réel en **mode test Stripe** pour les vraies annonces (`supabase/functions/payments`, `supabase/schema-4-paiements.sql`, `src/lib/payments.ts`) : Stripe Connect, argent bloqué jusqu'à la réception puis versé au vendeur moins la commission. Plus d'annonces, de vendeurs ni de conversations d'exemple : tout ce qu'on voit vient du serveur.
- **Bordereaux d'envoi (Boxtal)** (`supabase/schema-10-bordereaux.sql`, fonction `payments`) : le vendeur choisit la taille du colis (petit, moyen, grand : 0,5, 1 ou 2 kg), qui fixe le prix de livraison. Plusieurs articles d'un même vendeur partent dans un seul colis, au palier de poids des transporteurs qui les contient (3, 5, 7 ou 10 kg ; au-delà, l'acheteur partage sa commande). Prix par palier : `SHIPPING_PRICES` dans `src/data/catalog.ts`, mêmes chiffres que `SHIPPING` dans la fonction (prix Boxtal relevés avec la page `/verifier-tarifs` + 20 % de TVA + 2 % pour Stripe + 0,25 €, arrondis à x,x9). Le vrai coût de chaque bordereau est noté dans la table `label_costs` (`supabase/schema-11-couts-bordereaux.sql`), à côté de ce que l'acheteur a payé. Un seul bordereau par colis, même si l'appli interroge le serveur plusieurs fois à la fois : la fonction réserve d'abord le colis (`label_claimed_at`, `supabase/schema-12-un-seul-bordereau.sql`). Page `/verifier-tarifs` (non liée dans l'appli, mode test Boxtal seulement) : le vrai prix Boxtal de chaque palier pour Mondial Relay et Colissimo, à côté du prix Pimou et de la marge. L'acheteur choisit son point Mondial Relay au paiement (ou Colissimo à domicile) et donne un numéro de portable ; une fois payé, la fonction commande le bordereau prépayé chez Boxtal, que le vendeur télécharge depuis sa vente. Le suivi passe la commande en « expédiée » dès le dépôt. Secrets : `BOXTAL_ACCESS_KEY`, `BOXTAL_SECRET_KEY` (serveur de test tant que `BOXTAL_API_URL` n'est pas `https://api.boxtal.com`).
- **Porte-monnaie** (`supabase/schema-13-porte-monnaie.sql`, fonction `payments`, écran `/payouts`) : l'argent des ventes reste sur le compte Stripe du vendeur (versements « manuels », seulement sur demande), jamais chez Pimou. Le parent le retire vers sa banque (action `withdraw`) ou paie ses achats avec, en tout (pas de page Stripe) ou en partie (remise affichée sur la page Stripe, prise dans le porte-monnaie une fois la carte payée, la carte payant au moins 0,50 €). Un article vendu à quelqu'un d'autre entre-temps est remboursé sur la carte et dans le porte-monnaie, chacun pour sa part. Historique en mots dans `wallet_movements`. Un compte ne se supprime qu'une fois le porte-monnaie vide.
- **Feuille de route** : 1. ~~messagerie et offres~~ ✓ · 2. paiement réel (Stripe Connect, ✓ en mode test, à passer en réel avec la structure juridique) · 3. ~~vrais bordereaux d'envoi~~ ✓ (Boxtal, en test) · 4. publication App Store / Google Play.
- **E-mails** : brancher un SMTP (ex. Resend) dans Supabase avant l'ouverture au public ; l'envoi intégré ne sert qu'aux membres du projet.
