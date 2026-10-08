import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthError, createClient, Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { useStore } from '../store/useStore';
import { Account, EMPTY_ACCOUNT } from './account';
import { DEMO_KIDS, GIFT, Kid, withCurrentSize } from './kids';

// Pimou's Supabase project. The publishable key is meant to ship inside the app: what each
// person can read or change is enforced on the server (row level security, see supabase/schema.sql).
const SUPABASE_URL = 'https://xlnsfinfwmdfuasrtqkd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_9aa5g65PnfOJ7MnUd3fuxA_lnuK7r4S';

/** Where the links in Supabase e-mails (confirmation, new password) bring people back. */
const WEB_APP_URL = 'https://anaissen.github.io/Nidoo/';

// The e-mail links land on the web app with their details in the address. Read them right away,
// before the router moves on to another screen and the address changes.
const landing = Platform.OS === 'web' && typeof window !== 'undefined'
  ? { query: new URLSearchParams(window.location.search), hash: new URLSearchParams(window.location.hash.replace(/^#/, '')) }
  : null;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Handled by handleEmailLink() from the address read above.
    detectSessionInUrl: false,
  },
});

/** "Mot de passe oublié" link waiting to be used: only spent when the new password is saved,
 *  so mail scanners (Outlook / Hotmail open links to check them) can't use it up first. */
let recoveryTokenHash: string | null = null;

const LINK_EXPIRED = 'Ce lien a expiré ou a déjà été utilisé. Redemande un nouveau lien depuis la page de connexion.';

async function handleEmailLink() {
  if (!landing) return;
  const { query, hash } = landing;
  const toast = (m: string) => setTimeout(() => useStore.getState().showToast(m), 800);
  // Links with token_hash (our e-mail templates).
  const tokenHash = query.get('token_hash');
  const type = query.get('type');
  if (tokenHash && type === 'recovery') {
    recoveryTokenHash = tokenHash;
    useStore.setState({ pendingRecovery: true });
  } else if (tokenHash && (type === 'email' || type === 'signup' || type === 'email_change')) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type === 'signup' ? 'email' : type });
    toast(error ? LINK_EXPIRED : type === 'email_change' ? 'Nouvelle adresse confirmée ✓' : 'Adresse confirmée ✓ Bienvenue sur Pimou !');
  }
  // Links through Supabase's own page, which comes back with the session (or an error) after #.
  const access = hash.get('access_token'), refresh = hash.get('refresh_token');
  if (access && refresh) {
    const { error } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
    if (!error && hash.get('type') === 'recovery') useStore.setState({ pendingRecovery: true });
    else if (!error) toast('Adresse confirmée ✓ Bienvenue sur Pimou !');
  } else if (hash.get('error_code') || hash.get('error')) {
    toast(LINK_EXPIRED);
  }
  // Tidy the address so a reload doesn't replay the link.
  if (tokenHash || access || hash.get('error')) window.history.replaceState(window.history.state, '', window.location.pathname);
}

// Refresh the session only while the app is in the foreground (recommended for React Native).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

type ProfileRow = { first_name: string; last_name: string; phone: string; street: string; zip: string; city: string; verified: boolean };

const toRow = (a: Account) => ({ first_name: a.firstName, last_name: a.lastName, phone: a.phone, street: a.street, zip: a.zip, city: a.city });
const fromRow = (r: ProfileRow, email: string): Account => ({
  firstName: r.first_name, lastName: r.last_name, email, phone: r.phone, street: r.street, zip: r.zip, city: r.city,
});

/** Supabase's English messages, in the app's words. */
function frenchError(e: AuthError | Error | null | undefined): string {
  const m = (e?.message ?? '').toLowerCase();
  if (!m) return 'Une erreur est survenue, réessaie.';
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect';
  if (m.includes('already registered') || m.includes('already been registered')) return 'Un compte existe déjà avec cet e-mail. Connecte-toi.';
  if (m.includes('email not confirmed')) return "Confirme d'abord ton e-mail : clique sur le lien reçu dans ta boîte mail.";
  if (m.includes('password should be') || m.includes('weak')) return 'Mot de passe trop simple : mélange lettres et chiffres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives, réessaie dans quelques minutes.';
  if (m.includes('invalid') && m.includes('email')) return 'Cette adresse e-mail ne semble pas valide';
  if (m.includes('fetch') || m.includes('network')) return 'Pas de connexion internet. Réessaie dans un instant.';
  return 'Une erreur est survenue, réessaie.';
}

// ── Passports: kept on the phone, copied to the server for the logged-in parent ───────────

let syncedKids: Record<string, string> = {};
let applyingRemote = false;

/** Change the passports on this phone only (loaded from the server, or cleared at logout): nothing to send back. */
type StoreState = ReturnType<typeof useStore.getState>;
function setLocally(patch: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) {
  applyingRemote = true;
  try { useStore.setState(patch); } finally { applyingRemote = false; }
}

async function loadKids(userId: string) {
  const { data, error } = await supabase.from('kids').select('id, data').eq('user_id', userId);
  if (error) return;
  const remote = (data ?? []).map((r) => withCurrentSize(r.data as Kid));
  syncedKids = Object.fromEntries((data ?? []).map((r) => [r.id, JSON.stringify(r.data)]));
  // Passports typed on this phone before logging in are kept and sent up; the demo children (Léa, Tom) never are.
  const demoIds = new Set(DEMO_KIDS.map((k) => k.id));
  const localOnly = useStore.getState().kids.filter((k) => !demoIds.has(k.id) && !remote.some((r) => r.id === k.id));
  const kids = [...remote, ...localOnly];
  setLocally((s) => ({
    kids,
    activeKidId: kids.some((k) => k.id === s.activeKidId) ? s.activeKidId : kids[0]?.id ?? GIFT,
  }));
  if (localOnly.length) pushKids(kids);
}

