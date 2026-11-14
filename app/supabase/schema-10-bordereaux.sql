-- Pimou, step 10: shipping labels through Boxtal (Mondial Relay point relais, Colissimo à domicile).
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.

-- 1. The seller says how big the parcel is: it sets the shipping price, like on Vinted.
alter table public.listings add column if not exists parcel_size text;
alter table public.listings drop constraint if exists listings_parcel_size_check;
alter table public.listings add constraint listings_parcel_size_check check (parcel_size is null or parcel_size in ('petit', 'moyen', 'grand'));

-- 2. What the label needs, and what comes back from Boxtal. Only the "payments" function writes these.
--    relay: the Mondial Relay point the buyer chose; ship_address: where Colissimo delivers.
--    The buyer's phone and e-mail are not stored here: the function reads them when it makes the label.
alter table public.orders add column if not exists parcel_size text;
alter table public.orders add column if not exists relay jsonb;
alter table public.orders add column if not exists ship_address jsonb;
alter table public.orders add column if not exists shipping_order_id text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists tracking_url text;
alter table public.orders add column if not exists tracking_status text;
alter table public.orders add column if not exists label_error text;
create index if not exists orders_shipping_order_idx on public.orders (shipping_order_id);
