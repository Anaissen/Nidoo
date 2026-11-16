-- Pimou, step 14: the basket follows the account.
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.
--
-- Each parent finds their basket again when they log back in, on any phone or browser. Only they can see or change it.
-- An article deleted for good leaves every basket by itself; one sold or taken down is cleared by the app.

create table if not exists public.cart_items (
  user_id uuid not null references auth.users on delete cascade,
  listing_id bigint not null references public.listings on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);
create index if not exists cart_items_listing_idx on public.cart_items (listing_id);

alter table public.cart_items enable row level security;
drop policy if exists "Own basket" on public.cart_items;
create policy "Own basket" on public.cart_items for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.cart_items from anon;
revoke update, truncate, references, trigger on public.cart_items from authenticated;
grant select, insert, delete on public.cart_items to authenticated;
