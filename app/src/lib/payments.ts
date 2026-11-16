import type { RealtimeChannel } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { DeliveryId, Seller } from '../data/catalog';
import { RealOrder, Relay, useStore, Wallet } from '../store/useStore';
import { currentUser, signOut, supabase } from './backend';
import { loadMarket, sellerFromRow, SellerRow } from './listings';
import { loadOrderReviews } from './reviews';
import { everyWhileVisible } from './visible';

// The money side lives in the "payments" Edge Function (supabase/functions/payments): Stripe keys never
// reach the phone. Stripe is in test mode for now: test cards only, no real money moves.

type OrderRow = {
  id: string; group_id: string; listing_id: number | null; buyer_id: string; seller_id: string; title: string; photo: string | null;
  price: number | string; shipping: number | string; commission: number | string; delivery: DeliveryId; address: string;
  status: RealOrder['status']; payment_intent: string | null; created_at: string; paid_at?: string | null;
  relay?: Relay | null; shipping_order_id?: string | null; tracking_status?: string | null; tracking_url?: string | null; label_error?: string | null;
};

const toOrder = (r: OrderRow): RealOrder => ({
  id: r.id, groupId: r.group_id, listingId: r.listing_id, buyerId: r.buyer_id, sellerId: r.seller_id, title: r.title, photo: r.photo,
  price: Number(r.price), shipping: Number(r.shipping), commission: Number(r.commission), delivery: r.delivery, address: r.address,
  // Paid then given back (sold to someone else meanwhile): paid by card, or from the porte-monnaie (no card payment then).
  status: r.status, refunded: r.status === 'cancelled' && (!!r.payment_intent || !!r.paid_at), createdAt: r.created_at,
  relay: r.relay ?? null, shippingOrderId: r.shipping_order_id ?? null, trackingStatus: r.tracking_status ?? null, trackingUrl: r.tracking_url ?? null, labelError: r.label_error ?? null,
});

/** Call the Edge Function. Returns its answer, or { error } with a message to show. */
async function call<T>(action: string, body: Record<string, unknown> = {}): Promise<T & { error?: string }> {
  const { data, error } = await supabase.functions.invoke('payments', { body: { action, ...body } });
  if (!error) return data as T & { error?: string };
  // The function answers refusals with { error: "message in French" }.
  const ctx = (error as { context?: Response }).context;
  const msg = await ctx?.json?.().then((j: { error?: string }) => j?.error).catch(() => undefined);
  return { error: msg ?? (/fetch|network/i.test(error.message) ? 'Pas de connexion internet. Réessaie dans un instant.' : "Le paiement n'est pas disponible pour le moment.") } as T & { error?: string };
}

// ── Orders ──────────────────────────────────────────────────────────────────────────────

/** The seller's sales this calendar year (the yearly tax report counts these). */
export function salesThisYear(orders: RealOrder[], me: string | undefined) {
  const year = String(new Date().getFullYear());
  const sold = orders.filter((o) => o.sellerId === me && o.status !== 'cancelled' && o.createdAt.startsWith(year));
  return { count: sold.length, total: sold.reduce((n, o) => n + o.price, 0) };
}

export async function loadOrders() {
  const me = currentUser()?.id;
  if (!me) return;
  const { data, error } = await supabase.from('orders').select('*').neq('status', 'pending').order('created_at', { ascending: false }).limit(200);
  if (error || !data) return;
  // Payments that never went through are of no interest; refunds are kept so the buyer understands.
  const orders = (data as OrderRow[]).map(toOrder).filter((o) => o.status !== 'cancelled' || o.refunded);
  // Names of the other parents in these orders.
  const s = useStore.getState();
  const ids = [...new Set(orders.flatMap((o) => [o.buyerId, o.sellerId]))].filter((id) => id !== me && !s.marketSellers[id]);
  if (ids.length) {
    const res = await supabase.from('public_profiles').select('*').in('id', ids);
    const people: Record<string, Seller> = {};
    (res.data as SellerRow[] | null)?.forEach((r) => { people[r.id] = sellerFromRow(r); });
    useStore.setState((st) => ({ marketSellers: { ...st.marketSellers, ...people } }));
  }
  const orderReviews = await loadOrderReviews(orders.filter((o) => o.status === 'received').map((o) => o.id));
  useStore.setState({ realOrders: orders, orderReviews });
  // Something new on an order (sold, shipped, reviewed…): the listings and figures change too.
  const reviewed = Object.keys(orderReviews).filter((id) => knownReviews && !knownReviews.has(id));
  if ((known && orders.some((o) => known![o.id] !== o.status)) || reviewed.length) void loadMarket();
  announce(orders);
  // New reviews of my sales.
  for (const id of reviewed) {
    const r = orderReviews[id];
    const o = orders.find((x) => x.id === id);
    if (r && o && r.sellerId === me) s.showToast(`⭐ ${useStore.getState().marketSellers[r.buyerId]?.name ?? 'Un parent'} t'a laissé ${r.rating} étoile${r.rating > 1 ? 's' : ''} pour « ${o.title} »`);
  }
  knownReviews = new Set(Object.keys(orderReviews));
}

