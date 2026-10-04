import { Product, Seller } from '../data/catalog';
import { productById, sellerById, useStore } from '../store/useStore';

/** Cart items grouped by seller: one parcel (and one shipping fee) per seller. */
export function useCartGroups() {
  const cart = useStore((s) => s.cart);
  const mine = useStore((s) => s.mine);
  const items = cart.map((id) => productById(mine, id)).filter((p): p is Product => !!p);
  const map: Record<string, { seller: Seller; items: Product[] }> = {};
  items.forEach((p) => { (map[p.sid] ??= { seller: sellerById(p.sid)!, items: [] }).items.push(p); });
  return { items, groups: Object.values(map), subtotal: items.reduce((a, p) => a + p.price, 0) };
}
