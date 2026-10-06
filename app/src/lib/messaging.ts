import type { RealtimeChannel } from '@supabase/supabase-js';

import { Product, Seller } from '../data/catalog';
import { Chat, Msg, OfferKind, remoteChat, useStore } from '../store/useStore';
import { currentUser, supabase } from './backend';
import { fmt } from './format';
import { ListingRow, marketLoaded, sellerFromRow, SellerRow, toProduct } from './listings';

type ConvRow = { id: string; listing_id: number; buyer_id: string; seller_id: string; created_at: string; last_message_at: string };
type MsgRow = { id: number; conversation_id: string; sender_id: string; kind: 'text' | OfferKind; body: string; amount: number | string | null; created_at: string; read_at: string | null };

const cidOf = (convId: string) => `r-${convId}`;
const LISTING_OFFSET = 100000;

/** Real listing from another parent: talk through the server. Demo listings keep their simulated chat. */
export const isRemoteListing = (p: Product) => p.remoteId != null && p.sid !== 'me';

/** "14:05" today, "hier", "lun.", or "12/09". */
function whenLabel(iso: string) {
  const d = new Date(iso), now = new Date();
  const days = Math.floor((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  if (days <= 0) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (days === 1) return 'Hier';
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'short' });
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

const toMsg = (r: MsgRow, me: string): Msg => ({
  id: r.id, at: r.created_at, me: r.sender_id === me, t: r.body,
  offer: r.kind === 'text' ? undefined : { kind: r.kind, amount: Number(r.amount ?? 0) },
});

/** Where the price talk stands: the last offer / counter / answer in the conversation. */
export function negotiation(msgs: Msg[]) {
  const last = [...msgs].reverse().find((m) => m.offer);
  return last?.offer ? { ...last.offer, mine: last.me } : null;
}

// ── Local state ─────────────────────────────────────────────────────────────────────────

let convs: Record<string, ConvRow> = {};
let rows: Record<string, MsgRow[]> = {};

/** Rebuild the app's chats (and the buyer's offers) from the server rows. */
function publish() {
  const me = currentUser()?.id;
  if (!me) return;
  useStore.setState((s) => {
    const demo = Object.fromEntries(Object.entries(s.chats).filter(([, c]) => !c.remote));
    const chats: Record<string, Chat> = {};
    const offers = { ...s.offers };
    const sorted = Object.values(convs).sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
    for (const c of sorted) {
      const cid = cidOf(c.id);
      const list = (rows[c.id] ?? []).sort((a, b) => a.created_at.localeCompare(b.created_at));
      const msgs = list.map((r) => toMsg(r, me));
      const role = c.buyer_id === me ? 'buyer' : 'seller';
      const pid = LISTING_OFFSET + c.listing_id;
      chats[cid] = {
        sid: role === 'buyer' ? c.seller_id : c.buyer_id,
        pid,
        when: whenLabel(list[list.length - 1]?.created_at ?? c.created_at),
        unread: list.some((r) => r.sender_id !== me && !r.read_at) && s.viewingCid !== cid,
        msgs,
        remote: { convId: c.id, role },
      };
      // The buyer's side of the negotiation drives the price in the cart, like the demo offers.
      if (role === 'buyer') {
        const n = negotiation(msgs);
        if (!n || n.kind === 'decline') delete offers[pid];
        else if (n.kind === 'offer') offers[pid] = { amount: n.amount, status: 'pending', cid };
        else if (n.kind === 'counter') offers[pid] = { amount: offers[pid]?.amount ?? n.amount, status: 'countered', counter: n.amount, cid };
        else offers[pid] = { amount: n.amount, status: 'accepted', cid };
      }
    }
    // Real conversations first (latest on top), then the demo ones.
    return { chats: { ...chats, ...demo }, offers };
  });
}

/** People and listings the conversations point to, when the feed doesn't already have them. */
async function loadExtras() {
  const s = useStore.getState();
  const ids = [...new Set(Object.values(convs).flatMap((c) => [c.buyer_id, c.seller_id]))].filter((id) => id !== currentUser()?.id && !s.marketSellers[id]);
  if (ids.length) {
    const { data } = await supabase.from('public_profiles').select('*').in('id', ids);
    const people: Record<string, Seller> = {};
    (data as SellerRow[] | null)?.forEach((r) => { people[r.id] = sellerFromRow(r); });
    useStore.setState((st) => ({ marketSellers: { ...st.marketSellers, ...people } }));
  }
  const known = new Set([...s.market, ...s.mine, ...s.archived].map((p) => p.id));
  const missing = [...new Set(Object.values(convs).map((c) => c.listing_id))].filter((id) => !known.has(LISTING_OFFSET + id));
  if (missing.length) {
    const { data } = await supabase.from('listings').select('*').in('id', missing);
    const found = (data as ListingRow[] | null) ?? [];
    const me = currentUser()?.id;
    // A listing taken down by its seller is no longer readable: keep a stand-in so the chat still opens.
    const ghosts: Product[] = missing.filter((id) => !found.some((r) => r.id === id)).map((id) => ({
      id: LISTING_OFFSET + id, remoteId: id, type: 'unique', title: 'Annonce retirée', brand: '', age: '', size: '', gender: '', season: '',
      condition: '', price: 0, color: 'Beige', sid: Object.values(convs).find((c) => c.listing_id === id)!.seller_id,
    }));
    useStore.setState((st) => ({ archived: [...st.archived, ...found.map((r) => toProduct(r, r.seller_id === me)), ...ghosts] }));
  }
}

async function loadAll() {
  const me = currentUser()?.id;
  if (!me) return;
  const { data: cs, error } = await supabase.from('conversations').select('*').order('last_message_at', { ascending: false }).limit(100);
  if (error || !cs) return;
  convs = Object.fromEntries((cs as ConvRow[]).map((c) => [c.id, c]));
  rows = {};
  if (cs.length) {
    const { data: ms } = await supabase.from('messages').select('*').in('conversation_id', cs.map((c) => c.id)).order('created_at').limit(2000);
    (ms as MsgRow[] | null)?.forEach((m) => { (rows[m.conversation_id] ??= []).push(m); });
  }
  await loadExtras();
  publish();
}

function clearAll() {
  convs = {}; rows = {};
  useStore.setState((s) => ({ chats: Object.fromEntries(Object.entries(s.chats).filter(([, c]) => !c.remote)), archived: [] }));
}

// ── Live updates ────────────────────────────────────────────────────────────────────────

let channel: RealtimeChannel | null = null;

function listen(me: string) {
  channel?.unsubscribe();
  channel = supabase
    .channel(`messages-${me}`)
    // Row level security limits these to the person's own conversations.
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async ({ new: r }) => {
      const m = r as MsgRow;
      const list = (rows[m.conversation_id] ??= []);
      if (list.some((x) => x.id === m.id)) return;
      list.push(m);
      if (!convs[m.conversation_id]) {
        // A new buyer wrote to me: fetch the conversation first.
        const { data } = await supabase.from('conversations').select('*').eq('id', m.conversation_id).maybeSingle();
        if (!data) return;
        convs[m.conversation_id] = data as ConvRow;
        await loadExtras();
      } else {
        convs[m.conversation_id] = { ...convs[m.conversation_id], last_message_at: m.created_at };
      }
      publish();
      const s = useStore.getState();
      const cid = cidOf(m.conversation_id);
      if (m.sender_id !== me && s.viewingCid !== cid) {
        const who = s.marketSellers[s.chats[cid]?.sid ?? '']?.name ?? 'Un parent';
        s.showToast(m.kind === 'text' ? `💬 ${who} : ${m.body.slice(0, 60)}` : `💬 ${who} a répondu à propos du prix`);
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, ({ new: r }) => {
      const m = r as MsgRow;
      const list = rows[m.conversation_id];
      const i = list?.findIndex((x) => x.id === m.id) ?? -1;
      if (list && i >= 0) { list[i] = m; publish(); }
    })
    .subscribe();
}

let started = false;
/** Call once at startup. */
export function startMessaging() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      channel?.unsubscribe(); channel = null;
      clearAll();
      return;
    }
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
      const me = session.user.id;
      // After the session and the listings are in place.
      setTimeout(async () => { await marketLoaded(); await loadAll(); listen(me); }, 30);
    }
  });
  remoteChat.send = (cid, text) => { void post(cid, 'text', text); };
  remoteChat.acceptCounter = (cid) => { void respond(cid, 'accept'); };
  remoteChat.markRead = (cid) => { void markRead(cid); };
}

