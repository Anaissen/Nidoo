-- Pimou, step 7: shoes, socks and tights. Paste all of this in Supabase → SQL Editor → New query → Run (once).
-- Turn off the browser's translation before copying.

alter table public.listings add column if not exists category text not null default 'vetement';
alter table public.listings add column if not exists shoe_size int;
alter table public.listings add column if not exists sock_size text;

alter table public.listings drop constraint if exists listings_category_check;
alter table public.listings add constraint listings_category_check check (category in ('vetement', 'chaussures', 'chaussettes'));
alter table public.listings drop constraint if exists listings_shoe_size_check;
alter table public.listings add constraint listings_shoe_size_check check (shoe_size is null or shoe_size between 15 and 40);
alter table public.listings drop constraint if exists listings_sock_size_check;
alter table public.listings add constraint listings_sock_size_check check (sock_size is null or sock_size in ('15-18', '19-22', '23-26', '27-30', '31-34', '35-38'));
-- Shoes need their size, socks their range.
alter table public.listings drop constraint if exists listings_sizes_check;
alter table public.listings add constraint listings_sizes_check check (
  (category <> 'chaussures' or shoe_size is not null) and (category <> 'chaussettes' or sock_size is not null)
);
