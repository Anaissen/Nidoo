-- Pimou: put back on sale the listings marked "sold" whose sale didn't go through (refunded / cancelled).
-- Safe to run any time: a listing with a real order (paid, shipped or received) is left as it is.
update public.listings l
set status = 'active'
where l.status = 'sold'
  and not exists (
    select 1 from public.orders o
    where o.listing_id = l.id and o.status in ('paid', 'shipped', 'received')
  );