// ── Actions ─────────────────────────────────────────────────────────────────────────────

const convIdOf = (cid: string) => useStore.getState().chats[cid]?.remote?.convId;

async function post(cid: string, kind: MsgRow['kind'], body: string, amount?: number) {
  const convId = convIdOf(cid);
  const me = currentUser()?.id;
  if (!convId || !me) return 'Reconnecte-toi pour envoyer un message';
  const { data, error } = await supabase.from('messages').insert({ conversation_id: convId, sender_id: me, kind, body, amount: amount ?? null }).select('*').single();
  if (error || !data) {
    useStore.getState().showToast("Le message n'est pas parti, réessaie.");
    return "Le message n'est pas parti, réessaie.";
  }
  const m = data as MsgRow;
  const list = (rows[convId] ??= []);
  if (!list.some((x) => x.id === m.id)) list.push(m);
  convs[convId] = { ...convs[convId], last_message_at: m.created_at };
  publish();
  return null;
}

/** Conversation with the seller of this listing (created on the first message). Returns the chat id. */
export async function chatFor(p: Product): Promise<string | null> {
  if (!isRemoteListing(p)) return useStore.getState().openChatFor(p.sid, p.id);
  const me = currentUser()?.id;
  if (!me) { useStore.getState().showToast('Connecte-toi pour écrire au vendeur'); return null; }
  const existing = Object.values(convs).find((c) => c.listing_id === p.remoteId && c.buyer_id === me);
  if (existing) return cidOf(existing.id);
  let { data, error } = await supabase.from('conversations').insert({ listing_id: p.remoteId, buyer_id: me, seller_id: p.sid }).select('*').single();
  // Already opened on another device: use that one.
  if (error?.code === '23505') ({ data, error } = await supabase.from('conversations').select('*').eq('listing_id', p.remoteId!).eq('buyer_id', me).single());
  if (error || !data) { useStore.getState().showToast("La conversation n'a pas pu s'ouvrir, réessaie."); return null; }
  convs[data.id] = data as ConvRow;
  rows[data.id] ??= [];
  publish();
  return cidOf(data.id);
}

