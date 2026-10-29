import type { RealtimeChannel } from '@supabase/supabase-js';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { DeliveryId, Seller } from '../data/catalog';
import { RealOrder, useStore } from '../store/useStore';
import { currentUser, supabase } from './backend';
import { sellerFromRow, SellerRow } from './listings';

// The money side lives in the "payments" Edge Function (supabase/functions/payments): Stripe keys never
// reach the phone. Stripe is in test mode for now: test cards only, no real money moves.

type OrderRow = {
  id: string; group_id: string; listing_id: number | null; buyer_id: string; seller_id: string; title: string; photo: string | null;
  price: number | string; shipping: number | string; commission: number | string; delivery: DeliveryId; address: string;
  status: RealOrder['status']; payment_intent: string | null; created_at: string;
};

const toOrder = (r: OrderRow): RealOrder => ({
  id: r.id, groupId: r.group_id, listingId: r.listing_id, buyerId: r.buyer_id, sellerId: r.seller_id, title: r.title, photo: r.photo,
  price: Number(r.price), shipping: Number(r.shipping), commission: Number(r.commission), delivery: r.delivery, address: r.address,
  status: r.status, refunded: r.status === 'cancelled' && !!r.payment_intent, createdAt: r.created_at,
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
  useStore.setState({ realOrders: orders });
  announce(orders);
}

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
let started = false;
/** Call once at startup: finish half-done payments, then keep the orders up to date. */
export function startPayments() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) {
      channel?.unsubscribe(); channel = null;
      known = null;
      useStore.setState({ realOrders: [], payout: null });
      return;
    }
    if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
    const me = session.user.id;
    setTimeout(async () => {
      await loadOrders();
      void call('sync').then(loadOrders);
      channel?.unsubscribe();
      channel = supabase.channel(`orders-${me}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => { void loadOrders(); })
        .subscribe();
    }, 50);
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

// ── Buyers ──────────────────────────────────────────────────────────────────────────────

/** Pay for these real listings on Stripe's page. Returns an error message, or null once the page is open. */
export async function payCart(listingIds: number[], delivery: DeliveryId, address: string) {
  const r = await call<{ url: string; sessionId: string }>('checkout', { listingIds, delivery, address, fromApp: Platform.OS !== 'web' });
  if (r.error) return r.error;
  await open(r.url);
  // Web: the page has left for Stripe. Phone: the browser is closed, see how the payment went.
  if (Platform.OS !== 'web') router.push(`/paid?session_id=${r.sessionId}`);
  return null;
}

export const checkoutStatus = (sessionId: string) =>
  call<{ status: 'pending' | 'paid' | 'cancelled'; orders: OrderRow[] }>('checkout-status', { sessionId })
    .then((r) => ({ ...r, orders: (r.orders ?? []).map(toOrder) }));

async function act(action: 'mark-shipped' | 'confirm-reception', orderId: string) {
  const r = await call<{ order: OrderRow }>(action, { orderId });
  if (!r.error) await loadOrders();
  return r.error ?? null;
}
export const markShipped = (orderId: string) => act('mark-shipped', orderId);
export const confirmReception = (orderId: string) => act('confirm-reception', orderId);
