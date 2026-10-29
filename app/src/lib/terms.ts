import { TERMS_VERSION } from '../data/legal';
import { useStore } from '../store/useStore';
import { currentUser, deviceLabel, supabase } from './backend';

let started = false;
/** After each login: has this parent accepted the current CGU? If not, the app asks (components/TermsGate). */
export function startTerms() {
  if (started) return;
  started = true;
  supabase.auth.onAuthStateChange((event, session) => {
    if (!session) { useStore.setState({ termsToAccept: false }); return; }
    if (event !== 'INITIAL_SESSION' && event !== 'SIGNED_IN') return;
    const me = session.user.id;
    // Outside the auth callback: Supabase calls made inside it wait for it to finish.
    setTimeout(async () => {
      const { data, error } = await supabase.from('terms_acceptances').select('version').eq('user_id', me).order('accepted_at', { ascending: false }).limit(1);
      // No record table yet (schema-8 not run): nothing to ask.
      if (error) return;
      useStore.setState({ termsToAccept: data?.[0]?.version !== TERMS_VERSION });
    }, 50);
  });
}

/** Record the acceptance (the database stamps the date and the e-mail). Returns an error message, or null. */
export async function acceptTerms() {
  const me = currentUser()?.id;
  if (!me) return 'Connecte-toi pour continuer.';
  const { error } = await supabase.from('terms_acceptances').insert({ user_id: me, version: TERMS_VERSION, how: "case cochée dans l'appli", user_agent: deviceLabel() });
  if (error) return "Ça n'a pas marché, réessaie dans un instant.";
  useStore.setState({ termsToAccept: false });
  return null;
}
