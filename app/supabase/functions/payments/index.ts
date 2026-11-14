// Pimou payments: Supabase Edge Function talking to Stripe Connect.
//
// Money flow ("separate charges and transfers"): the buyer pays Pimou on a Stripe Checkout page,
// the money stays on Pimou's Stripe balance, and once the buyer confirms reception Pimou transfers
// the price minus its commission to the seller's Stripe account. Shipping stays with Pimou, which
// pays the labels.
//
// Setup (Supabase dashboard): Edge Functions → Deploy a new function → name "payments", paste this
// file, turn OFF "Verify JWT" (the function checks the user itself), and add the secret
// STRIPE_SECRET_KEY (sk_test_… in test mode) under Edge Functions → Secrets. Optional: the secret
// RESEND_API_KEY (the Resend key) sends e-mails on each sale, shipment and payout.
//
// It also closes accounts ("delete-account"), which needs the server's rights (supabase/schema-9-suppression-compte.sql).
//
// Shipping labels (supabase/schema-10-bordereaux.sql) come from Boxtal: Mondial Relay to a point relais, Colissimo to
// the door. Secrets BOXTAL_ACCESS_KEY and BOXTAL_SECRET_KEY (an "API v3" application on Boxtal's developer site);
// BOXTAL_API_URL is the test server until set to https://api.boxtal.com. Optional: BOXTAL_RELAY_OFFER and
// BOXTAL_HOME_OFFER (offer codes), BOXTAL_CONTENT_ID (content category). Without the keys, no label is made.
// Each label's real cost goes to the label_costs table (supabase/schema-11-couts-bordereaux.sql), if it's there.

import Stripe from 'npm:stripe@23.0.0';
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

const APP_URL = 'https://anaissen.github.io/Nidoo/';
/** Pimou's commission on the price of each article, paid by the seller. */
const COMMISSION = 0.08;
const DELIVERIES = ['relais', 'domicile', 'main'] as const;
const DELIVERY_LABEL: Record<Delivery, string> = { relais: 'Livraison en point relais', domicile: 'Livraison à domicile', main: 'Remise en main propre' };
const MAX_ITEMS = 20;

/** The seller picks petit, moyen or grand when publishing: up to 0,5, 1 or 2 kg. */
const SIZES = ['petit', 'moyen', 'grand'] as const;
type ParcelSize = (typeof SIZES)[number];
const SIZE_KG: Record<ParcelSize, number> = { petit: 0.5, moyen: 1, grand: 2 };
/**
 * The carriers' weight brackets. One parcel per seller, declared at the smallest bracket its articles fit in
 * (a "grand" and a "petit": 2,5 kg, so the 3 kg one). Sides in cm, within Mondial Relay's and Colissimo's limits.
 */
const PARCELS = [
  { name: 'petit', weight: 0.5, length: 30, width: 20, height: 5 },
  { name: 'moyen', weight: 1, length: 35, width: 25, height: 10 },
  { name: 'grand', weight: 2, length: 40, width: 30, height: 15 },
  { name: '3 kg', weight: 3, length: 45, width: 35, height: 20 },
  { name: '5 kg', weight: 5, length: 50, width: 40, height: 20 },
  { name: '7 kg', weight: 7, length: 55, width: 40, height: 30 },
  { name: '10 kg', weight: 10, length: 60, width: 40, height: 30 },
] as const;
type Parcel = (typeof PARCELS)[number];
/**
 * What the buyer pays for one parcel, bracket by bracket (same order as PARCELS); it pays for the label: Boxtal's price
 * (grid of March 2024) + 20 % VAT, which Pimou can't get back, + a few cents. Same figures as SHIPPING_PRICES in the app.
 */
const SHIPPING: Record<Exclude<Delivery, 'main'>, number[]> = {
  relais: [3.99, 4.49, 6.29, 6.59, 11.9, 13.49, 13.49],
  domicile: [9.49, 11.49, 12.9, 14.49, 16.99, 18.99, 22.49],
};
const shippingPrice = (d: Delivery, parcel: Parcel) => (d === 'main' ? 0 : SHIPPING[d][PARCELS.indexOf(parcel)]);
/** A parcel saved on an order ("tres-grand" was the 5 kg one before the brackets). */
const parcelNamed = (name?: string | null) => PARCELS.find((p) => p.name === name) ?? (name === 'tres-grand' ? PARCELS[4] : PARCELS[1]);

type Delivery = (typeof DELIVERIES)[number];
type Listing = {
  id: number; seller_id: string; title: string; price: number | string; photos: string[] | null; status: string;
  type?: string; count?: number | null; category?: string | null; parcel_size?: ParcelSize | null;
};
/** The Mondial Relay point the buyer picked, and a home address for Colissimo. */
type Relay = { code: string; name: string; street: string; zip: string; city: string };
type ShipAddress = { name: string; street: string; zip: string; city: string };
type Order = {
  id: string; group_id: string; listing_id: number | null; buyer_id: string; seller_id: string; title: string; photo: string | null;
  price: number | string; shipping: number | string; commission: number | string; delivery: Delivery; address: string;
  status: 'pending' | 'paid' | 'shipped' | 'received' | 'cancelled'; stripe_session_id: string | null;
  payment_intent: string | null; charge_id: string | null; transfer_id: string | null;
  parcel_size?: string | null; relay?: Relay | null; ship_address?: ShipAddress | null;
  shipping_order_id?: string | null; tracking_number?: string | null; tracking_url?: string | null; tracking_status?: string | null; label_error?: string | null;
};
type Profile = { first_name?: string; last_name?: string; phone?: string; street?: string; zip?: string; city?: string };

