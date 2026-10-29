import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  categoryOf, DEFAULT_COMMISSION, DeliveryId, DISTANCES, ME_SELLER, PRICES, Product, Seller, sockFits,
  WARDROBE_TEMPLATES, WardrobeLine,
} from '../data/catalog';
import { Account, cityLabel, EMPTY_ACCOUNT, shortName } from '../lib/account';
import type { Review } from '../lib/reviews';
import { DEMO_KID_IDS, Kid, withCurrentSize } from '../lib/kids';

export type TypeFilter = 'all' | 'unique' | 'lot';
export type FilterKey = 'cats' | 'shoes' | 'ages' | 'genders' | 'seasons' | 'brands' | 'conds' | 'colors' | 'price' | 'distance';
export type ThemeMode = 'auto' | 'light' | 'dark';
export type Wardrobe = { season: keyof typeof WARDROBE_TEMPLATES; lines: WardrobeLine[] };
export type Filters = Record<FilterKey, string[]>;

/** A chat message; `offer` turns it into a price-offer card. */
export type OfferKind = 'offer' | 'counter' | 'accept' | 'decline';
export type Msg = { me: boolean; t: string; offer?: { amount: number; kind: OfferKind }; id?: number; at?: string };
/** Price negotiation on one article (one at a time per article). */
export type Offer = { amount: number; status: 'pending' | 'countered' | 'accepted'; counter?: number; cid: string };
/** A real order, paid through Stripe (src/lib/payments.ts). One per article. */
export type RealOrder = {
  id: string; groupId: string; listingId: number | null; buyerId: string; sellerId: string; title: string; photo: string | null;
  price: number; shipping: number; commission: number; delivery: DeliveryId; address: string;
  status: 'pending' | 'paid' | 'shipped' | 'received' | 'cancelled'; refunded: boolean; createdAt: string;
};

/** A conversation on the server (src/lib/messaging.ts), as shown in the app. */
export type Chat = { sid: string; pid: number; when: string; unread: boolean; msgs: Msg[]; remote: { convId: string; role: 'buyer' | 'seller' } };

/** Server actions for conversations, plugged in by src/lib/messaging.ts (which imports this store). */
export const remoteChat: {
  send?: (cid: string, text: string) => void;
  acceptCounter?: (cid: string) => void;
  markRead?: (cid: string) => void;
} = {};

export const emptyFilters = (): Filters => ({ cats: [], shoes: [], ages: [], genders: [], seasons: [], brands: [], conds: [], colors: [], price: [], distance: [] });

/** Season to prepare for: from August the autumn-winter list, from February spring-summer. */
export const currentWardrobeSeason = (now = new Date()): Wardrobe['season'] => {
  const m = now.getMonth() + 1;
  return m >= 8 || m <= 1 ? 'hiver' : 'ete';
};
/** Season starter list (used as-is for display until the parent edits it). */
export const newWardrobe = (season = currentWardrobeSeason()): Wardrobe => {
  return { season, lines: WARDROBE_TEMPLATES[season].lines.map((l) => ({ ...l, got: 0 })) };
};

