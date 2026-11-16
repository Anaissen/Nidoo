-- Pimou, step 13: the porte-monnaie.
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.
--
-- The money itself is never here: it stays with Stripe, on each parent's own payment account (the one they opened
-- to sell). Pimou only asks Stripe for the balance, a withdrawal, or to take an amount for a purchase.

-- 1. The part of each order paid from the buyer's porte-monnaie (the rest by card), and the seller's payment for
--    that part, once the buyer confirms reception.
alter table public.orders add column if not exists wallet_amount numeric(8, 2) not null default 0;
alter table public.orders add column if not exists wallet_transfer_id text;

-- 2. What went in and out, to show each parent their history in words ("Vente « Robe »", "Retrait"…).
--    Only the "payments" function writes it; each parent reads their own lines.
create table if not exists public.wallet_movements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users on delete cascade,
  amount numeric(8, 2) not null,
  kind text not null check (kind in ('sale', 'purchase', 'refund', 'withdrawal')),
  label text not null default '',
  order_id uuid,
  stripe_id text,
  created_at timestamptz not null default now()
);
create index if not exists wallet_movements_user_idx on public.wallet_movements (user_id, created_at desc);
alter table public.wallet_movements enable row level security;
drop policy if exists "See own wallet movements" on public.wallet_movements;
create policy "See own wallet movements" on public.wallet_movements for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete, truncate on public.wallet_movements from anon, authenticated;
