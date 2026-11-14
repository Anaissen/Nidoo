-- Pimou, step 11: what each shipping label really costs, to check that the shipping paid by buyers covers it.
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.
--
-- To read it: Table Editor → label_costs. One line per label:
--   paid_by_buyer  what the buyer paid for the parcel's shipping;
--   boxtal_ht      Boxtal's price for the label, before VAT;
--   boxtal_ttc     the same with 20 % VAT: what Pimou really pays, since it doesn't charge VAT;
--   margin         what's left for Pimou (below zero: the price of that parcel size is too low).

create table if not exists public.label_costs (
  shipping_order_id text primary key,
  created_at timestamptz not null default now(),
  group_id uuid,
  delivery text,
  parcel_size text,
  paid_by_buyer numeric(8, 2),
  boxtal_ht numeric(8, 2),
  boxtal_ttc numeric(8, 2) generated always as (round(boxtal_ht * 1.2, 2)) stored,
  margin numeric(8, 2) generated always as (paid_by_buyer - round(boxtal_ht * 1.2, 2)) stored
);

-- Only the "payments" function writes it: parents can't read it, and nobody can change it from the app.
alter table public.label_costs enable row level security;
revoke all on public.label_costs from anon, authenticated;