type State = {
  // persisted settings
  onboarded: boolean;
  commission: number;
  kids: Kid[];
  activeKidId: string | null;
  /** Filled in at sign-up; null until then. */
  account: Account | null;
  /** Mirrors the Supabase session (src/lib/backend.ts keeps it up to date). */
  signedIn: boolean;
  /** Came back from a "mot de passe oublié" e-mail: ask for the new password. */
  pendingRecovery: boolean;
  /** Logged in, but hasn't accepted the current CGU yet (src/lib/terms.ts): the app asks. */
  termsToAccept: boolean;
  theme: ThemeMode;
  textScale: number;
  meVerified: boolean;
  wardrobes: Record<string, Wardrobe>;
  /** Screen to come back to after the app re-renders for a theme / text-size change. */
  returnTo: string | null;

  homeType: TypeFilter;
  favs: number[];
  cart: number[];
  following: string[];
  q: string;
  ftype: TypeFilter;
  f: Filters;
  mine: Product[];
  /** Other parents' listings from the server (src/lib/listings.ts loads them). */
  market: Product[];
  /** Their sellers' (and buyers') public cards, by id. */
  marketSellers: Record<string, Seller>;
  /** Listings no longer in the feed (sold, removed) that a conversation still points to. */
  archived: Product[];
  /** Conversation on screen right now: new messages there don't need a notice. */
  viewingCid: string | null;
  /** Real orders, as buyer or seller. */
  realOrders: RealOrder[];
  /** Can the parent receive payments for what they sell (Stripe account checked)? null: not asked yet. */
  payout: { ready: boolean; submitted: boolean } | null;
  /** Reviews of the person's real orders, by order id. */
  orderReviews: Record<string, Review>;
  /** The person's own public seller card (real rating, sales…), once logged in. */
  myCard: Seller | null;
  lastMineId: number | null;
  del: DeliveryId;
  chats: Record<string, Chat>;
  offers: Record<number, Offer>;
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
  /** Children grow: move each passport to the size matching today's age. */
  refreshKidSizes: () => void;
  /** Garde-robe of a child, created from the season template on first use. */
  wardrobeFor: (kidId: string) => Wardrobe;
  setWardrobeGot: (kidId: string, lineId: string, got: number) => void;
  addWardrobeLine: (kidId: string, label: string) => void;
  removeWardrobeLine: (kidId: string, lineId: string) => void;
  resetWardrobe: (kidId: string, season?: Wardrobe['season']) => void;
  removeKid: (id: string) => void;
  acceptCounter: (pid: number) => void;
  toggleFollow: (sid: string) => void;
  /** Tick the active child's garde-robe with what was just bought; returns how many lines got ticked. */
  tickWardrobe: (bought: Product[]) => number;
  markRead: (cid: string) => void;
  send: (cid: string, text: string) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      onboarded: false,
      commission: DEFAULT_COMMISSION,
      kids: [],
      activeKidId: null,
      // Light by default for everyone; dark mode is a choice in Réglages.
      account: null,
      signedIn: false,
      pendingRecovery: false,
      termsToAccept: false,
      theme: 'light',
      textScale: 1,
      meVerified: false,
      wardrobes: {},
      returnTo: null,

      homeType: 'all',
      favs: [],
      cart: [],
      following: [],
      q: '',
      ftype: 'all',
      f: emptyFilters(),
      mine: [],
      market: [],
      marketSellers: {},
      archived: [],
      viewingCid: null,
      realOrders: [],
      payout: null,
      orderReviews: {},
      myCard: null,
      lastMineId: null,
      del: 'relais',
      chats: {},
      offers: {},
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
      saveKid: (raw) => set((s) => {
        const k = withCurrentSize(raw);
        return {
        kids: s.kids.some((x) => x.id === k.id) ? s.kids.map((x) => (x.id === k.id ? k : x)) : [...s.kids, k],
        activeKidId: s.activeKidId ?? k.id,
        };
      }),
      refreshKidSizes: () => set((s) => ({ kids: s.kids.map((k) => withCurrentSize(k)) })),
      wardrobeFor: (kidId) => {
        const w = get().wardrobes[kidId];
        if (w) return w;
        const fresh = newWardrobe();
        set((s) => ({ wardrobes: { ...s.wardrobes, [kidId]: fresh } }));
        return fresh;
      },
      setWardrobeGot: (kidId, lineId, got) => {
        const w = get().wardrobeFor(kidId);
        set((s) => ({ wardrobes: { ...s.wardrobes, [kidId]: { ...w, lines: w.lines.map((l) => (l.id === lineId ? { ...l, got: Math.max(0, Math.min(l.need, got)) } : l)) } } }));
      },
      addWardrobeLine: (kidId, label) => {
        const w = get().wardrobeFor(kidId);
        const t = label.trim();
        if (!t) return;
        const line = { id: 'l' + Date.now(), label: t, kw: t.toLowerCase().split(' ')[0], need: 1, got: 0 };
        set((s) => ({ wardrobes: { ...s.wardrobes, [kidId]: { ...w, lines: [...w.lines, line] } } }));
      },
      removeWardrobeLine: (kidId, lineId) => {
        const w = get().wardrobeFor(kidId);
        set((s) => ({ wardrobes: { ...s.wardrobes, [kidId]: { ...w, lines: w.lines.filter((l) => l.id !== lineId) } } }));
      },
      resetWardrobe: (kidId, season) => set((s) => ({ wardrobes: { ...s.wardrobes, [kidId]: newWardrobe(season) } })),
      removeKid: (id) => set((s) => {
        const kids = s.kids.filter((k) => k.id !== id);
        return { kids, activeKidId: s.activeKidId === id ? kids[0]?.id ?? null : s.activeKidId };
      }),
      acceptCounter: (pid) => {
        const o = get().offers[pid];
        if (o?.counter) remoteChat.acceptCounter?.(o.cid);
      },
      toggleFollow: (sid) => set((s) => ({ following: s.following.includes(sid) ? s.following.filter((x) => x !== sid) : [...s.following, sid] })),
      tickWardrobe: (bought) => {
        const s = get();
        const kid = s.kids.find((k) => k.id === s.activeKidId);
        const w = kid && s.wardrobes[kid.id];
        if (!kid || !w) return 0;
        let ticked = 0;
        const lines = w.lines.map((l) => {
          const found = bought.reduce((n, p) => n + piecesMatching(p, l.kw), 0);
          const got = Math.min(l.need, l.got + found);
          if (got > l.got) ticked++;
          return { ...l, got };
        });
        set({ wardrobes: { ...s.wardrobes, [kid.id]: { ...w, lines } } });
        return ticked;
      },
      markRead: (cid) => {
        if (get().chats[cid]) remoteChat.markRead?.(cid);
        set((s) => ({ chats: { ...s.chats, [cid]: { ...s.chats[cid], unread: false } } }));
      },
      send: (cid, text) => {
        const t = text.trim();
        if (t) remoteChat.send?.(cid, t);
      },
    }),
    {
      // Storage key kept from the app's first name so saved passports and settings survive the rename.
      name: 'nidoo-settings',
      version: 6,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored a home variant and bare ages; v2 keeps the children's passports instead.
      migrate: (old, version) => {
        const o = (old ?? {}) as Partial<State>;
        const base = version < 2
          ? { onboarded: !!o.onboarded, commission: o.commission ?? DEFAULT_COMMISSION }
          : o;
        const merged = { theme: 'light', textScale: 1, meVerified: false, wardrobes: {}, ...base } as Partial<State & Actions>;
        // v4: back to the light look for everyone; people pick dark mode themselves.
        if (version < 4) merged.theme = 'light';
        // v6: the example passports and profile are gone (a real session restores the account).
        if (version < 6) {
          const kids = (merged.kids ?? []).filter((k) => !DEMO_KID_IDS.includes(k.id));
          Object.assign(merged, { kids, activeKidId: kids.some((k) => k.id === merged.activeKidId) ? merged.activeKidId : kids[0]?.id ?? null });
          // Example articles had small ids; real listings are numbered from 100000.
          merged.cart = (merged.cart ?? []).filter((id) => id >= 1000);
          if (merged.account?.email === 'elodie@exemple.fr') Object.assign(merged, { account: null, signedIn: false });
        }
        return merged;
      },
      partialize: (s) => ({
        onboarded: s.onboarded, commission: s.commission, kids: s.kids, activeKidId: s.activeKidId,
        theme: s.theme, textScale: s.textScale, meVerified: s.meVerified, wardrobes: s.wardrobes, account: s.account,
        signedIn: s.signedIn,
        // Kept so the basket is still there when coming back from the payment page.
        cart: s.cart, del: s.del,
      }),
    },
  ),
);

