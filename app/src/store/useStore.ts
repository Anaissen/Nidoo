import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  DEFAULT_COMMISSION, DeliveryId, DELIVERY, MY_PAST_LISTINGS, PRICES, Product, PRODUCTS, SELLERS,
} from '../data/catalog';
import { fmt } from '../lib/format';
import { DEMO_KIDS, Kid } from '../lib/kids';

export type TypeFilter = 'all' | 'unique' | 'lot';
export type FilterKey = 'ages' | 'genders' | 'seasons' | 'brands' | 'conds' | 'colors' | 'price';
export type Filters = Record<FilterKey, string[]>;

/** A chat message; `offer` turns it into a price-offer card. */
export type Msg = { me: boolean; t: string; offer?: { amount: number; kind: 'offer' | 'counter' | 'accept' } };
/** Price negotiation on one article (one at a time per article). */
export type Offer = { amount: number; status: 'pending' | 'countered' | 'accepted'; counter?: number; cid: string };
export type Chat = { sid: string; pid: number; when: string; unread: boolean; msgs: Msg[] };
// status: 0 payée · 1 expédiée · 2 en relais / rdv fixé · 3 reçue
export type Order = { id: string; pid: number; status: number; del: string; rating?: number; buyer?: string; price?: number };

export const emptyFilters = (): Filters => ({ ages: [], genders: [], seasons: [], brands: [], conds: [], colors: [], price: [] });

type State = {
  // persisted settings
  onboarded: boolean;
  commission: number;
  kids: Kid[];
  activeKidId: string | null;

  homeType: TypeFilter;
  favs: number[];
  cart: number[];
  following: string[];
  q: string;
  ftype: TypeFilter;
  f: Filters;
  mine: Product[];
  lastMineId: number | null;
  del: DeliveryId;
  pay: 'card' | 'apple';
  chats: Record<string, Chat>;
  offers: Record<number, Offer>;
  typingCid: string | null;
  purchases: Order[];
  sales: Order[];
  lastOrderId: string | null;
  wallet: number;
  toast: string | null;
};

