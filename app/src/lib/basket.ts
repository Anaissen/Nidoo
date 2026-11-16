import { useStore } from '../store/useStore';
import { supabase } from './backend';
import { appIdOf, ListingRow, REMOTE_ID_OFFSET } from './listings';

/**
 * The basket belongs to the account: it is kept on the server (supabase/schema-14-panier.sql), so a parent finds it
 * again when logging back in, on any phone or browser. The phone holds a copy (`cart`) and `cartBase`, what the server
 * had at the last exchange: comparing the three tells what changed here (sent up) and what changed elsewhere (taken in).
 * Logged out, the basket stays on the phone; it joins the account at login and leaves the phone at logout.
 */

/** Whose basket the phone is working with (null: logged out). */
let owner: string | null = null;
/** False while the server has no baskets yet (supabase/schema-14 not run): the basket then stays on the phone. */
let serverReady = true;
let queue: Promise<void> = Promise.resolve();
let refreshWaiting = false;

/** One exchange with the server at a time, each working from the latest state. */
const serial = (job: () => Promise<void>) => (queue = queue.then(job).catch(() => undefined));

const remote = (cart: number[]) => cart.filter((id) => id >= REMOTE_ID_OFFSET);
const missingTable = (e: { code?: string; message?: string }) => e.code === 'PGRST205' || e.code === '42P01' || /cart_items/.test(e.message ?? '');

/** Saved settings (the basket's copy among them) are read from storage after the app starts. */
function hydrated() {
  if (useStore.persist.hasHydrated()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const stop = useStore.persist.onFinishHydration(() => { stop(); resolve(); });
    // Storage unreadable: go on with what there is rather than wait forever.
    setTimeout(() => { stop(); resolve(); }, 3000);
  });
}

/** Take in the server's basket, and send what changed on this phone. */
async function sync() {
  const uid = owner;
  if (!uid || !serverReady) return;
  await hydrated();
  const { data, error } = await supabase.from('cart_items').select('listing_id, added_at').eq('user_id', uid).order('added_at');
  if (owner !== uid) return;
  if (error) { if (missingTable(error)) serverReady = false; return; }
  const server = (data as { listing_id: number }[]).map((r) => appIdOf(r.listing_id));
  const s = useStore.getState();
  // Filled while logged out: it joins the account's basket. Another account's copy (shouldn't happen): left out.
  const local = s.cartOwner === uid || !s.cartOwner ? s.cart : [];
  const base = new Set(s.cartOwner === uid ? s.cartBase ?? [] : []);
  const onServer = new Set(server);
  const kept = local.filter((id) => !(base.has(id) && !onServer.has(id))); // taken out on another phone: out here too
  const added = server.filter((id) => !base.has(id) && !kept.includes(id)); // put in on another phone: in here too
  useStore.setState({ cart: [...kept, ...added], cartBase: server, cartOwner: uid });
  await push();
}

/** Send this phone's changes since the last exchange. */
async function push() {
  const uid = owner;
  const s = useStore.getState();
  // Not yet merged with the account's basket: sync() does it first.
  if (!uid || !serverReady || s.cartOwner !== uid) return;
  const base = s.cartBase ?? [];
  const cart = remote(s.cart);
  const added = cart.filter((id) => !base.includes(id));
  const removed = base.filter((id) => !cart.includes(id));
  if (!added.length && !removed.length) return;
  let next = base;
  if (added.length) {
    const rows = added.map((id) => ({ user_id: uid, listing_id: id - REMOTE_ID_OFFSET }));
    const { error } = await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,listing_id', ignoreDuplicates: true });
    // On failure (offline, article deleted meanwhile), the next exchange tries again.
    if (!error) next = [...next, ...added];
  }
  if (removed.length) {
    const { error } = await supabase.from('cart_items').delete().eq('user_id', uid).in('listing_id', removed.map((id) => id - REMOTE_ID_OFFSET));
    if (!error) next = next.filter((id) => !removed.includes(id));
  }
  if (owner === uid) useStore.setState({ cartBase: next });
}

/**
 * The basket keeps only articles still for sale by someone else: bought by another parent meanwhile, taken down,
 * or one's own go (on the server too). Offline, it stays as it is.
 */
async function prune() {
  await hydrated();
  const cart = useStore.getState().cart;
  if (!cart.length) return;
  const gone = new Set(cart.filter((id) => id < REMOTE_ID_OFFSET));
  const ids = remote(cart).map((id) => id - REMOTE_ID_OFFSET);
  if (ids.length) {
    const { data, error } = await supabase.from('listings').select('id, status, seller_id').in('id', ids);
    if (error || !data) return;
    const open = new Set((data as Pick<ListingRow, 'id' | 'status' | 'seller_id'>[]).filter((r) => r.status === 'active' && r.seller_id !== owner).map((r) => r.id));
    ids.filter((id) => !open.has(id)).forEach((id) => gone.add(appIdOf(id)));
  }
  // Only what was checked: an article added meanwhile stays.
  if (gone.size) useStore.setState((s) => ({ cart: s.cart.filter((id) => !gone.has(id)) }));
}

/** Bring the basket up to date (several requests close together make one). */
function refresh() {
  if (refreshWaiting) return;
  refreshWaiting = true;
  void serial(async () => {
    refreshWaiting = false;
    await sync();
    await prune();
  });
}

/** Logged out: the basket leaves the phone (it stays on the server, for the next login). */
function forget() {
  owner = null;
  useStore.setState({ cart: [], cartBase: null, cartOwner: null });
}

let started = false;
/** Call once at startup. */
export function startBasket() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    const uid = session?.user?.id ?? null;
    if (event === 'SIGNED_OUT') { forget(); return; }
    if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
    owner = uid;
    if (uid) refresh();
    // Opened logged out with an account's copy still here (session ended while the app was closed).
    else void hydrated().then(() => { if (!owner && useStore.getState().cartOwner) forget(); });
  });
  useStore.subscribe((s, prev) => {
    if (s.cart !== prev.cart && owner) void serial(push);
    // The feed reloads every minute: so does the basket (articles sold since, changes made on another phone).
    if (s.market !== prev.market) refresh();
  });
}
