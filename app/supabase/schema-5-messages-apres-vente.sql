-- Pimou, step 5: buyer and seller can talk after a sale. Paste all of this in Supabase → SQL Editor →
-- New query → Run (once). Turn off the browser's translation before copying.
-- Before: a conversation could only start on a listing still for sale, and only from the buyer.
-- Now also: either of them can start one about an article they bought / sold to each other.

drop policy if exists "Buyer starts a conversation" on public.conversations;
drop policy if exists "Start a conversation" on public.conversations;
create policy "Start a conversation" on public.conversations for insert to authenticated
  with check (
    -- A buyer asking about a listing for sale…
    (
      (select auth.uid()) = buyer_id
      and seller_id = (select l.seller_id from public.listings l where l.id = listing_id and l.status = 'active')
    )
    -- …or the buyer / the seller of an order, about that order.
    or exists (
      select 1 from public.orders o
      where o.listing_id = conversations.listing_id
        and o.buyer_id = conversations.buyer_id
        and o.seller_id = conversations.seller_id
        and o.status in ('paid', 'shipped', 'received')
        and (select auth.uid()) in (o.buyer_id, o.seller_id)
    )
  );