/** Orders already reviewed at the last load; null until the first load. */
let knownReviews: Set<string> | null = null;

/** Status of each order at the last load; null until the first load (no notice for what was already there). */
let known: Record<string, RealOrder['status']> | null = null;

/** A notice for what just happened to the other side of an order: sold, shipped, paid out. */
function announce(orders: RealOrder[]) {
  const me = currentUser()?.id;
  const s = useStore.getState();
  const name = (id: string) => s.marketSellers[id]?.name ?? 'Un parent';
  if (known) {
    for (const o of orders) {
      if (known[o.id] === o.status) continue;
      if (o.sellerId === me && o.status === 'paid') s.showToast(`🎉 Vendu ! ${name(o.buyerId)} a acheté « ${o.title} »`);
      else if (o.buyerId === me && o.status === 'shipped') s.showToast(`📦 « ${o.title} » est en route !`);
      else if (o.sellerId === me && o.status === 'received') s.showToast(`💶 ${name(o.buyerId)} a bien reçu « ${o.title} » : ton argent est en route`);
    }
  }
  known = Object.fromEntries(orders.map((o) => [o.id, o.status]));
}

let channel: RealtimeChannel | null = null;
let stopPolling: (() => void) | null = null;
let started = false;
/** Call once at startup: finish half-done payments, then keep the orders up to date. */
export function startPayments() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      channel?.unsubscribe(); channel = null;
      stopPolling?.(); stopPolling = null;
      known = null;
      knownReviews = null;
      useStore.setState({ realOrders: [], payout: null, wallet: null, orderReviews: {} });
      return;
    }
    if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
    const me = session.user.id;
    setTimeout(async () => {
      await loadOrders();
      void call('sync').then(() => Promise.all([loadOrders(), loadWallet()]));
      channel?.unsubscribe();
      channel = supabase.channel(`orders-${me}`)
        // An order changed: refresh it, and the listings (a sold article shows as such right away).
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { void loadOrders(); })
        // Reviews are public: only listen to those about me.
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `seller_id=eq.${me}` }, () => { void loadOrders(); })
        .subscribe();
    }, 50);
    // Back-up for the live connection: look at the orders every 20 seconds.
    stopPolling?.();
    stopPolling = everyWhileVisible(20000, () => { void loadOrders(); });
  });
}

// ── Sellers: receiving the money ────────────────────────────────────────────────────────

export async function refreshPayout() {
  const r = await call<{ ready: boolean; submitted: boolean }>('seller-status');
  if (!r.error) useStore.setState({ payout: { ready: r.ready, submitted: r.submitted } });
  return r;
}

/** Open a Stripe page (identity check, payout dashboard, payment). */
async function open(url: string) {
  if (Platform.OS === 'web') { window.location.assign(url); return; }
  await WebBrowser.openBrowserAsync(url);
}

/** Stripe's form: identity and bank account. Comes back to the "payouts" screen. */
export async function startOnboarding() {
  const r = await call<{ url: string }>('seller-onboarding');
  if (r.error) return r.error;
  await open(r.url);
  // In the phone app, the browser has been closed by now: check where things stand.
  if (Platform.OS !== 'web') await refreshPayout();
  return null;
}

export async function openPayoutDashboard() {
  const r = await call<{ url: string }>('seller-dashboard');
  if (r.error) return r.error;
  await open(r.url);
  return null;
}

// ── Porte-monnaie ───────────────────────────────────────────────────────────────────────

/** The balance and history of the porte-monnaie (the parent's own Stripe account). */
export async function loadWallet() {
  const r = await call<Wallet>('wallet');
  if (!r.error) {
    const { error: _e, ...wallet } = r;
    useStore.setState({ wallet: wallet as Wallet });
  }
  return r;
}

/** Everything usable goes to the parent's bank account. Returns the amount sent, or an error to show. */
export async function withdrawWallet() {
  const r = await call<{ amount: number; wallet: Wallet }>('withdraw');
  if (r.error) return { error: r.error, amount: 0 };
  useStore.setState({ wallet: r.wallet });
  return { error: null, amount: r.amount };
}

/**
 * How much of a purchase (euros) the porte-monnaie pays: all it can, but a card payment is at least 0,50 €
 * (Stripe's minimum). Same rule as the payments function.
 */
export function walletPart(total: number, spendable: number) {
  const t = Math.round(total * 100), s = Math.round(spendable * 100);
  let part = Math.min(Math.max(0, s), t);
  if (part < t && t - part < 50) part = Math.max(0, t - 50);
  return part / 100;
}

