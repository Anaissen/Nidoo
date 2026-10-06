import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

import { DeliveryId, Product, Seller } from '../data/catalog';
import { useStore } from '../store/useStore';
import { currentUser, supabase } from './backend';

/** Server listings get app ids above the demo and local ones (1-999, 1000+). */
const REMOTE_ID_OFFSET = 100000;
export const MAX_PHOTOS = 6;
const PHOTO_WIDTH = 1280;

export type ListingRow = {
  id: number; seller_id: string; type: 'unique' | 'lot'; title: string; description: string; brand: string; age: string; gender: string; season: string;
  condition: string; price: number | string; color: string; count: number | null; contents: Product['contents'] | null;
  negotiable: boolean; washed: boolean; photos: string[]; created_at: string;
};
export type SellerRow = { id: string; display_name: string; city: string; zip: string; verified: boolean; created_at: string };

export const toProduct = (r: ListingRow, mine: boolean): Product => ({
  id: REMOTE_ID_OFFSET + r.id, remoteId: r.id, type: r.type, title: r.title, description: r.description, brand: r.brand || 'Sans marque', age: r.age, size: r.age,
  gender: r.gender, season: r.season, condition: r.condition, price: Number(r.price), color: r.color,
  // The person's own listings use the 'me' seller, like everywhere else in the app.
  sid: mine ? 'me' : r.seller_id,
  count: r.count ?? undefined, contents: r.contents ?? undefined, negotiable: r.negotiable, washed: r.washed, photos: r.photos,
});

/** Rough distance from the zip codes until addresses are geocoded: same zip, same département, or further. */
function guessKm(zip: string) {
  const mine = useStore.getState().account?.zip ?? '';
  if (!zip || !mine) return 20;
  if (zip === mine) return 2;
  if (zip.slice(0, 2) === mine.slice(0, 2)) return 10;
  return 50;
}

export const sellerFromRow = (r: SellerRow): Seller => ({
  id: r.id, name: r.display_name || 'Un parent', city: r.city, rating: '–', reviews: 0, sales: 0,
  init: (r.display_name || '?').slice(0, 1).toUpperCase(), since: r.created_at.slice(0, 4), ship: '48 h',
  verified: r.verified, distanceKm: guessKm(r.zip), washedConfirms: 0,
});

let loading: Promise<void> = Promise.resolve();
/** Fetch the active listings and their sellers. Anyone can browse, logged in or not. */
export const loadMarket = () => (loading = fetchMarket());
/** Resolves once the latest load is done (conversations wait for it). */
export const marketLoaded = () => loading;

async function fetchMarket() {
  const { data, error } = await supabase.from('listings').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(200);
  if (error || !data) return;
  const me = currentUser()?.id;
  const rows = data as ListingRow[];
  const others = rows.filter((r) => r.seller_id !== me);
  const ids = [...new Set(others.map((r) => r.seller_id))];
  const sellers: Record<string, Seller> = {};
  if (ids.length) {
    const res = await supabase.from('public_profiles').select('*').in('id', ids);
    (res.data as SellerRow[] | null)?.forEach((r) => { sellers[r.id] = sellerFromRow(r); });
  }
  useStore.setState((s) => ({
    market: others.filter((r) => sellers[r.seller_id]).map((r) => toProduct(r, false)),
    marketSellers: sellers,
    // Own listings from the server, plus any published on this phone before logging in.
    mine: [...rows.filter((r) => r.seller_id === me).map((r) => toProduct(r, true)), ...s.mine.filter((p) => !p.remoteId)],
  }));
}

let started = false;
/** Call once at startup: loads the listings, and again whenever someone logs in or out. */
export function startMarket() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event) => {
    // After backend.ts has applied the session (it also defers to the next tick).
    if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') setTimeout(loadMarket, 10);
  });
}

// ── Photos ──────────────────────────────────────────────────────────────────────────────

/** Let the parent pick photos (gallery) or take one (camera). Returns local URIs, already resized. */
export async function pickPhotos(source: 'library' | 'camera', remaining: number): Promise<{ uris: string[]; error?: string }> {
  if (remaining <= 0) return { uris: [], error: `${MAX_PHOTOS} photos maximum` };
  let res: ImagePicker.ImagePickerResult;
  if (source === 'camera' && Platform.OS !== 'web') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { uris: [], error: "Autorise l'appareil photo dans les réglages de ton téléphone" };
    res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  } else {
    res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: remaining, quality: 1 });
  }
  if (res.canceled) return { uris: [] };
  const uris: string[] = [];
  for (const a of res.assets.slice(0, remaining)) uris.push(await shrink(a));
  return { uris };
}

/** Smaller, lighter JPEG: faster to send and to load in the feed. */
async function shrink(a: ImagePicker.ImagePickerAsset) {
  try {
    const ctx = ImageManipulator.manipulate(a.uri);
    if (a.width > PHOTO_WIDTH) ctx.resize({ width: PHOTO_WIDTH });
    const img = await ctx.renderAsync();
    const out = await img.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
    return out.uri;
  } catch {
    return a.uri;
  }
}

async function uploadPhoto(uri: string, userId: string, i: number) {
  const body = await fetch(uri).then((r) => r.arrayBuffer());
  const path = `${userId}/${Date.now()}-${i}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(path, body, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;
  return supabase.storage.from('photos').getPublicUrl(path).data.publicUrl;
}

// ── Publish ─────────────────────────────────────────────────────────────────────────────

export type NewListing = Omit<Product, 'id' | 'sid' | 'remoteId' | 'photos'> & { photos: string[]; delivery: Record<DeliveryId, boolean> };

/** Send the photos, then the listing. Returns the new product id in the app, or an error in French. */
export async function publishListing(l: NewListing): Promise<{ id?: number; error?: string }> {
  const user = currentUser();
  if (!user) return { error: 'Connecte-toi pour publier une annonce' };
  try {
    const photos: string[] = [];
    for (let i = 0; i < l.photos.length; i++) photos.push(await uploadPhoto(l.photos[i], user.id, i));
    const { data, error } = await supabase.from('listings').insert({
      seller_id: user.id, type: l.type, title: l.title, description: l.description ?? '', brand: l.brand, age: l.age, gender: l.gender, season: l.season,
      condition: l.condition, price: l.price, color: l.color, count: l.count ?? null, contents: l.contents ?? null,
      negotiable: l.negotiable ?? true, washed: !!l.washed, delivery: l.delivery, photos,
    }).select('*').single();
    if (error || !data) throw error ?? new Error('insert failed');
    const p = toProduct(data as ListingRow, true);
    useStore.setState((s) => ({ mine: [p, ...s.mine], lastMineId: p.id }));
    return { id: p.id };
  } catch (e) {
    const m = String((e as Error)?.message ?? '').toLowerCase();
    if (m.includes('fetch') || m.includes('network')) return { error: 'Pas de connexion internet. Réessaie dans un instant.' };
    if (m.includes('size') || m.includes('too large')) return { error: 'Une photo est trop lourde (5 Mo maximum)' };
    return { error: "L'annonce n'a pas pu être publiée, réessaie." };
  }
}

/** Take a listing off the feed (sold elsewhere, changed one's mind). */
export async function removeListing(p: Product) {
  if (!p.remoteId) return null;
  const { error } = await supabase.from('listings').update({ status: 'removed' }).eq('id', p.remoteId);
  if (error) return "L'annonce n'a pas pu être retirée, réessaie.";
  useStore.setState((s) => ({ mine: s.mine.filter((x) => x.id !== p.id) }));
  return null;
}
