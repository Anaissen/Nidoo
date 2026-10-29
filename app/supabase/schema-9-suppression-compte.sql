-- Pimou, step 9: closing an account ("Supprimer mon compte" in the app).
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.

-- 1. Past orders stay when a parent closes their account: the accounts need them (10 years), and the
--    other parent keeps their history. They were erased together with the account until now.
alter table public.orders drop constraint if exists orders_buyer_id_fkey;
alter table public.orders drop constraint if exists orders_seller_id_fkey;

-- 2. Reviews a parent wrote stay on the seller's profile, without their name.
alter table public.reviews drop constraint if exists reviews_buyer_id_fkey;

-- 3. What Pimou has to keep about a closed account: when, the e-mail, and the Stripe account
--    (for the yearly declaration of sellers' sales). Only the server reads and writes it.
create table if not exists public.closed_accounts (
  user_id uuid primary key,
  email text not null default '',
  stripe_account_id text,
  closed_at timestamptz not null default now()
);
alter table public.closed_accounts enable row level security;
revoke all on public.closed_accounts from anon, authenticated;