async function pushKids(kids: Kid[]) {
  const userId = currentUserId;
  if (!userId) return;
  const changed = kids.filter((k) => syncedKids[k.id] !== JSON.stringify(k));
  const removed = Object.keys(syncedKids).filter((id) => !kids.some((k) => k.id === id));
  if (changed.length) {
    const { error } = await supabase.from('kids').upsert(changed.map((k) => ({ user_id: userId, id: k.id, data: k, updated_at: new Date().toISOString() })));
    if (!error) changed.forEach((k) => { syncedKids[k.id] = JSON.stringify(k); });
  }
  if (removed.length) {
    const { error } = await supabase.from('kids').delete().eq('user_id', userId).in('id', removed);
    if (!error) removed.forEach((id) => { delete syncedKids[id]; });
  }
}

useStore.subscribe((s, prev) => {
  if (s.kids !== prev.kids && !applyingRemote && currentUserId) pushKids(s.kids);
});

// ── Session ─────────────────────────────────────────────────────────────────────────────

let currentUserId: string | null = null;
/** The logged-in parent (null when logged out). */
export const currentUser = () => (currentUserId ? { id: currentUserId } : null);

async function applySession(session: Session | null) {
  const user = session?.user;
  currentUserId = user?.id ?? null;
  if (!user) {
    syncedKids = {};
    useStore.setState({ signedIn: false });
    return;
  }
  useStore.setState({ signedIn: true });
  const { data } = await supabase.from('profiles').select('first_name, last_name, phone, street, zip, city, verified').eq('id', user.id).maybeSingle();
  if (data) useStore.setState({ account: fromRow(data as ProfileRow, user.email ?? ''), meVerified: (data as ProfileRow).verified });
  else useStore.setState((s) => ({ account: s.account ?? { ...EMPTY_ACCOUNT, email: user.email ?? '' } }));
  await loadKids(user.id);
}

let started = false;
/** Call once at startup: keeps `signedIn`, the account and the passports in step with the server. */
export function startBackend() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') useStore.setState({ pendingRecovery: true });
    // Supabase advises not to await other Supabase calls inside this callback.
    setTimeout(() => applySession(session), 0);
  });
  void handleEmailLink();
}

// ── Actions used by the screens. Each returns an error message in French, or null. ──────

export type SignUpResult = { error: string | null; needsConfirmation: boolean };

export async function signUp(a: Account, password: string): Promise<SignUpResult> {
  const { data, error } = await supabase.auth.signUp({
    email: a.email,
    password,
    options: { data: toRow(a), emailRedirectTo: WEB_APP_URL },
  });
  if (error) return { error: frenchError(error), needsConfirmation: false };
  // Supabase answers without error for an e-mail already in use (no identities): say so.
  if (data.user && !data.user.identities?.length) return { error: 'Un compte existe déjà avec cet e-mail. Connecte-toi.', needsConfirmation: false };
  // A new account starts with no passports (the demo children stay out of it).
  setLocally({ account: a, kids: [], activeKidId: GIFT, wardrobes: {} });
  return { error: null, needsConfirmation: !data.session };
}

export async function signIn(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
  return error ? frenchError(error) : null;
}

export async function signOut() {
  // Stop syncing first: clearing the phone must never delete the passports on the server.
  currentUserId = null;
  syncedKids = {};
  await supabase.auth.signOut();
  // Personal data stays on the server, not on a phone someone else might use.
  setLocally({ signedIn: false, account: null, kids: [], activeKidId: GIFT, wardrobes: {}, meVerified: false });
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: WEB_APP_URL });
  return error ? frenchError(error) : null;
}

export async function setNewPassword(password: string) {
  if (recoveryTokenHash) {
    // First use of the e-mail link: it logs the parent in for this one change.
    const { error } = await supabase.auth.verifyOtp({ token_hash: recoveryTokenHash, type: 'recovery' });
    if (error) return LINK_EXPIRED;
    recoveryTokenHash = null;
  }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return LINK_EXPIRED;
  const { error } = await supabase.auth.updateUser({ password });
  if (!error) useStore.setState({ pendingRecovery: false });
  if (error && /different from the old|same password/i.test(error.message)) return "Choisis un mot de passe différent de l'ancien";
  return error ? frenchError(error) : null;
}

/** Save "Mes informations". A new e-mail address only applies once confirmed from the mail Supabase sends. */
export async function saveAccount(a: Account) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Reconnecte-toi pour modifier tes informations', emailPending: false };
  const { error } = await supabase.from('profiles').update({ ...toRow(a), updated_at: new Date().toISOString() }).eq('id', user.id);
  if (error) return { error: frenchError(error), emailPending: false };
  let emailPending = false;
  if (a.email !== user.email) {
    const res = await supabase.auth.updateUser({ email: a.email }, { emailRedirectTo: WEB_APP_URL });
    if (res.error) return { error: frenchError(res.error), emailPending: false };
    emailPending = true;
  }
  useStore.setState({ account: { ...a, email: emailPending ? user.email ?? a.email : a.email } });
  return { error: null, emailPending };
}
