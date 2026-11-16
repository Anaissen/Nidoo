-- Pimou : passage en mode réel. À lancer UNE SEULE fois, le jour où les vraies clés Stripe et Boxtal sont mises.
-- Supabase → SQL Editor → New query → coller tout → Run (puis confirmer). Désactive la traduction du navigateur avant de copier.
--
-- Efface tout ce qui vient des essais en mode test : les commandes et leurs avis, l'historique des porte-monnaie et
-- leurs comptes Stripe de test (chaque vendeur réactive son porte-monnaie avec sa vraie pièce d'identité et son vrai
-- IBAN), les coûts des bordereaux de test, les conversations et les offres, les annonces de test et les paniers.
-- Restent : les comptes, les profils, les passeports des enfants et les acceptations des CGU.

begin;

delete from public.reviews;
delete from public.orders;
delete from public.wallet_movements;
delete from public.label_costs;
delete from public.payout_accounts;
delete from public.closed_accounts;
delete from public.messages;
delete from public.conversations;
delete from public.cart_items;
delete from public.listings;

-- Les chiffres des vendeurs (ventes, notes) repartent de zéro.
select public.refresh_seller_stats(id) from public.public_profiles;

commit;