type Actions = {
  set: (patch: Partial<State>) => void;
  showToast: (msg: string) => void;
  toggleFav: (id: number) => void;
  addToCart: (id: number) => void;
  removeFromCart: (id: number) => void;
  toggleFilter: (key: FilterKey, val: string) => void;
  clearFilters: () => void;
  /** Reset search to the given filters (used by home shortcuts). Caller navigates to the search tab. */
  searchWith: (patch: { f?: Partial<Filters>; ftype?: TypeFilter }) => void;
  saveKid: (k: Kid) => void;
  removeKid: (id: string) => void;
  /** Send a price offer to the seller; returns the conversation id. */
  makeOffer: (pid: number, amount: number) => string;
  acceptCounter: (pid: number) => void;
  toggleFollow: (sid: string) => void;
  publish: (p: Omit<Product, 'id'>) => number;
  placeOrder: () => string;
  /** Returns the conversation id for this seller/article, creating it if needed. */
  openChatFor: (sid: string, pid: number | null) => string;
  markRead: (cid: string) => void;
  send: (cid: string, text: string) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  withdraw: () => void;
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let replyTimer: ReturnType<typeof setTimeout> | undefined;
const REPLIES = ['Oui, toujours disponible !', "Avec plaisir, je peux l'envoyer dès demain.", "Bien sûr, dis-moi ce qui t'arrange."];

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      onboarded: false,
      commission: DEFAULT_COMMISSION,
      kids: DEMO_KIDS,
      activeKidId: DEMO_KIDS[0].id,

      homeType: 'all',
      favs: [2, 7],
      cart: [],
      following: [],
      q: '',
      ftype: 'all',
      f: emptyFilters(),
      mine: [],
      lastMineId: null,
      del: 'relais',
      pay: 'card',
      chats: {
        c1: { sid: 's2', pid: 2, when: '10:42', unread: true, msgs: [{ me: true, t: 'Bonjour, la robe taille plutôt grand ?' }, { me: false, t: "Bonjour ! Plutôt normal, ma fille l'a portée à 3 ans." }] },
        c2: { sid: 's1', pid: 1, when: 'Hier', unread: false, msgs: [{ me: true, t: 'Est-ce que les bodies sont sans taches ?' }, { me: false, t: 'Oui, tout a été lavé et vérifié.' }, { me: true, t: 'Super, merci !' }] },
        c3: { sid: 's3', pid: 3, when: 'Lun.', unread: true, msgs: [{ me: false, t: 'Je peux vous le remettre en main propre samedi si vous êtes sur Bordeaux.' }] },
      },
      offers: {},
      typingCid: null,
      purchases: [
        { id: 'o1', pid: 3, status: 2, del: 'Point relais', rating: 0 },
        { id: 'o2', pid: 6, status: 3, del: 'Domicile', rating: 5 },
      ],
      sales: [
        { id: 'v1', pid: 101, status: 0, del: 'Point relais', buyer: 'Marion L.' },
        { id: 'v2', pid: 102, status: 3, del: 'Main propre', buyer: 'Thomas D.' },
      ],
      lastOrderId: null,
      wallet: 46,
      toast: null,

      set: (patch) => set(patch),
      showToast: (msg) => {
        clearTimeout(toastTimer);
        set({ toast: msg });
        toastTimer = setTimeout(() => set({ toast: null }), 2200);
      },
      toggleFav: (id) => set((s) => ({ favs: s.favs.includes(id) ? s.favs.filter((x) => x !== id) : [...s.favs, id] })),
      addToCart: (id) => set((s) => (s.cart.includes(id) ? s : { cart: [...s.cart, id] })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((x) => x !== id) })),
      toggleFilter: (key, val) => set((s) => {
        const arr = s.f[key];
        return { f: { ...s.f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] } };
      }),
      clearFilters: () => set({ f: emptyFilters(), q: '', ftype: 'all' }),
      searchWith: ({ f, ftype }) => set({ f: { ...emptyFilters(), ...f }, ftype: ftype ?? 'all', q: '' }),
      saveKid: (k) => set((s) => ({
        kids: s.kids.some((x) => x.id === k.id) ? s.kids.map((x) => (x.id === k.id ? k : x)) : [...s.kids, k],
        activeKidId: s.activeKidId ?? k.id,
      })),
      removeKid: (id) => set((s) => {
        const kids = s.kids.filter((k) => k.id !== id);
        return { kids, activeKidId: s.activeKidId === id ? kids[0]?.id ?? null : s.activeKidId };
      }),
      makeOffer: (pid, amount) => {
        const p = productById(get().mine, pid)!;
        const cid = get().openChatFor(p.sid, pid);
        const push = (m: Msg) => set((s) => ({ chats: { ...s.chats, [cid]: { ...s.chats[cid], when: 'Maintenant', msgs: [...s.chats[cid].msgs, m] } } }));
        push({ me: true, t: `Je te propose ${fmt(amount)}`, offer: { amount, kind: 'offer' } });
        set((s) => ({ typingCid: cid, offers: { ...s.offers, [pid]: { amount, status: 'pending', cid } } }));
        // Demo seller: accepts from 85 % of the price, otherwise meets halfway.
        clearTimeout(replyTimer);
        replyTimer = setTimeout(() => {
          if (amount >= p.price * 0.85) {
            push({ me: false, t: `C'est d'accord pour ${fmt(amount)} !`, offer: { amount, kind: 'accept' } });
            set((s) => ({ typingCid: null, offers: { ...s.offers, [pid]: { amount, status: 'accepted', cid } } }));
          } else {
            const counter = Math.round(((amount + p.price) / 2) * 2) / 2;
            push({ me: false, t: `Je peux descendre à ${fmt(counter)}, ça te va ?`, offer: { amount: counter, kind: 'counter' } });
            set((s) => ({ typingCid: null, offers: { ...s.offers, [pid]: { amount, status: 'countered', counter, cid } } }));
          }
        }, 1600);
        return cid;
      },
      acceptCounter: (pid) => {
        const o = get().offers[pid];
        if (!o?.counter) return;
        set((s) => ({
          offers: { ...s.offers, [pid]: { ...o, amount: o.counter!, status: 'accepted' } },
          chats: { ...s.chats, [o.cid]: { ...s.chats[o.cid], msgs: [...s.chats[o.cid].msgs, { me: true, t: `Parfait, j'accepte ${fmt(o.counter!)} !`, offer: { amount: o.counter!, kind: 'accept' } }] } },
        }));
      },
      toggleFollow: (sid) => set((s) => ({ following: s.following.includes(sid) ? s.following.filter((x) => x !== sid) : [...s.following, sid] })),
      publish: (p) => {
        const id = 1000 + get().mine.length;
        set((s) => ({ mine: [{ ...p, id }, ...s.mine], lastMineId: id }));
        return id;
      },
      placeOrder: () => {
        const s = get();
        const delName = DELIVERY.find((d) => d.id === s.del)!.name;
        const stamp = Date.now();
        const newOrders = s.cart.map((pid, i) => ({ id: `o${stamp}${i}`, pid, status: 0, del: delName, rating: 0, price: effectivePrice(s, pid) }));
        const offers = { ...s.offers };
        s.cart.forEach((pid) => delete offers[pid]);
        set({ purchases: [...newOrders, ...s.purchases], cart: [], offers, lastOrderId: newOrders[0]?.id ?? null });
        return newOrders[0]?.id ?? '';
      },
      openChatFor: (sid, pid) => {
        const s = get();
        const entry = Object.entries(s.chats).find(([, c]) => c.sid === sid && (pid == null || c.pid === pid));
        if (entry) {
          get().markRead(entry[0]);
          return entry[0];
        }
        const id = 'c' + Date.now();
        const fallbackPid = pid ?? allProducts(s.mine).find((p) => p.sid === sid)!.id;
        set({ chats: { ...s.chats, [id]: { sid, pid: fallbackPid, when: 'Maintenant', unread: false, msgs: [] } } });
        return id;
      },
      markRead: (cid) => set((s) => ({ chats: { ...s.chats, [cid]: { ...s.chats[cid], unread: false } } })),
      send: (cid, text) => {
        const t = text.trim();
        if (!t) return;
        set((s) => ({ typingCid: cid, chats: { ...s.chats, [cid]: { ...s.chats[cid], when: 'Maintenant', msgs: [...s.chats[cid].msgs, { me: true, t }] } } }));
        // Demo: the seller answers after a short pause.
        clearTimeout(replyTimer);
        replyTimer = setTimeout(() => {
          set((s) => {
            const c = s.chats[cid];
            return { typingCid: null, chats: { ...s.chats, [cid]: { ...c, msgs: [...c.msgs, { me: false, t: REPLIES[c.msgs.length % 3] }] } } };
          });
        }, 1400);
      },
      updateOrder: (id, patch) => set((s) => ({
        sales: s.sales.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        purchases: s.purchases.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      })),
      withdraw: () => {
        if (!get().wallet) { get().showToast('Rien à virer pour le moment'); return; }
        set({ wallet: 0 });
        get().showToast('Virement envoyé vers ton compte');
      },
    }),
    {
      name: 'nidoo-settings',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored a home variant and bare ages; v2 keeps the children's passports instead.
      migrate: (old) => {
        const o = (old ?? {}) as { onboarded?: boolean; commission?: number };
        return { onboarded: !!o.onboarded, commission: o.commission ?? DEFAULT_COMMISSION, kids: DEMO_KIDS, activeKidId: DEMO_KIDS[0].id } as Partial<State & Actions>;
      },
      partialize: (s) => ({ onboarded: s.onboarded, commission: s.commission, kids: s.kids, activeKidId: s.activeKidId }),
    },
  ),
);