/** Size of one listing's parcel, guessed when the seller didn't say (listings from before). */
function listingSize(l: Listing): ParcelSize {
  if (l.parcel_size && SIZES.includes(l.parcel_size)) return l.parcel_size;
  if (l.category === 'chaussures') return 'moyen';
  if (l.type === 'lot') return (l.count ?? 0) >= 6 ? 'grand' : 'moyen';
  return 'petit';
}
/** One parcel for all of a seller's articles: the smallest bracket their weights fit in, null over 10 kg. */
function parcelFor(listings: Listing[]): Parcel | null {
  const weight = listings.reduce((n, l) => n + SIZE_KG[listingSize(l)], 0);
  return PARCELS.find((p) => p.weight >= weight) ?? null;
}
/** A French mobile number as carriers want it ("+33612345678"), or null: they text the buyer when the parcel arrives. */
export function mobile(phone: string | null | undefined) {
  const m = /^(?:\+33|0033|0)([67]\d{8})$/.exec((phone ?? '').replace(/[\s.()-]/g, ''));
  return m ? `+33${m[1]}` : null;
}
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
function cleanRelay(v: unknown): Relay | null {
  const r = (v ?? {}) as Record<string, unknown>;
  const relay = { code: text(r.code, 40), name: text(r.name, 120), street: text(r.street, 160), zip: text(r.zip, 10), city: text(r.city, 80) };
  return relay.code && relay.name && /^\d{5}$/.test(relay.zip) && relay.city ? relay : null;
}
function cleanAddress(v: unknown): ShipAddress | null {
  const a = (v ?? {}) as Record<string, unknown>;
  const ship = { name: text(a.name, 80), street: text(a.street, 160), zip: text(a.zip, 10), city: text(a.city, 80) };
  return ship.name && ship.street.length >= 3 && /^\d{5}$/.test(ship.zip) && ship.city ? ship : null;
}
/** "Marie Dupont" → first and last name, as carriers print them. */
function splitName(full: string) {
  const [first, ...rest] = full.trim().split(/\s+/);
  return rest.length ? { firstName: first, lastName: rest.join(' ') } : { firstName: '-', lastName: first || '-' };
}

// ── Boxtal ────────────────────────────────────────────────────────────────────────────────

export class BoxtalError extends Error {
  constructor(readonly status: number, readonly body: unknown) {
    super(`Boxtal ${status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
}
export type Boxtal = {
  test: boolean;
  get: (path: string, query?: Record<string, string>) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  post: (path: string, body: unknown) => Promise<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
};
/** Boxtal's temporary token, kept between calls while it's valid (an instance of the function serves many calls). */
let boxtalToken: { value: string; until: number; keys: string } | null = null;

/**
 * Boxtal's API v3. Each call carries a temporary token ("Bearer"); the application's keys only get that token,
 * from /iam/account-app/token (basic auth: accessKey:secretKey). Null until the keys are in the secrets.
 */
export function boxtalClient(): Boxtal | null {
  const key = Deno.env.get('BOXTAL_ACCESS_KEY')?.trim(), secret = Deno.env.get('BOXTAL_SECRET_KEY')?.trim();
  if (!key || !secret) return null;
  const base = (Deno.env.get('BOXTAL_API_URL')?.trim() || 'https://api.boxtal.build').replace(/\/$/, '');
  const keys = `${base} ${key}`;
  const token = async (fresh: boolean) => {
    if (!fresh && boxtalToken?.keys === keys && boxtalToken.until > Date.now()) return boxtalToken.value;
    const res = await fetch(`${base}/iam/account-app/token`, { method: 'POST', headers: { Authorization: `Basic ${btoa(`${key}:${secret}`)}`, Accept: 'application/json' } });
    const json = await res.json().catch(() => null);
    if (!res.ok || typeof json?.accessToken !== 'string') throw new BoxtalError(res.status, { step: 'token', answer: json });
    // A little before it expires, to be safe.
    boxtalToken = { value: json.accessToken, until: Date.now() + Math.max(60, (Number(json.expiresIn) || 3600) - 120) * 1000, keys };
    return boxtalToken.value;
  };
  const call = async (method: string, path: string, query?: Record<string, string>, body?: unknown, again = false): Promise<unknown> => {
    const res = await fetch(`${base}${path}${query ? `?${new URLSearchParams(query)}` : ''}`, {
      method,
      headers: { Authorization: `Bearer ${await token(again)}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    // The token was refused (expired early, keys changed): a new one, once. Nothing was done with the refused call.
    if (res.status === 401 && !again) return call(method, path, query, body, true);
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new BoxtalError(res.status, json);
    return json;
  };
  return { test: !base.includes('api.boxtal.com'), get: (p, q) => call('GET', p, q), post: (p, b) => call('POST', p, undefined, b) };
}
const RELAY_OFFER = () => Deno.env.get('BOXTAL_RELAY_OFFER') ?? 'MONR-CpourToi';
const HOME_OFFER = () => Deno.env.get('BOXTAL_HOME_OFFER') ?? 'POFR-ColissimoAccess';
/** Tracking statuses once the seller has dropped the parcel. */
const ON_ITS_WAY = ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'FAILED_ATTEMPT', 'REACHED_DELIVERY_PICKUP_POINT', 'DELIVERED'];

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
const euros = (n: number) => `${n.toFixed(2).replace('.', ',')} €`;
/** Where parents write when something goes wrong. The e-mails themselves can't be answered. */
const CLAIM_EMAIL = 'reclamation@pimou.fr';
const claimLink = `<a href="mailto:${CLAIM_EMAIL}" style="color:#b2622d;">${CLAIM_EMAIL}</a>`;

