-- Pimou, step 4: payments with Stripe Connect (test mode first). Paste all of this in Supabase → SQL Editor →
-- New query → Run (once), after schema-3-messages.sql. Turn off the browser's translation before copying.
-- Only the "payments" Edge Function (service role) writes these tables; the app can only read its own rows.

-- 1. Each seller's Stripe account, where their money is paid out.
create table if not exists public.payout_accounts (
  user_id uuid primary key references auth.users on delete cascade,
  stripe_account_id text not null unique,
  ready boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payout_accounts enable row level security;
drop policy if exists "See own payout account" on public.payout_accounts;
create policy "See own payout account" on public.payout_accounts for select to authenticated using ((select auth.uid()) = user_id);

-- 2. Orders: one row per article bought. group_id = one payment (one Stripe Checkout).
--    pending (payment started) → paid (money held by Pimou) → shipped → received (money sent to the seller)
--    cancelled: payment never finished, or the article was sold to someone else first (refunded).
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  listing_id bigint references public.listings on delete set null,
  buyer_id uuid not null references auth.users on delete cascade,
  seller_id uuid not null references auth.users on delete cascade,
  title text not null,
  photo text,
  price numeric(8, 2) not null check (price > 0),
  shipping numeric(8, 2) not null default 0,
  commission numeric(8, 2) not null default 0,
  delivery text not null check (delivery in ('relais', 'domicile', 'main')),
  address text not null default '',
  status text not null default 'pending' check (status in ('pending', 'paid', 'shipped', 'received', 'cancelled')),
  stripe_session_id text,
  payment_intent text,
  charge_id text,
  transfer_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  received_at timestamptz
);
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders (seller_id, created_at desc);
create index if not exists orders_session_idx on public.orders (stripe_session_id);
alter table public.orders enable row level security;
drop policy if exists "See own orders" on public.orders;
create policy "See own orders" on public.orders for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));

-- Live updates for the order screens.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
    alter publication supabase_realtime add table public.orders;
  end if;
end;
$$;
