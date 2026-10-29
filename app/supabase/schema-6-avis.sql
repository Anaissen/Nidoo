-- Pimou, step 6: reviews. Paste all of this in Supabase → SQL Editor → New query → Run (once).
-- Turn off the browser's translation before copying.

-- 1. One review per order, written by the buyer once they have the article. Public, like on any marketplace.
create table if not exists public.reviews (
  order_id uuid primary key references public.orders on delete cascade,
  seller_id uuid not null references auth.users on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text not null default '' check (char_length(comment) <= 500),
  washed_ok boolean,
  created_at timestamptz not null default now()
);
create index if not exists reviews_seller_idx on public.reviews (seller_id, created_at desc);
alter table public.reviews enable row level security;

drop policy if exists "Reviews are public" on public.reviews;
create policy "Reviews are public" on public.reviews for select to anon, authenticated using (true);

-- Only the buyer of a received order, about that order's seller.
drop policy if exists "Buyer reviews a received order" on public.reviews;
create policy "Buyer reviews a received order" on public.reviews for insert to authenticated
  with check (
    buyer_id = (select auth.uid())
    and exists (
      select 1 from public.orders o
      where o.id = reviews.order_id and o.buyer_id = (select auth.uid()) and o.seller_id = reviews.seller_id and o.status = 'received'
    )
  );
drop policy if exists "Buyer edits own review" on public.reviews;
create policy "Buyer edits own review" on public.reviews for update to authenticated
  using (buyer_id = (select auth.uid()))
  with check (
    buyer_id = (select auth.uid())
    and exists (select 1 from public.orders o where o.id = reviews.order_id and o.buyer_id = (select auth.uid()) and o.seller_id = reviews.seller_id)
  );

-- 2. The seller's public figures, kept up to date by the database itself.
alter table public.public_profiles add column if not exists sales_count int not null default 0;
alter table public.public_profiles add column if not exists rating_count int not null default 0;
alter table public.public_profiles add column if not exists rating_avg numeric(2, 1);
alter table public.public_profiles add column if not exists washed_confirms int not null default 0;

create or replace function public.refresh_seller_stats(seller uuid) returns void
language sql security definer set search_path = '' as $$
  update public.public_profiles p set
    sales_count = (select count(*) from public.orders o where o.seller_id = seller and o.status = 'received'),
    rating_count = (select count(*) from public.reviews r where r.seller_id = seller),
    rating_avg = (select round(avg(r.rating)::numeric, 1) from public.reviews r where r.seller_id = seller),
    washed_confirms = (select count(*) from public.reviews r where r.seller_id = seller and r.washed_ok)
  where p.id = seller;
$$;
revoke execute on function public.refresh_seller_stats(uuid) from public, anon, authenticated;

create or replace function public.on_review_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.refresh_seller_stats(coalesce(new.seller_id, old.seller_id));
  return null;
end;
$$;
drop trigger if exists on_review_saved on public.reviews;
create trigger on_review_saved after insert or update or delete on public.reviews for each row execute procedure public.on_review_change();

create or replace function public.on_order_received() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'received' and old.status is distinct from 'received' then
    perform public.refresh_seller_stats(new.seller_id);
  end if;
  return null;
end;
$$;
drop trigger if exists on_order_received on public.orders;
create trigger on_order_received after update on public.orders for each row execute procedure public.on_order_received();

-- Sales already completed before this script.
select public.refresh_seller_stats(id) from public.public_profiles;

-- 3. Live updates: the seller sees a new review right away.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'reviews') then
    alter publication supabase_realtime add table public.reviews;
  end if;
end;
$$;
