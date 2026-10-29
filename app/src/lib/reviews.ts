import { useStore } from '../store/useStore';
import { currentUser, supabase } from './backend';

/** A buyer's review of a seller, after a real order. */
export type Review = { orderId: string; sellerId: string; buyerId: string; rating: number; comment: string; washedOk: boolean | null; createdAt: string };
type ReviewRow = { order_id: string; seller_id: string; buyer_id: string; rating: number; comment: string; washed_ok: boolean | null; created_at: string };

const toReview = (r: ReviewRow): Review => ({
  orderId: r.order_id, sellerId: r.seller_id, buyerId: r.buyer_id, rating: r.rating, comment: r.comment, washedOk: r.washed_ok, createdAt: r.created_at,
});

export const stars = (n: number) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);

/** Reviews of the given orders (the person's own, as buyer or seller). */
export async function loadOrderReviews(orderIds: string[]) {
  if (!orderIds.length) return {};
  const { data } = await supabase.from('reviews').select('*').in('order_id', orderIds);
  return Object.fromEntries(((data as ReviewRow[] | null) ?? []).map((r) => [r.order_id, toReview(r)]));
}

/** A seller's latest reviews, with the reviewers' names, for their profile. */
export async function loadSellerReviews(sellerId: string) {
  const { data } = await supabase.from('reviews').select('*').eq('seller_id', sellerId).order('created_at', { ascending: false }).limit(50);
  const list = ((data as ReviewRow[] | null) ?? []).map(toReview);
  const ids = [...new Set(list.map((r) => r.buyerId))];
  const names: Record<string, string> = {};
  if (ids.length) {
    const res = await supabase.from('public_profiles').select('id, display_name').in('id', ids);
    (res.data as { id: string; display_name: string }[] | null)?.forEach((p) => { names[p.id] = p.display_name; });
  }
  return list.map((r) => ({ ...r, who: names[r.buyerId] || 'Un parent' }));
}

/** The buyer rates the seller of a received order. Returns an error message, or null. */
export async function submitReview(o: { id: string; sellerId: string }, rating: number, comment: string, washedOk: boolean | null) {
  const me = currentUser()?.id;
  if (!me) return 'Connecte-toi pour laisser un avis';
  const { data, error } = await supabase.from('reviews')
    .upsert({ order_id: o.id, seller_id: o.sellerId, buyer_id: me, rating, comment: comment.trim().slice(0, 500), washed_ok: washedOk })
    .select('*').single();
  if (error || !data) return "Ton avis n'a pas pu être enregistré, réessaie.";
  useStore.setState((s) => ({ orderReviews: { ...s.orderReviews, [o.id]: toReview(data as ReviewRow) } }));
  return null;
}
