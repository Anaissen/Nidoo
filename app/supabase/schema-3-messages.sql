-- Pimou, step 3: messages and price offers between parents. Paste all of this in Supabase → SQL Editor →
-- New query → Run (once), after schema-2-annonces.sql. Turn off the browser's translation before copying.

-- 1. A conversation: one buyer, one seller, about one listing.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id bigint not null references public.listings on delete cascade,
  buyer_id uuid not null default auth.uid() references auth.users on delete cascade,
  seller_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  unique (listing_id, buyer_id),
  check (buyer_id <> seller_id)
);
alter table public.conversations enable row level security;

drop policy if exists "See own conversations" on public.conversations;
create policy "See own conversations" on public.conversations for select to authenticated
  using ((select auth.uid()) in (buyer_id, seller_id));
-- Only the buyer opens one, and only with the real seller of an active listing.
drop policy if exists "Buyer starts a conversation" on public.conversations;
create policy "Buyer starts a conversation" on public.conversations for insert to authenticated
  with check (
    (select auth.uid()) = buyer_id
    and seller_id = (select l.seller_id from public.listings l where l.id = listing_id and l.status = 'active')
  );

-- 2. Messages. kind: text, offer (buyer proposes a price), counter (seller proposes another),
--    accept / decline (answer to the other person's last proposal).
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations on delete cascade,
  sender_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null default 'text' check (kind in ('text', 'offer', 'counter', 'accept', 'decline')),
  body text not null default '' check (char_length(body) <= 2000),
  amount numeric(8, 2) check (amount is null or (amount > 0 and amount < 10000)),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
alter table public.messages enable row level security;

drop policy if exists "Read own messages" on public.messages;
create policy "Read own messages" on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversations c
    where c.id = conversation_id and (select auth.uid()) in (c.buyer_id, c.seller_id)
  ));

drop policy if exists "Write in own conversations" on public.messages;
create policy "Write in own conversations" on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.buyer_id, c.seller_id)
        -- Offers come from the buyer, counter-offers from the seller.
        and (kind <> 'offer' or (select auth.uid()) = c.buyer_id)
        and (kind <> 'counter' or (select auth.uid()) = c.seller_id)
    )
  );

-- The recipient marks messages as read; nothing else can be changed.
revoke update on public.messages from authenticated, anon;
grant update (read_at) on public.messages to authenticated;
drop policy if exists "Mark as read" on public.messages;
create policy "Mark as read" on public.messages for update to authenticated
  using (
    sender_id <> (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (select auth.uid()) in (c.buyer_id, c.seller_id)
    )
  );

-- Keep the conversation list sorted by the latest message.
create or replace function public.touch_conversation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  return new;
end;
$$;
drop trigger if exists on_message_sent on public.messages;
create trigger on_message_sent after insert on public.messages for each row execute procedure public.touch_conversation();

-- 3. Live updates: new messages show up instantly in the app.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;
