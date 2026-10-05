-- Pimou: database setup. Paste all of this in Supabase → SQL Editor → New query → Run (once).

-- 1. Profiles: one row per parent, created automatically at sign-up from what they typed.
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  phone text not null default '',
  street text not null default '',
  zip text not null default '',
  city text not null default '',
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "Read own profile" on public.profiles;
create policy "Read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Update own profile" on public.profiles;
create policy "Update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Parents may edit their details, but not grant themselves the "Parent vérifié" badge.
revoke update on public.profiles from authenticated, anon;
grant update (first_name, last_name, phone, street, zip, city, updated_at) on public.profiles to authenticated;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, first_name, last_name, phone, street, zip, city)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.raw_user_meta_data ->> 'street', ''),
    coalesce(new.raw_user_meta_data ->> 'zip', ''),
    coalesce(new.raw_user_meta_data ->> 'city', '')
  );
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- 2. Children's passports, private to their parent. The passport itself is kept as JSON.
create table if not exists public.kids (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  id text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.kids enable row level security;

drop policy if exists "Own kids" on public.kids;
create policy "Own kids" on public.kids for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