// ─── Selectors / helpers ─────────────────────────────────────────────────────

/** Public feed: the user's new listings first, then the catalogue. */
export const allProducts = (mine: Product[]) => [...mine, ...PRODUCTS];

/** The user's own dressing (older sold listings + new ones). */
export const myListings = (mine: Product[]) => [...MY_PAST_LISTINGS, ...mine];

export const productById = (mine: Product[], id: number | null | undefined) =>
  id == null ? undefined : [...PRODUCTS, ...MY_PAST_LISTINGS, ...mine].find((p) => p.id === id);

export const sellerById = (id: string | undefined) => (id ? SELLERS[id] : undefined);

export const filterProducts = (s: Pick<State, 'mine' | 'f' | 'q' | 'ftype'>) => {
  const { f, q, ftype } = s;
  const ql = q.trim().toLowerCase();
  return allProducts(s.mine).filter((p) =>
    (ftype === 'all' || p.type === ftype) &&
    (!ql || `${p.title} ${p.brand}`.toLowerCase().includes(ql)) &&
    (!f.ages.length || f.ages.includes(p.age)) &&
    (!f.genders.length || f.genders.includes(p.gender)) &&
    (!f.seasons.length || f.seasons.includes(p.season)) &&
    (!f.brands.length || f.brands.includes(p.brand)) &&
    (!f.conds.length || f.conds.includes(p.condition)) &&
    (!f.colors.length || f.colors.includes(p.color)) &&
    (!f.price.length || f.price.some((l) => {
      const r = PRICES.find((x) => x.l === l)!;
      return p.price >= r.min && p.price < r.max;
    })));
};

export const commissionRate = (pct: number) => pct / 100;

/** Price the buyer pays: the accepted offer if there is one, else the listed price. */
export const effectivePrice = (s: Pick<State, 'offers' | 'mine'>, pid: number) => {
  const o = s.offers[pid];
  return o?.status === 'accepted' ? o.amount : productById(s.mine, pid)?.price ?? 0;
};

export const isNegotiable = (p: Product) => p.negotiable !== false && p.sid !== 'me';
