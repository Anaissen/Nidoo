-- Pimou, step 8: keep a record of every parent who accepts the CGU and the privacy policy.
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.

-- 1. One row per acceptance: who, which version, when, how. Nobody can change or delete it from the app.
create table if not exists public.terms_acceptances (
  id bigint generated always as identity primary key,
  -- Kept after the account is closed (the e-mail stays), in case of a dispute.
  user_id uuid references auth.users on delete set null,
  email text not null default '',
  version text not null check (char_length(version) between 1 and 40),
  documents text not null default 'cgu, confidentialite',
  how text not null default 'case cochée' check (char_length(how) <= 60),
  user_agent text not null default '' check (char_length(user_agent) <= 400),
  accepted_at timestamptz not null default now()
);
create index if not exists terms_acceptances_user_idx on public.terms_acceptances (user_id, accepted_at desc);
alter table public.terms_acceptances enable row level security;

drop policy if exists "Read own acceptances" on public.terms_acceptances;
create policy "Read own acceptances" on public.terms_acceptances for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Accept the terms" on public.terms_acceptances;
create policy "Accept the terms" on public.terms_acceptances for insert to authenticated with check (user_id = (select auth.uid()));
-- No update or delete policy, and no right to either: a record can't be rewritten.
revoke update, delete, truncate on public.terms_acceptances from anon, authenticated;

-- 2. The date and the e-mail are always set by the database itself, never by the phone.
create or replace function public.stamp_terms_acceptance() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.accepted_at := now();
  new.email := coalesce((select u.email from auth.users u where u.id = new.user_id), '');
  return new;
end;
$$;
drop trigger if exists on_terms_accepted on public.terms_acceptances;
create trigger on_terms_accepted before insert on public.terms_acceptances for each row execute procedure public.stamp_terms_acceptance();

-- 3. At sign-up, the box ticked in the app is recorded together with the new account.
create or replace function public.record_signup_terms() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'terms_version', '') <> '' then
    insert into public.terms_acceptances (user_id, version, how, user_agent)
    values (new.id, left(new.raw_user_meta_data ->> 'terms_version', 40), 'case cochée à l''inscription', left(coalesce(new.raw_user_meta_data ->> 'terms_ua', ''), 400));
  end if;
  return new;
end;
$$;
drop trigger if exists on_auth_user_terms on auth.users;
create trigger on_auth_user_terms after insert on auth.users for each row execute procedure public.record_signup_terms();
