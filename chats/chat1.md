# Marketplace enfant vêtements

_Started 2026-10-04 09:09 UTC_

---

## User

créer moi une application mobile d'une marketplace enfant 0-10ans, pour vendre des vetements, avec le choix de vendre soit en lot soit un vetement unique, une application fluide, facile d'utilisation, concu pour les parents, avec toutes les pages necessaires à une bonne marketplace

## Assistant



## Assistant

_[tool: ask_user]_

_[tool: ask_user]_

J'attends vos réponses au formulaire (identité visuelle, pages, fonctionnement des lots, etc.) avant de commencer.

## User

Answered — ds: Picked a design system (now attached); name: Nidoo; platform: iOS; pages: Onboarding, Accueil, Recherche & filtres, Fiche article / lot, Publier une annonce, Panier & paiement, Messagerie, Profil vendeur, Favoris, Mes ventes / achats, Suivi de commande, Notifications; lot_mode: Lot à prix fixe (tout ou rien); filters: Âge / taille, Fille / garçon / mixte, Saison, Marque, État, Prix, Couleur; model: Commission vendeur; delivery: Point relais, Domicile, Remise en main propre; variations: Prototype + 2-3 directions visuelles pour l'accueil; tone: Tutoiement

## Assistant

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: read_file]_

_[tool: copy_starter_component]_

_[tool: grep]_

_[tool: copy_files]_

_[tool: update_todos]_

_[tool: dc_write]_

_[tool: show_html]_

_[tool: dc_js_str_replace]_

_[tool: dc_write]_

_[tool: ready_for_verification]_

J'ai construit Nidoo, un prototype iPhone cliquable avec le système de design Organic. Le canvas **Nidoo Directions** affiche quatre téléphones entièrement navigables. Une vérification automatique tourne encore, donc je n'ai pas encore vu le rendu moi-même.

- **1a Classique :** barre de recherche, raccourcis par âge, bannière « Vends tout en un lot », lots du moment et nouveautés à ta taille.
- **1b Éditorial :** entrée par âge en formes rondes, lot de la semaine et liste de pièces uniques.
- **1c Par enfant :** on choisit Léa ou Tom, et les articles s'affichent à sa taille. On peut filtrer Tout / Pièces / Lots.
- **1d :** le parcours complet à partir de l'onboarding, qui demande d'abord les âges des enfants.

Pages incluses :
- Recherche avec les filtres que tu as choisis : âge, fille/garçon, saison, marque, état, prix, couleur.
- Fiche pièce ou lot, avec le contenu du lot et le prix à la pièce.
- Vente en 4 étapes : type, photos, description, prix. Le montant que le vendeur recevra après la commission de 8 % s'affiche en direct.
- Panier, puis paiement avec point relais, domicile ou main propre.
- Messagerie avec réponses rapides, profil vendeur, favoris, mes achats et mes ventes, suivi de commande avec notation, notifications.

À savoir :
- Les photos sont des zones de remplacement à rayures. Je ne peux pas générer d'images : envoie-moi de vraies photos de vêtements et je les intègre.
- Le taux de commission, l'écran de départ et la version de l'accueil se règlent dans les Tweaks du fichier `Nidoo.dc.html`.

Choisis une direction pour l'accueil (ou un mélange, par exemple 1c avec la bannière lot de 1a) et je l'affine.

