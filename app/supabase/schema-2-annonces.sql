-- Pimou, step 2: listings with photos. Paste all of this in Supabase → SQL Editor → New query → Run (once),
-- after schema.sql. Turn off the browser's translation before copying.

-- 1. What other parents may see of a seller: first name, initial, city. Kept in step with profiles.
create table if not exists public.public_profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  city text not null default '',
  zip text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.public_profiles enable row level security;
drop policy if exists "Sellers are public" on public.public_profiles;
create policy "Sellers are public" on public.public_profiles for select to anon, authenticated using (true);

create or replace function public.sync_public_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.public_profiles (id, display_name, city, zip, verified)
  values (
    new.id,
    trim(new.first_name || case when new.last_name <> '' then ' ' || upper(left(new.last_name, 1)) || '.' else '' end),
    new.city, new.zip, new.verified
  )
  on conflict (id) do update set display_name = excluded.display_name, city = excluded.city, zip = excluded.zip, verified = excluded.verified;
  return new;
end;
$$;
drop trigger if exists on_profile_saved on public.profiles;
create trigger on_profile_saved after insert or update on public.profiles for each row execute procedure public.sync_public_profile();

-- Accounts created before this script: copy them over once.
update public.profiles set updated_at = updated_at;

-- 2. Listings: everyone can browse; only the seller can add, change or remove theirs.
create table if not exists public.listings (
  id bigint generated always as identity primary key,
  seller_id uuid not null default auth.uid() references auth.users on delete cascade,
  type text not null check (type in ('unique', 'lot')),
  title text not null check (char_length(title) between 1 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  brand text not null default '',
  age text not null,
  gender text not null default 'Mixte',
  season text not null default 'Toutes saisons',
  condition text not null,
  price numeric(8, 2) not null check (price > 0 and price < 10000),
  color text not null default 'Beige',
  count int,
  contents jsonb,
  negotiable boolean not null default true,
  washed boolean not null default false,
  delivery jsonb not null default '{}'::jsonb,
  photos text[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'sold', 'removed')),
  created_at timestamptz not null default now()
);
create index if not exists listings_active_idx on public.listings (created_at desc) where status = 'active';
alter table public.listings enable row level security;

drop policy if exists "Browse listings" on public.listings;
create policy "Browse listings" on public.listings for select to anon, authenticated using (status = 'active' or (select auth.uid()) = seller_id);
drop policy if exists "Sell" on public.listings;
create policy "Sell" on public.listings for insert to authenticated with check ((select auth.uid()) = seller_id);
drop policy if exists "Edit own listing" on public.listings;
create policy "Edit own listing" on public.listings for update to authenticated using ((select auth.uid()) = seller_id) with check ((select auth.uid()) = seller_id);
drop policy if exists "Delete own listing" on public.listings;
create policy "Delete own listing" on public.listings for delete to authenticated using ((select auth.uid()) = seller_id);

-- 3. Photos: public to view, each parent uploads only into their own folder (photos/<their id>/...).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Upload own photos" on storage.objects;
create policy "Upload own photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Delete own photos" on storage.objects;
create policy "Delete own photos" on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