/** Platforms must remind sellers of their tax and social duties at each sale (article 242 bis du CGI). */
const TAX_NOTE = "Impôts : vendre tes propres affaires d'occasion n'est en principe pas imposable. Acheter pour revendre, ou vendre très souvent, peut être une activité à déclarer. Plus d'informations sur <a href=\"https://www.impots.gouv.fr\" style=\"color:#8a8070;\">impots.gouv.fr</a> et <a href=\"https://www.urssaf.fr\" style=\"color:#8a8070;\">urssaf.fr</a>.";

const escapeHtml = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export type SendMail = (to: string, subject: string, html: string) => Promise<void>;

/** Through Resend, from a no-reply address (no mailbox behind it). Without a RESEND_API_KEY secret, no e-mail is sent. */
export const resendMail: SendMail = async (to, subject, html) => {
  const key = Deno.env.get('RESEND_API_KEY');
  if (!key) return;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'Pimou <ne-pas-repondre@pimou.fr>', to: [to], subject, html }),
  });
  if (!res.ok) console.error('Resend', res.status, await res.text());
};

/** Same look as the account e-mails (supabase/emails). `paragraphs` and `note` are already HTML-escaped. */
function mailHtml(title: string, paragraphs: string[], cta: { label: string; url: string }, note?: string) {
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#f5ead8;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5ead8;padding:32px 16px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#f9f4ed;border-radius:28px;padding:32px 28px;font-family:Helvetica,Arial,sans-serif;color:#201e1d;">
<tr><td align="center" style="padding-bottom:8px;"><img src="${APP_URL}email-logo.png" width="140" alt="Pimou" style="display:block;width:140px;height:auto;border:0;"></td></tr>
<tr><td style="font-size:24px;font-weight:bold;line-height:1.3;padding:8px 0 12px;">${title}</td></tr>
<tr><td style="font-size:16px;line-height:1.55;color:#474238;">${paragraphs.map((p) => `<p style="margin:0 0 12px;">${p}</p>`).join('')}</td></tr>
<tr><td align="center" style="padding:12px 0 20px;"><a href="${cta.url}" style="display:inline-block;background:#b2622d;color:#f9f4ed;text-decoration:none;font-weight:bold;font-size:17px;padding:16px 30px;border-radius:999px;">${cta.label}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#645c50;">À très vite,<br>L'équipe Pimou 🌱</td></tr>
<tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>
<tr><td style="font-size:12px;line-height:1.5;color:#8a8070;padding-top:16px;border-top:1px solid #e8dcc8;">${note ? `${note}<br><br>` : ''}Cet e-mail est envoyé automatiquement : merci de ne pas y répondre. Un souci avec une commande ? Écris à ${claimLink} en indiquant l'article concerné.</td></tr>
</table></td></tr></table></body></html>`;
}

export function makeHandler(stripe: Stripe, admin: SupabaseClient, sendMail: SendMail = resendMail, boxtal: Boxtal | null = boxtalClient()) {
  /** E-mail a parent about one of their orders. Never blocks or breaks the payment itself. */
  async function mailTo(userId: string, subject: string, paragraphs: string[], cta: { label: string; url: string }, note?: string) {
    try {
      const { data } = await admin.auth.admin.getUserById(userId);
      const to = data?.user?.email;
      if (to) await sendMail(to, subject, mailHtml(escapeHtml(subject), paragraphs, cta, note));
    } catch (e) {
      console.error('mail', e);
    }
  }
  async function displayName(userId: string) {
    const { data } = await admin.from('public_profiles').select('display_name').eq('id', userId).maybeSingle();
    return (data?.display_name as string | undefined) || 'Un parent';
  }

  // ── Sellers ───────────────────────────────────────────────────────────────────────────

  async function payoutAccount(user: User) {
    const { data } = await admin.from('payout_accounts').select('*').eq('user_id', user.id).maybeSingle();
    if (data) return data as { stripe_account_id: string; ready: boolean };
    // The seller's Stripe account, where Pimou sends their money; Stripe collects the identity checks.
    // (Stripe's lighter "recipient" agreement isn't available for a French platform paying French sellers.)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR',
      email: user.email,
      business_type: 'individual',
      capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      business_profile: {
        mcc: '5931', // used merchandise and second-hand stores
        product_description: "Vente de vêtements d'enfants d'occasion entre particuliers sur Pimou",
        url: APP_URL,
      },
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

  async function checkout(user: User, body: { listingIds?: unknown; delivery?: unknown; address?: unknown; relay?: unknown; shipAddress?: unknown; fromApp?: unknown }) {
    const delivery = body.delivery as Delivery;
    if (!DELIVERIES.includes(delivery)) throw new Refusal('Choisis un mode de livraison');
    const ids = [...new Set(Array.isArray(body.listingIds) ? body.listingIds.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [])].slice(0, MAX_ITEMS);
    if (!ids.length) throw new Refusal('Ton panier est vide');
    const ship = delivery === 'domicile' ? cleanAddress(body.shipAddress) : null;
    // (Older app versions send the address as one line.)
    const address = ship ? `${ship.name}, ${ship.street}, ${ship.zip} ${ship.city}` : text(body.address, 300);
    if (delivery === 'domicile' && address.length < 8) throw new Refusal('Indique ton adresse de livraison');
    const relay = delivery === 'relais' ? cleanRelay(body.relay) : null;
    if (delivery === 'relais' && boxtal && !relay) throw new Refusal('Choisis ton point relais');
    if (delivery !== 'main' && boxtal && !mobile((await contactOf(user.id)).phone)) {
      throw new Refusal("Ajoute ton numéro de portable : le transporteur t'envoie un SMS quand ton colis arrive.");
    }

    const { data, error } = await admin.from('listings').select('*').in('id', ids);
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
    // One parcel per seller, sized for all of their articles; its shipping is counted on their first article.
    const parcelOf = new Map(sellerIds.map((id) => [id, parcelFor(listings.filter((l) => l.seller_id === id))]));
    if (delivery !== 'main' && [...parcelOf.values()].some((p) => !p)) {
      throw new Refusal("Trop d'articles du même vendeur pour un seul colis (plus de 10 kg) : partage ta commande en deux.");
    }
    const charged = new Set<string>();
    const rows: Omit<Order, 'id' | 'status' | 'stripe_session_id' | 'payment_intent' | 'charge_id' | 'transfer_id'>[] = [];
    for (const l of listings) {
      const price = await agreedPrice(l, user.id);
      const parcel = parcelOf.get(l.seller_id) ?? PARCELS[0];
      const shipping = charged.has(l.seller_id) ? 0 : shippingPrice(delivery, parcel);
      charged.add(l.seller_id);
      rows.push({
        group_id: group, listing_id: l.id, buyer_id: user.id, seller_id: l.seller_id, title: l.title, photo: l.photos?.[0] ?? null,
        price, shipping, commission: round2(price * COMMISSION), delivery, address: delivery === 'domicile' ? address : '',
        ...(delivery === 'main' ? {} : { parcel_size: parcel.name, relay, ship_address: ship }),
      });
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = rows.map((r) => ({
      quantity: 1,
      price_data: { currency: 'eur', unit_amount: cents(Number(r.price)), product_data: { name: r.title, ...(r.photo ? { images: [r.photo] } : {}) } },
    }));
    for (const r of rows.filter((x) => Number(x.shipping) > 0)) {
      lineItems.push({
        quantity: 1,
        price_data: { currency: 'eur', unit_amount: cents(Number(r.shipping)), product_data: { name: `${DELIVERY_LABEL[delivery]} · colis ${r.parcel_size}` } },
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
      // The app may ask twice at once (payment page + background check): only one of them handles
      // each order. Stamping paid_at on a pending order is the atomic "I'm on it".
      const { data: mine } = await admin.from('orders').update({ paid_at: now }).eq('id', o.id).eq('status', 'pending').is('paid_at', null).select('id');
      if (!mine?.length) { out.push(await settledElsewhere(o)); continue; }
      // Atomic: only one buyer can turn the listing from active to sold.
      const { data: claimed } = await admin.from('listings').update({ status: 'sold' }).eq('id', o.listing_id).eq('status', 'active').select('id');
      if (claimed?.length) {
        const patch = { status: 'paid' as const, payment_intent: pi.id, charge_id: charge, paid_at: now };
        await admin.from('orders').update(patch).eq('id', o.id);
        out.push({ ...o, ...patch });
        const buyer = escapeHtml(await displayName(o.buyer_id));
        await mailTo(o.seller_id, `Tu as vendu « ${o.title} » sur Pimou 🎉`, [
          `Bonne nouvelle : ${buyer} vient d'acheter <strong>« ${escapeHtml(o.title)} »</strong>. Tu recevras ${euros(Number(o.price) - Number(o.commission))} dès que l'acheteur aura confirmé la réception.`,
          o.delivery === 'main'
            ? 'Fixez ensemble le lieu et l\'heure de la remise en main propre dans la messagerie de Pimou.'
            : boxtal
              ? `Ton bordereau prépayé t'attend dans l'appli : imprime-le, colle-le sur le colis et dépose-le sous 3 jours ${o.delivery === 'relais' ? 'dans un point Mondial Relay' : 'dans un bureau de poste'}.`
              : 'Prépare le colis et expédie-le sous 3 jours, puis indique-le dans l\'appli.',
        ], { label: 'Voir ma vente', url: `${APP_URL}commande/${o.id}` }, TAX_NOTE);
      } else {
        await stripe.refunds.create({ payment_intent: pi.id, amount: cents(Number(o.price) + Number(o.shipping)), metadata: { pimou_order: o.id } }, { idempotencyKey: `refund-${o.id}` });
        // payment_intent kept: it tells the app this one was paid, then refunded.
        await admin.from('orders').update({ status: 'cancelled', payment_intent: pi.id }).eq('id', o.id);
        out.push({ ...o, status: 'cancelled', payment_intent: pi.id });
      }
    }
    // Paid parcels get their label (Pimou pays it with the shipping fee).
    for (const sellerId of new Set(out.filter((o) => o.status === 'paid' && o.delivery !== 'main').map((o) => o.seller_id))) {
      const labelled = await createLabel(out.filter((o) => o.seller_id === sellerId && o.status === 'paid'));
      for (const l of labelled) out[out.findIndex((o) => o.id === l.id)] = l;
    }
    return { status: 'paid', orders: out };
  }

  /** Another call is settling this order: wait (briefly) for its result. */
  async function settledElsewhere(o: Order) {
    for (let i = 0; i < 10; i++) {
      const { data } = await admin.from('orders').select('*').eq('id', o.id).single();
      if (data && data.status !== 'pending') return data as Order;
      await new Promise((r) => setTimeout(r, 300));
    }
    return o;
  }

  async function orderFor(user: User, orderId: unknown, role: 'buyer' | 'seller' | 'either') {
    const { data } = await admin.from('orders').select('*').eq('id', String(orderId)).maybeSingle();
    const o = data as Order | null;
    const mine = o && (role === 'buyer' ? o.buyer_id === user.id : role === 'seller' ? o.seller_id === user.id : [o.buyer_id, o.seller_id].includes(user.id));
    if (!o || !mine) throw new Refusal('Commande introuvable');
    return o;
  }

  /** The articles of one seller in one payment: they travel in the same parcel, with one label. */
  async function parcelOf(o: Order) {
    const { data } = await admin.from('orders').select('*').eq('group_id', o.group_id).eq('seller_id', o.seller_id).in('status', ['paid', 'shipped', 'received']);
    return (data ?? []) as Order[];
  }

  /** The parcel left: the buyer is told once. */
  async function shipped(parcel: Order[]) {
    const ids = parcel.filter((o) => o.status === 'paid').map((o) => o.id);
    if (!ids.length) return parcel;
    const patch = { status: 'shipped' as const, shipped_at: new Date().toISOString() };
    const { data: moved } = await admin.from('orders').update(patch).in('id', ids).eq('status', 'paid').select('id');
    if (moved?.length) {
      const o = parcel[0], titles = parcel.map((x) => `« ${escapeHtml(x.title)} »`).join(', ');
      await mailTo(o.buyer_id, parcel.length > 1 ? 'Ton colis est en route 📦' : `« ${o.title} » est en route 📦`, [
        `${escapeHtml(await displayName(o.seller_id))} a expédié <strong>${titles}</strong>.`,
        ...(o.tracking_url ? [`Suis ton colis ici : <a href="${escapeHtml(o.tracking_url)}" style="color:#b2622d;">suivi ${o.delivery === 'relais' ? 'Mondial Relay' : 'Colissimo'}</a>.`] : []),
        'Dès que tu l\'as entre les mains, confirme la réception dans Pimou : c\'est ce qui déclenche le paiement du vendeur.',
        `Un problème à la réception (colis abîmé, article différent de l'annonce) ? Ne confirme pas et écris à ${claimLink} avec des photos.`,
      ], { label: 'Voir ma commande', url: `${APP_URL}commande/${o.id}` });
    }
    return parcel.map((o) => (ids.includes(o.id) ? { ...o, ...patch } : o));
  }

  async function markShipped(user: User, orderId: unknown) {
    const o = await orderFor(user, orderId, 'seller');
    if (o.status !== 'paid') throw new Refusal(o.status === 'shipped' ? 'Déjà indiqué comme expédié' : "Cette commande n'est pas à expédier");
    const parcel = await shipped(await parcelOf(o));
    return { order: parcel.find((x) => x.id === o.id) ?? o };
  }

  // ── Labels and tracking (Boxtal) ──────────────────────────────────────────────────────

  async function contactOf(userId: string) {
    const { data: p } = await admin.from('profiles').select('first_name, last_name, phone, street, zip, city').eq('id', userId).maybeSingle();
    const { data: u } = await admin.auth.admin.getUserById(userId);
    return { ...((p ?? {}) as Profile), email: u?.user?.email ?? '' };
  }

  let contentCache: string | null = null;
  /** Boxtal's content category for children's clothes. */
  async function contentId() {
    if (contentCache) return contentCache;
    const fixed = Deno.env.get('BOXTAL_CONTENT_ID');
    if (fixed) return (contentCache = fixed);
    const res = await boxtal!.get('/shipping/v3.1/content-category', { language: 'fr' });
    const list = (res?.content ?? []) as { id: string; label: string }[];
    const hit = list.find((c) => /v[êe]tement|habill|textile/i.test(c.label ?? ''));
    if (!hit) throw new Error(`no clothing content category among ${list.map((c) => c.label).join(', ')}`);
    return (contentCache = hit.id);
  }

  /**
   * What the label really costs (Boxtal's price before VAT) next to what the buyer paid for the parcel, for Pimou to
   * check its shipping prices (supabase/schema-11-couts-bordereaux.sql). Never in the way of the label itself.
   */
  async function saveLabelCost(parcel: Order[], shippingOrderId: string, costHt: unknown) {
    const lead = parcel[0];
    const cost = Number(costHt);
    try {
      const { error } = await admin.from('label_costs').insert({
        shipping_order_id: shippingOrderId, group_id: lead.group_id, delivery: lead.delivery, parcel_size: lead.parcel_size ?? null,
        paid_by_buyer: round2(parcel.reduce((n, o) => n + Number(o.shipping), 0)), boxtal_ht: costHt == null || !Number.isFinite(cost) ? null : cost,
      });
      if (error) console.error('label cost', error.message);
    } catch (e) {
      console.error('label cost', e);
    }
  }

  /** Order the parcel's label. A failure is written on the orders, for the seller to fix and retry; the sale itself stands. */
  async function createLabel(parcel: Order[]): Promise<Order[]> {
    const lead = parcel[0];
    if (!boxtal || !lead || lead.delivery === 'main' || parcel.some((o) => o.shipping_order_id)) return parcel;
    let patch: Partial<Order>;
    try {
      const [from, to] = await Promise.all([contactOf(lead.seller_id), contactOf(lead.buyer_id)]);
      const fromPhone = mobile(from.phone), toPhone = mobile(to.phone);
      if (!fromPhone || !from.street?.trim() || !/^\d{5}$/.test(from.zip ?? '') || !from.city?.trim()) {
        throw new Refusal('Ajoute ton adresse complète et ton numéro de portable dans « Mes informations », puis touche « Créer mon bordereau ».');
      }
      if (!toPhone) throw new Refusal("Le numéro de portable de l'acheteur manque : écris-lui pour qu'il l'ajoute dans « Mes informations ».");
      const contact = (c: Profile & { email: string }, phone: string) => ({ firstName: c.first_name || '-', lastName: c.last_name || '-', email: c.email, phone });
      const where = (street: string, zip: string, city: string) => ({ street, postalCode: zip, city, countryIsoCode: 'FR' });
      const relay = lead.relay, home = lead.ship_address;
      if (lead.delivery === 'relais' && !relay) throw new Refusal("Le point relais de l'acheteur manque : écris à reclamation@pimou.fr.");
      if (lead.delivery === 'domicile' && !home) throw new Refusal("L'adresse de l'acheteur manque : écris à reclamation@pimou.fr.");
      const toLocation = lead.delivery === 'domicile' ? where(home!.street, home!.zip, home!.city)
        : to.street && to.zip && to.city ? where(to.street, to.zip, to.city) : where(relay!.street, relay!.zip, relay!.city);
      const p = parcelNamed(lead.parcel_size);
      const res = await boxtal.post('/shipping/v3.1/shipping-order', {
        shippingOfferCode: lead.delivery === 'relais' ? RELAY_OFFER() : HOME_OFFER(),
        labelType: 'PDF_A4',
        shipment: {
          externalId: lead.id,
          packages: [{
            type: 'PARCEL', weight: p.weight, length: p.length, width: p.width, height: p.height,
            value: { value: round2(parcel.reduce((n, o) => n + Number(o.price), 0)), currency: 'EUR' },
            content: { id: await contentId(), description: "Vêtements d'enfants d'occasion" },
          }],
          fromAddress: { type: 'RESIDENTIAL', contact: contact(from, fromPhone), location: where(from.street!.trim(), from.zip!, from.city!.trim()) },
          toAddress: { type: 'RESIDENTIAL', contact: home ? { ...contact(to, toPhone), ...splitName(home.name) } : contact(to, toPhone), location: toLocation },
          ...(relay ? { pickupPointCode: relay.code } : {}),
        },
      });
      const id = res?.content?.id as string | undefined;
      if (!id) throw new Error(`no shipping order id: ${JSON.stringify(res).slice(0, 300)}`);
      patch = { shipping_order_id: id, label_error: null };
      await saveLabelCost(parcel, id, res?.content?.deliveryPriceExclTax?.value);
    } catch (e) {
      console.error('label', e);
      // In test mode, Boxtal's own words help setting things up.
      const detail = boxtal.test && e instanceof BoxtalError ? ` (Boxtal test : ${JSON.stringify(e.body).slice(0, 200)})` : '';
      patch = { label_error: e instanceof Refusal ? e.message : `Le bordereau n'a pas pu être créé. Réessaie dans un moment ou écris à reclamation@pimou.fr.${detail}` };
    }
    await admin.from('orders').update(patch).in('id', parcel.map((o) => o.id));
    return parcel.map((o) => ({ ...o, ...patch }));
  }

  /** The seller retries after fixing what was missing (phone, address…). */
  async function retryLabel(user: User, orderId: unknown) {
    const o = await orderFor(user, orderId, 'seller');
    const parcel = (await parcelOf(o)).filter((x) => x.status === 'paid');
    if (!parcel.length) throw new Refusal("Cette commande n'est pas à expédier");
    const done = await createLabel(parcel);
    const mine = done.find((x) => x.id === o.id) ?? done[0];
    if (mine.label_error) throw new Refusal(mine.label_error);
    return { order: mine };
  }

  /** A fresh link to the label PDF (Boxtal's links expire after 7 days). */
  async function labelLink(user: User, orderId: unknown) {
    const o = await orderFor(user, orderId, 'seller');
    if (!boxtal || !o.shipping_order_id) throw new Refusal("Ce bordereau n'existe pas encore.");
    try {
      const res = await boxtal.get(`/shipping/v3.1/shipping-order/${encodeURIComponent(o.shipping_order_id)}/shipping-document`);
      const doc = ((res?.content ?? []) as { type: string; url: string }[]).find((d) => d.type === 'LABEL');
      if (doc?.url) return { url: doc.url };
    } catch (e) {
      if (!(e instanceof BoxtalError && e.status === 422)) throw e;
    }
    throw new Refusal('Ton bordereau est en cours de création : réessaie dans une minute.');
  }

  /** Where the parcel is. Once dropped off, the order counts as shipped (and the buyer is told). */
  async function refreshTracking(parcel: Order[]): Promise<Order[]> {
    const lead = parcel.find((o) => o.shipping_order_id);
    if (!boxtal || !lead) return parcel;
    let t: { status?: string; trackingNumber?: string; packageTrackingUrl?: string } | undefined;
    try {
      t = (await boxtal.get(`/shipping/v3.1/shipping-order/${encodeURIComponent(lead.shipping_order_id!)}/tracking`))?.content?.[0];
    } catch (e) {
      // 422: no tracking yet.
      if (!(e instanceof BoxtalError && e.status === 422)) console.error('tracking', e);
      return parcel;
    }
    if (!t?.status) return parcel;
    const patch = { tracking_status: t.status, tracking_number: t.trackingNumber ?? null, tracking_url: t.packageTrackingUrl ?? null };
    if (parcel.some((o) => o.tracking_status !== patch.tracking_status || o.tracking_url !== patch.tracking_url)) {
      await admin.from('orders').update(patch).in('id', parcel.map((o) => o.id));
    }
    const out = parcel.map((o) => ({ ...o, ...patch }));
    return ON_ITS_WAY.includes(t.status) ? await shipped(out) : out;
  }

  async function tracking(user: User, orderId: unknown) {
    const o = await orderFor(user, orderId, 'either');
    const parcel = await refreshTracking(await parcelOf(o));
    return { order: parcel.find((x) => x.id === o.id) ?? o };
  }

  /** Relay points near the buyer where Mondial Relay can deliver. */
  async function parcelPoints(body: { postalCode?: unknown; city?: unknown }) {
    if (!boxtal) throw new Refusal("Le choix du point relais n'est pas encore disponible.");
    const postalCode = text(body.postalCode, 5), city = text(body.city, 80);
    if (!/^\d{5}$/.test(postalCode)) throw new Refusal('Indique un code postal à 5 chiffres');
    const res = await boxtal.get('/shipping/v3.2/parcel-point-by-shipping-offer', {
      shippingOfferCode: RELAY_OFFER(), operationType: 'ARRIVAL', postalCode, ...(city ? { city } : {}), countryIsoCode: 'FR',
    });
    type Found = { parcelPoint?: { code?: string; name?: string; location?: { number?: string; street?: string; postalCode?: string; city?: string } }; distanceFromSearchLocation?: number };
    const points = ((res?.content ?? []) as Found[]).flatMap(({ parcelPoint: p, distanceFromSearchLocation: d }) => {
      if (!p?.code || !p.name || !p.location?.postalCode || !p.location.city) return [];
      return [{ code: String(p.code), name: p.name, street: [p.location.number, p.location.street].filter(Boolean).join(' '), zip: String(p.location.postalCode), city: p.location.city, distance: d ?? null }];
    });
    return { points: points.slice(0, 15) };
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
    await mailTo(o.seller_id, 'Ton argent est en route 💶', [
      `${escapeHtml(await displayName(o.buyer_id))} a bien reçu <strong>« ${escapeHtml(o.title)} »</strong>.`,
      `${euros(Number(o.price) - Number(o.commission))} sont en route vers ton compte bancaire : ils arrivent en général en quelques jours ouvrés.`,
    ], { label: 'Voir ma vente', url: `${APP_URL}commande/${o.id}` });
    return { order: { ...o, ...patch } };
  }

  // ── Closing an account ─────────────────────────────────────────────────────────────────

  /**
   * Everything personal goes with the account (profile, passports, listings and their photos, conversations).
   * What the law makes Pimou keep stays: past orders (accounting) without the address, the CGU acceptance,
   * and, in closed_accounts, the e-mail and Stripe account (yearly tax declarations). Reviews written stay, unsigned.
   */
  async function deleteAccount(user: User) {
    // A payment left open on Stripe's page: settle it, or close it so it can't go through afterwards.
    const { data: pending } = await admin.from('orders').select('stripe_session_id').eq('buyer_id', user.id).eq('status', 'pending');
    for (const id of new Set((pending ?? []).map((r) => r.stripe_session_id).filter(Boolean)) as Set<string>) {
      if ((await settle(id, user.id)).status !== 'pending') continue;
      // Paid in the meantime, expiring fails: the second look settles it either way (paid, or cancelled).
      await stripe.checkout.sessions.expire(id).catch((e: unknown) => console.error('expire', e));
      await settle(id, user.id);
    }
    // Nobody is left waiting for an article or for their money.
    for (const side of ['buyer_id', 'seller_id']) {
      const { data: open } = await admin.from('orders').select('id').eq(side, user.id).in('status', ['paid', 'shipped']).limit(1);
      if (open?.length) {
        throw new Refusal(side === 'buyer_id'
          ? "Tu attends encore un article : confirme sa réception (ou écris à reclamation@pimou.fr en cas de problème), puis tu pourras supprimer ton compte."
          : "Tu as une vente en cours : une fois l'article reçu par l'acheteur, tu pourras supprimer ton compte.");
      }
    }
    const { data: acc } = await admin.from('payout_accounts').select('stripe_account_id').eq('user_id', user.id).maybeSingle();
    const { error: keptError } = await admin.from('closed_accounts').upsert({ user_id: user.id, email: user.email ?? '', stripe_account_id: acc?.stripe_account_id ?? null });
    if (keptError) throw new Error(`closed_accounts: ${keptError.message}`);
    // Orders stay for the accounts, without the delivery address or the photo (the photos go below).
    await admin.from('orders').update({ address: '' }).eq('buyer_id', user.id);
    await admin.from('orders').update({ photo: null }).eq('seller_id', user.id);
    // Photos: they live in photos/<user id>/, and only the storage API may delete them.
    for (let round = 0; round < 50; round++) {
      const { data: files } = await admin.storage.from('photos').list(user.id, { limit: 100 });
      if (!files?.length) break;
      await admin.storage.from('photos').remove(files.map((f) => `${user.id}/${f.name}`));
    }
    // The rest goes with the account itself (profile, passports, listings, conversations…).
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(`deleteUser: ${error.message}`);
    return { ok: true };
  }

  // ── Entry point ───────────────────────────────────────────────────────────────────────

  return async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
    let action = '';
    try {
      const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      const { data: { user } } = await admin.auth.getUser(token);
      if (!user) return reply({ error: 'Connecte-toi pour continuer' }, 401);
      const body = await req.json().catch(() => ({}));
      action = String(body.action ?? '');

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
          // Parcels on their way: where are they? And labels that failed for want of a phone or an address: try again.
          const open: Order[] = [];
          for (const side of ['buyer_id', 'seller_id']) {
            const { data: rows } = await admin.from('orders').select('*').eq(side, user.id).in('status', ['paid', 'shipped']).neq('delivery', 'main').limit(20);
            open.push(...((rows ?? []) as Order[]));
          }
          const seen = new Set<string>();
          for (const o of open) {
            const key = `${o.group_id}/${o.seller_id}`;
            if (seen.has(key) || seen.size >= 10) continue;
            seen.add(key);
            const parcel = await parcelOf(o);
            if (!o.shipping_order_id && o.label_error && o.seller_id === user.id) await createLabel(parcel.filter((x) => x.status === 'paid'));
            else await refreshTracking(parcel);
          }
          return reply({ ok: true });
        }
        case 'parcel-points':
          return reply(await parcelPoints(body));
        case 'label':
          return reply(await labelLink(user, body.orderId));
        case 'create-label':
          return reply(await retryLabel(user, body.orderId));
        case 'tracking':
          return reply(await tracking(user, body.orderId));
        case 'mark-shipped':
          return reply(await markShipped(user, body.orderId));
        case 'confirm-reception':
          return reply(await confirmReception(user, body.orderId));
        case 'delete-account':
          try {
            return reply(await deleteAccount(user));
          } catch (e) {
            if (e instanceof Refusal) throw e;
            console.error('delete-account', e);
            return reply({ error: "La suppression n'a pas pu aboutir, réessaie dans un instant ou écris à reclamation@pimou.fr." }, 500);
          }
        default:
          return reply({ error: 'Action inconnue' }, 400);
      }
    } catch (e) {
      if (e instanceof Refusal) return reply({ error: e.message }, 400);
      console.error(e);
      // In test mode, show Stripe's own explanation: it makes setting things up much easier.
      const testMode = (Deno.env.get('STRIPE_SECRET_KEY') ?? '').startsWith('sk_test_');
      const stripeMessage = (e as { type?: string; message?: string })?.type?.startsWith('Stripe') ? (e as Error).message : null;
      if (testMode && stripeMessage) return reply({ error: `Stripe (test) : ${stripeMessage}` }, 500);
      // Same for Boxtal while on its test server.
      if (e instanceof BoxtalError && boxtal?.test) {
        const keysRefused = (e.body as { step?: string } | null)?.step === 'token';
        return reply({ error: keysRefused
          ? `Boxtal (test) : clés refusées (erreur ${e.status}). Vérifie BOXTAL_ACCESS_KEY et BOXTAL_SECRET_KEY : ce doivent être celles de l'espace de test de Boxtal.`
          : `Boxtal (test) : erreur ${e.status} ${JSON.stringify(e.body ?? '').slice(0, 300)}` }, 500);
      }
      const what = action === 'parcel-points' ? 'La recherche de points relais' : action === 'label' || action === 'tracking' ? 'La demande au transporteur' : 'Le paiement';
      return reply({ error: `${what} n'a pas pu aboutir, réessaie dans un instant.` }, 500);
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
