import { Product, Seller } from '../data/catalog';
import { effectivePrice, productById, sellerById, useStore } from '../store/useStore';

/** A cart line: `price` is what the buyer pays (accepted offer or listed price). */
export type CartItem = Product & { listPrice: number };

/** Cart items grouped by seller: one parcel (and one shipping fee) per seller. */
export function useCartGroups() {
  const cart = useStore((s) => s.cart);
  const mine = useStore((s) => s.mine);
  const offers = useStore((s) => s.offers);
  const items: CartItem[] = cart
    .map((id) => productById(mine, id))
    .filter((p): p is Product => !!p)
    .map((p) => ({ ...p, listPrice: p.price, price: effectivePrice({ offers, mine }, p.id) }));
  const map: Record<string, { seller: Seller; items: CartItem[] }> = {};
  items.forEach((p) => { (map[p.sid] ??= { seller: sellerById(p.sid)!, items: [] }).items.push(p); });
  return { items, groups: Object.values(map), subtotal: items.reduce((a, p) => a + p.price, 0) };
}