// ── Buyers ──────────────────────────────────────────────────────────────────────────────

export type ShipAddress = { name: string; street: string; zip: string; city: string };

/**
 * Pay for these real listings: on Stripe's page, or straight from the porte-monnaie when it covers everything.
 * Returns an error message, or null once the page is open (or the purchase done).
 */
export async function payCart(listingIds: number[], delivery: DeliveryId, dest: { relay?: Relay | null; shipAddress?: ShipAddress | null }, useWallet = false) {
  const a = dest.shipAddress;
  const r = await call<{ url?: string; sessionId: string; paid?: boolean }>('checkout', {
    listingIds, delivery, relay: dest.relay ?? null, shipAddress: a ?? null,
    // The address on one line too, for a payments function from before labels.
    address: a ? `${a.name}, ${a.street}, ${a.zip} ${a.city}` : '',
    fromApp: Platform.OS !== 'web',
    useWallet,
  });
  if (r.error) return r.error;
  // All paid from the porte-monnaie: no Stripe page, the confirmation right away.
  if (r.paid || !r.url) {
    void loadWallet();
    router.push(`/paid?session_id=${r.sessionId}`);
    return null;
  }
  await open(r.url);
  // Web: the page has left for Stripe. Phone: the browser is closed, see how the payment went.
  if (Platform.OS !== 'web') router.push(`/paid?session_id=${r.sessionId}`);
  return null;
}

export const checkoutStatus = (sessionId: string) =>
  call<{ status: 'pending' | 'paid' | 'cancelled'; orders: OrderRow[] }>('checkout-status', { sessionId })
    .then((r) => ({ ...r, orders: (r.orders ?? []).map(toOrder) }));

async function act(action: 'mark-shipped' | 'confirm-reception' | 'create-label' | 'tracking', orderId: string) {
  const r = await call<{ order: OrderRow }>(action, { orderId });
  if (!r.error) await loadOrders();
  return r.error ?? null;
}
export const markShipped = (orderId: string) => act('mark-shipped', orderId);
export const retryLabel = (orderId: string) => act('create-label', orderId);
/** Where the parcel is (the order updates itself once it's dropped off). */
export const refreshTracking = (orderId: string) => act('tracking', orderId);

/** Where the parcel is, in the carrier's tracking (Boxtal statuses). */
export const TRACKING_LABEL: Record<string, string> = {
  ANNOUNCED: 'Bordereau prêt, colis pas encore déposé',
  SHIPPED: 'Colis déposé par le vendeur',
  IN_TRANSIT: 'Colis en route',
  OUT_FOR_DELIVERY: 'En cours de livraison',
  FAILED_ATTEMPT: 'Livraison manquée',
  REACHED_DELIVERY_PICKUP_POINT: 'Arrivé au point relais',
  DELIVERED: 'Livré',
  RETURNED: "Renvoyé à l'expéditeur",
  EXCEPTION: 'Problème de livraison',
};

/** Mondial Relay points near a postcode. `unavailable`: labels aren't set up yet on the server. */
export async function findRelays(postalCode: string, city = '') {
  const r = await call<{ points: Relay[] }>('parcel-points', { postalCode, city });
  if (!r.error) return { points: r.points ?? [], error: null, unavailable: false };
  // No Boxtal keys yet, or a payments function from before labels: the seller picks the relay as before.
  // Anything else is shown, so a real problem doesn't hide behind the old way.
  return { points: [], error: r.error, unavailable: /pas encore disponible|action inconnue/i.test(r.error) };
}

/** A fresh link to the label PDF; opens it. Returns an error message, or null. */
export async function openLabel(orderId: string) {
  // Web: the new tab must open right on the tap, or the browser blocks it; it gets its address once known.
  const tab = Platform.OS === 'web' ? window.open('', '_blank') : null;
  const r = await call<{ url: string }>('label', { orderId });
  if (r.error) { tab?.close(); return r.error; }
  if (tab) tab.location.href = r.url;
  else await open(r.url);
  return null;
}

/** Close the account for good (the server keeps only what the law requires), then log out. Returns an error message, or null. */
export async function deleteAccount() {
  const r = await call<{ ok: boolean }>('delete-account');
  if (r.error) return r.error;
  await signOut();
  return null;
}
export const confirmReception = (orderId: string) => act('confirm-reception', orderId);

/** One line of the price check: what Boxtal charges for a parcel bracket, and what Pimou makes on it. */
export type PriceRow = {
  delivery: 'relais' | 'domicile'; parcel: string; kg: number; price: number;
  boxtalHt?: number; boxtalTtc?: number; margin?: number; error?: string;
};
/** Boxtal's real prices for every bracket (test server only, see the page /verifier-tarifs). */
export const checkPrices = () => call<{ rows: PriceRow[] }>('price-check');