// Sizes follow the children's age: refresh once saved passports are loaded (and right away if already loaded).
useStore.persist.onFinishHydration(() => useStore.getState().refreshKidSizes());
if (useStore.persist.hasHydrated()) useStore.getState().refreshKidSizes();

// ─── Selectors / helpers ─────────────────────────────────────────────────────

// Explicit return types: these read the store they're used in, which TypeScript can't infer through.
function market(): Product[] { return useStore.getState().market; }
function marketSellers(): Record<string, Seller> { return useStore.getState().marketSellers; }
function archived(): Product[] { return useStore.getState().archived; }

/** Public feed: the user's own listings first, then other parents'. */
export const allProducts = (mine: Product[]) => [...mine, ...market()];

/** Re-render a feed when the listings from the server arrive (the helpers above read them on demand). */
export const useMarket = () => useStore((s) => s.market);

export const productById = (mine: Product[], id: number | null | undefined) =>
  id == null ? undefined : [...mine, ...market(), ...archived()].find((p) => p.id === id);

export const sellerById = (id: string | undefined) => (id === 'me' ? ME_SELLER : id ? marketSellers()[id] : undefined);

export const filterProducts = (s: Pick<State, 'mine' | 'f' | 'q' | 'ftype'>) => {
  const { f, q, ftype } = s;
  const ql = q.trim().toLowerCase();
  return allProducts(s.mine).filter((p) =>
    (ftype === 'all' || p.type === ftype) &&
    (!ql || `${p.title} ${p.brand} ${categoryOf(p).label}`.toLowerCase().includes(ql)) &&
    (!f.cats.length || f.cats.includes(categoryOf(p).label)) &&
    // A shoe size picked: the shoes of that size, and the socks / tights that fit it.
    (!f.shoes.length || f.shoes.some((n) => (p.category === 'chaussures' && p.shoeSize === Number(n)) || (p.category === 'chaussettes' && sockFits(p.sockSize, Number(n))))) &&
    (!f.ages.length || f.ages.includes(p.age)) &&
    (!f.genders.length || f.genders.includes(p.gender)) &&
    (!f.seasons.length || f.seasons.includes(p.season)) &&
    (!f.brands.length || f.brands.includes(p.brand)) &&
    (!f.conds.length || f.conds.includes(p.condition)) &&
    (!f.colors.length || f.colors.includes(p.color)) &&
    (!f.distance.length || f.distance.some((l) => (sellerById(p.sid)?.distanceKm ?? Infinity) <= DISTANCES.find((d) => d.l === l)!.km)) &&
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

/** How many pieces of a product match a wardrobe keyword (a lot counts its matching contents). */
function piecesMatching(p: Product | undefined, kw: string) {
  if (!p) return 0;
  const k = kw.toLowerCase();
  if (p.type === 'lot') {
    const n = (p.contents ?? []).filter((c) => c.n.toLowerCase().includes(k)).reduce((a, c) => a + c.q, 0);
    return n || (p.title.toLowerCase().includes(k) ? 1 : 0);
  }
  return p.title.toLowerCase().includes(k) ? 1 : 0;
}

/** Pieces given a second life through the user's purchases and sales (a lot counts each piece). */
export function impactStats(s: Pick<State, 'realOrders' | 'mine'>) {
  const pieces = s.realOrders.filter((o) => o.status !== 'cancelled' && !o.refunded).reduce((n, o) => {
    const p = [...s.mine, ...market(), ...archived()].find((x) => x.remoteId === o.listingId);
    return n + (p?.type === 'lot' ? p.count ?? 1 : 1);
  }, 0);
  // Rough averages for a child's garment bought second hand instead of new.
  return { pieces, co2Kg: pieces * IMPACT_PER_PIECE.co2Kg, waterL: pieces * IMPACT_PER_PIECE.waterL };
}

export const IMPACT_PER_PIECE = { co2Kg: 5, waterL: 1500 };

/** Seller as shown to others: the user's own badge follows their verification. */
export const sellerView = (s: Pick<State, 'meVerified'> & Partial<Pick<State, 'account' | 'myCard'>>, id: string | undefined) => {
  const seller = sellerById(id);
  if (!seller || seller.id !== 'me') return seller;
  const a = accountOf(s);
  // Logged in: the real figures (reviews, sales…) from the server.
  const real = s.myCard ? { rating: s.myCard.rating, reviews: s.myCard.reviews, sales: s.myCard.sales, washedConfirms: s.myCard.washedConfirms, since: s.myCard.since, ship: s.myCard.ship } : {};
  return { ...seller, ...real, verified: s.meVerified, name: shortName(a), init: a.firstName.slice(0, 1).toUpperCase() || seller.init, city: cityLabel(a) };
};

/** The signed-in person, or a blank profile. */
export const accountOf = (s: Partial<Pick<State, 'account'>>) => s.account ?? EMPTY_ACCOUNT;