/** Buyer: propose a price. Returns the chat id. */
export async function sendOffer(p: Product, amount: number) {
  const cid = await chatFor(p);
  if (!cid) return null;
  const err = await post(cid, 'offer', `Je te propose ${fmt(amount)}`, amount);
  return err ? null : cid;
}

/** Seller: propose another price. */
export const sendCounter = (cid: string, amount: number) => post(cid, 'counter', `Je peux descendre à ${fmt(amount)}, ça te va ?`, amount);

/** Answer the other person's last proposal. */
export function respond(cid: string, kind: 'accept' | 'decline') {
  const n = negotiation(useStore.getState().chats[cid]?.msgs ?? []);
  if (!n || n.mine || (n.kind !== 'offer' && n.kind !== 'counter')) return Promise.resolve(null);
  const body = kind === 'accept' ? `C'est d'accord pour ${fmt(n.amount)} !` : `Désolé, je ne peux pas accepter ${fmt(n.amount)}.`;
  return post(cid, kind, body, n.amount);
}

async function markRead(cid: string) {
  const convId = convIdOf(cid);
  const me = currentUser()?.id;
  if (!convId || !me) return;
  const unread = (rows[convId] ?? []).filter((r) => r.sender_id !== me && !r.read_at);
  if (!unread.length) return;
  const now = new Date().toISOString();
  unread.forEach((r) => { r.read_at = now; });
  await supabase.from('messages').update({ read_at: now }).in('id', unread.map((r) => r.id));
}
