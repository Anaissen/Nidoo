// Pimou payments: Supabase Edge Function talking to Stripe Connect.
//
// Money flow ("separate charges and transfers"): the buyer pays Pimou on a Stripe Checkout page,
// the money stays on Pimou's Stripe balance, and once the buyer confirms reception Pimou transfers
// the price minus its commission to the seller's Stripe account. Shipping stays with Pimou, which
// pays the labels.
//
// Setup (Supabase dashboard): Edge Functions → Deploy a new function → name "payments", paste this
// file, turn OFF "Verify JWT" (the function checks the user itself), and add the secret
// STRIPE_SECRET_KEY (sk_test_… in test mode) under Edge Functions → Secrets.

import Stripe from 'npm:stripe@23.0.0';
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

const APP_URL = 'https://anaissen.github.io/Nidoo/';
/** Pimou's commission on the price of each article, paid by the seller. */
const COMMISSION = 0.08;
const SHIPPING: Record<Delivery, number> = { relais: 3.9, domicile: 5.9, main: 0 };
const DELIVERY_LABEL: Record<Delivery, string> = { relais: 'Livraison en point relais', domicile: 'Livraison à domicile', main: 'Remise en main propre' };
const MAX_ITEMS = 20;

type Delivery = 'relais' | 'domicile' | 'main';
type Listing = { id: number; seller_id: string; title: string; price: number | string; photos: string[] | null; status: string };
type Order = {
  id: string; group_id: string; listing_id: number | null; buyer_id: string; seller_id: string; title: string; photo: string | null;
  price: number | string; shipping: number | string; commission: number | string; delivery: Delivery; address: string;
  status: 'pending' | 'paid' | 'shipped' | 'received' | 'cancelled'; stripe_session_id: string | null;
  payment_intent: string | null; charge_id: string | null; transfer_id: string | null;
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
/** A message the app shows as is. */
class Refusal extends Error {}

const cents = (euros: number) => Math.round(euros * 100);
const round2 = (n: number) => Math.round(n * 100) / 100;

export function makeHandler(stripe: Stripe, admin: SupabaseClient) {
  // ── Sellers ───────────────────────────────────────────────────────────────────────────

  async function payoutAccount(user: User) {
    const { data } = await admin.from('payout_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (data) return data as { stripe_account_id: string; ready: boolean };
    // A Stripe account that only receives transfers from Pimou; Stripe collects the identity checks.
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: user.email,
      business_type: 'individual',
      capabilities: { transfers: { requested: true } },
      tos_acceptance: { service_agreement: 'recipient' },
      business_profile: { product_description: "Vente de vêtements d'enfants d'occasion entre particuliers sur Pimou", url: APP_URL },
      metadata: { pimou_user: user.id },
    });
    const row = { user_id: user.id, stripe_account_id: account.id, ready: false };
    const { error } = await admin.from('payout_accounts').insert(row);
    if (error) throw error;
    return row;
  }

  async function refreshSeller(user: User) {
    const acc = await payoutAccount(user);
    const a = await stripe.accounts.retrieve(acc.stripe_account_id);
    const ready = !!a.payouts_enabled && a.capabilities?.transfers === 'active';
    if (ready !== acc.ready) await admin.from('payout_accounts').update({ ready, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    return { ready, submitted: !!a.details_submitted };
  }

  // ── Orders ────────────────────────────────────────────────────────────────────────────

  /** Price agreed in the chat (the last word on price is an "accept"), else the listed price. */
  async function agreedPrice(listing: Listing, buyerId: string) {
    const listed = Number(listing.price);
    const { data: conv } = await admin.from('conversations').select('id').eq('listing_id', listing.id).eq('buyer_id', buyerId).maybeSingle();
    if (!conv) return listed;
    const { data: last } = await admin.from('messages').select('kind, amount').eq('conversation_id', conv.id)
      .neq('kind', 'text').order('created_at', { ascending: false }).limit(1).maybeSingle();
    const amount = Number(last?.amount);
    return last?.kind === 'accept' && amount > 0 && amount <= listed ? amount : listed;
  }

  async function checkout(user: User, body: { listingIds?: unknown; delivery?: unknown; address?: unknown; fromApp?: unknown }) {
    const delivery = body.delivery as Delivery;
    if (!(delivery in SHIPPING)) throw new Refusal('Choisis un mode de livraison');
    const ids = [...new Set(Array.isArray(body.listingIds) ? body.listingIds.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [])].slice(0, MAX_ITEMS);
    if (!ids.length) throw new Refusal('Ton panier est vide');
    const address = typeof body.address === 'string' ? body.address.slice(0, 300) : '';
    if (delivery === 'domicile' && address.trim().length < 8) throw new Refusal('Indique ton adresse de livraison');

    const { data, error } = await admin.from('listings').select('id, seller_id, title, price, photos, status').in('id', ids);
    if (error) throw error;
    const listings = (data ?? []) as Listing[];
    for (const id of ids) {
      const l = listings.find((x) => x.id === id);
      if (!l || l.status !== 'active') throw new Refusal(`« ${l?.title ?? 'Un article'} » n'est plus disponible`);
      if (l.seller_id === user.id) throw new Refusal('Tu ne peux pas acheter ta propre annonce');
    }
    // Every seller must be able to receive their money.
    const sellerIds = [...new Set(listings.map((l) => l.seller_id))];
    const { data: accounts } = await admin.from('payout_accounts').select('user_id, ready').in('user_id', sellerIds);
    const notReady = sellerIds.filter((id) => !accounts?.some((a) => a.user_id === id && a.ready));
    if (notReady.length) {
      const { data: names } = await admin.from('public_profiles').select('id, display_name').in('id', notReady);
      const who = (names ?? []).map((n) => n.display_name).join(', ') || 'Ce vendeur';
      throw new Refusal(`${who} n'a pas encore activé ses paiements : écris-lui pour le prévenir.`);
    }

    const group = crypto.randomUUID();
    const charged = new Set<string>();
    const rows: Omit<Order, 'id' | 'status' | 'stripe_session_id' | 'payment_intent' | 'charge_id' | 'transfer_id'>[] = [];
    for (const l of listings) {
      const price = await agreedPrice(l, user.id);
      // One parcel per seller: shipping is counted on their first article.
      const shipping = charged.has(l.seller_id) ? 0 : SHIPPING[delivery];
      charged.add(l.seller_id);
      rows.push({
        group_id: group, listing_id: l.id, buyer_id: user.id, seller_id: l.seller_id, title: l.title, photo: l.photos?.[0] ?? null,
        price, shipping, commission: round2(price * COMMISSION), delivery, address: delivery === 'domicile' ? address : '',
      });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = rows.map((r) => ({
      quantity: 1,
      price_data: { currency: 'eur', unit_amount: cents(Number(r.price)), product_data: { name: r.title, ...(r.photo ? { images: [r.photo] } : {}) } },
    }));
    const parcels = rows.filter((r) => Number(r.shipping) > 0);
    if (parcels.length) {
      lineItems.push({
        quantity: parcels.length,
        price_data: { currency: 'eur', unit_amount: cents(SHIPPING[delivery]), product_data: { name: DELIVERY_LABEL[delivery] } },
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'fr',
      customer_email: user.email,
      line_items: lineItems,
      payment_intent_data: { transfer_group: group, metadata: { pimou_group: group } },
      metadata: { pimou_group: group, pimou_buyer: user.id },
      // From the phone app, the Stripe page opens in a browser: the page it ends on just says to go back to the app.
      success_url: `${APP_URL}paid?session_id={CHECKOUT_SESSION_ID}${body.fromApp ? '&app=1' : ''}`,
      cancel_url: `${APP_URL}cart?cancelled=1${body.fromApp ? '&app=1' : ''}`,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });
    const { error: insertError } = await admin.from('orders').insert(rows.map((r) => ({ ...r, stripe_session_id: session.id })));
    if (insertError) throw insertError;
    return { url: session.url, sessionId: session.id };
  }

  /** Once Stripe says a Checkout is paid: claim the articles, refund any sold to someone else meanwhile. */
  async function settle(sessionId: string, buyerId: string) {
    const { data } = await admin.from('orders').select('*').eq('stripe_session_id', sessionId).eq('buyer_id', buyerId);
    const orders = (data ?? []) as Order[];
    if (!orders.some((o) => o.status === 'pending')) return { status: orders.every((o) => o.status === 'cancelled') ? 'cancelled' : 'paid', orders };

    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['payment_intent'] });
    if (session.status === 'expired') {
      await admin.from('orders').update({ status: 'cancelled' }).eq('stripe_session_id', sessionId).eq('status', 'pending');
      return { status: 'cancelled', orders: orders.map((o) => ({ ...o, status: 'cancelled' as const })) };
    }
    if (session.payment_status !== 'paid') return { status: 'pending', orders };

    const pi = session.payment_intent as Stripe.PaymentIntent;
    const charge = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id ?? null;
    const now = new Date().toISOString();
    const out: Order[] = [];
    for (const o of orders) {
      if (o.status !== 'pending') { out.push(o); continue; }
      // Atomic: only one buyer can turn the listing from active to sold.
      const { data: claimed } = await admin.from('listings').update({ status: 'sold' }).eq('id', o.listing_id).eq('status', 'active').select('id');
      if (claimed?.length) {
        const patch = { status: 'paid' as const, payment_intent: pi.id, charge_id: charge, paid_at: now };
        await admin.from('orders').update(patch).eq('id', o.id);
        out.push({ ...o, ...patch });
      } else {
        await stripe.refunds.create({ payment_intent: pi.id, amount: cents(Number(o.price) + Number(o.shipping)), metadata: { pimou_order: o.id } }, { idempotencyKey: `refund-${o.id}` });
        await admin.from('orders').update({ status: 'cancelled' }).eq('id', o.id);
        out.push({ ...o, status: 'cancelled' });
      }
    }
    return { status: 'paid', orders: out };
  }

  async function orderFor(user: User, orderId: unknown, role: 'buyer' | 'seller') {
    const { data } = await admin.from('orders').select('*').eq('id', String(orderId)).maybeSingle();
    const o = data as Order | null;
    if (!o || (role === 'buyer' ? o.buyer_id : o.seller_id) !== user.id) throw new Refusal('Commande introuvable');
    return o;
  }

  async function markShipped(user: User, orderId: unknown) {
    const o = await orderFor(user, orderId, 'seller');
    if (o.status !== 'paid') throw new Refusal(o.status === 'shipped' ? 'Déjà indiqué comme expédié' : "Cette commande n'est pas à expédier");
    const patch = { status: 'shipped' as const, shipped_at: new Date().toISOString() };
    await admin.from('orders').update(patch).eq('id', o.id);
    return { order: { ...o, ...patch } };
  }

  /** The buyer has the clothes: pay the seller. */
  async function confirmReception(user: User, orderId: unknown) {
    const o = await orderFor(user, orderId, 'buyer');
    if (o.status === 'received') return { order: o };
    if (o.status !== 'paid' && o.status !== 'shipped') throw new Refusal("Cette commande n'est pas encore payée");
    if (o.delivery !== 'main' && o.status !== 'shipped') throw new Refusal("Le vendeur n'a pas encore expédié le colis");
    const { data: acc } = await admin.from('payout_accounts').select('stripe_account_id').eq('user_id', o.seller_id).single();
    const transfer = await stripe.transfers.create({
      amount: cents(Number(o.price) - Number(o.commission)),
      currency: 'eur',
      destination: acc!.stripe_account_id,
      transfer_group: o.group_id,
      ...(o.charge_id ? { source_transaction: o.charge_id } : {}),
      metadata: { pimou_order: o.id },
    }, { idempotencyKey: `release-${o.id}` });
    const patch = { status: 'received' as const, transfer_id: transfer.id, received_at: new Date().toISOString() };
    await admin.from('orders').update(patch).eq('id', o.id);
    return { order: { ...o, ...patch } };
  }

  // ── Entry point ───────────────────────────────────────────────────────────────────────

  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    try {
      const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      const { data: { user } } = await admin.auth.getUser(token);
      if (!user) return reply({ error: 'Connecte-toi pour continuer' }, 401);
      const body = await req.json().catch(() => ({}));

      switch (body.action) {
        case 'seller-onboarding': {
          const acc = await payoutAccount(user);
          const link = await stripe.accountLinks.create({
            account: acc.stripe_account_id, type: 'account_onboarding',
            refresh_url: `${APP_URL}payouts?refresh=1`, return_url: `${APP_URL}payouts?done=1`,
          });
          return reply({ url: link.url });
        }
        case 'seller-status':
          return reply(await refreshSeller(user));
        case 'seller-dashboard': {
          const acc = await payoutAccount(user);
          const link = await stripe.accounts.createLoginLink(acc.stripe_account_id);
          return reply({ url: link.url });
        }
        case 'checkout':
          return reply(await checkout(user, body));
        case 'checkout-status':
          return reply(await settle(String(body.sessionId ?? ''), user.id));
        case 'sync': {
          // Payments left half-way (app closed on the Stripe page): settle them now.
          const { data } = await admin.from('orders').select('stripe_session_id').eq('buyer_id', user.id).eq('status', 'pending');
          for (const id of new Set((data ?? []).map((r) => r.stripe_session_id).filter(Boolean))) await settle(id as string, user.id);
          return reply({ ok: true });
        }
        case 'mark-shipped':
          return reply(await markShipped(user, body.orderId));
        case 'confirm-reception':
          return reply(await confirmReception(user, body.orderId));
        default:
          return reply({ error: 'Action inconnue' }, 400);
      }
    } catch (e) {
      if (e instanceof Refusal) return reply({ error: e.message }, 400);
      console.error(e);
      return reply({ error: "Le paiement n'a pas pu aboutir, réessaie dans un instant." }, 500);
    }
  };
}

const stripeClient = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', { httpClient: Stripe.createFetchHttpClient() });
const adminClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '',
  { auth: { persistSession: false } },
);
Deno.serve(makeHandler(stripeClient, adminClient));
