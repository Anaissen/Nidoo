-- Pimou, step 12: one label per parcel, never two.
-- Paste all of this in Supabase → SQL Editor → New query → Run (once). Turn off the browser's translation before copying.
--
-- After a payment, the app can ask the server several times at once (payment page, background check…). Each time
-- could order a label, and Boxtal would bill each one. The "payments" function now first claims the parcel by
-- stamping this column on its first order: only the call that stamps it orders the label.

alter table public.orders add column if not exists label_claimed_at timestamptz;
