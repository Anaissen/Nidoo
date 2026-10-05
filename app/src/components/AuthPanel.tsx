import { Check, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Account, accountErrors, EMAIL_RE, EMPTY_ACCOUNT, MIN_PASSWORD } from '../lib/account';
import { sendPasswordReset, signIn, signUp } from '../lib/backend';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';
import { AccountFields, Field, PasswordField } from './AccountForm';
import { H, LinkButton, PrimaryButton, Segmented, Txt } from './ui';

export type AuthMode = 'signup' | 'login';

/** "Crée ton compte" / "Me connecter": the sign-up form, or e-mail + password to log back in. */
export function AuthPanel({ initialMode = 'signup', onDone }: { initialMode?: AuthMode; onDone: (mode: AuthMode) => void }) {
  const showToast = useStore((s) => s.showToast);
  const saved = useStore((s) => s.account);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [a, setA] = useState<Account>(EMPTY_ACCOUNT);
  const [email, setEmail] = useState(saved?.email ?? '');
  const [pw, setPw] = useState('');
  const [terms, setTerms] = useState(false);
  const [tried, setTried] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Sign-up done, but Supabase wants the e-mail address confirmed before the first login.
  const [confirmFor, setConfirmFor] = useState<string | null>(null);

  const errors = accountErrors(a);
  const pwError = pw.length < MIN_PASSWORD ? `Au moins ${MIN_PASSWORD} caractères` : undefined;
  const switchTo = (m: AuthMode) => { setMode(m); setTried(false); setLoginError(null); };

  const submitSignup = async () => {
    setTried(true);
    if (busy) return;
    if (Object.keys(errors).length || pwError || !terms) { showToast(!terms && !Object.keys(errors).length && !pwError ? 'Accepte les conditions pour continuer' : 'Vérifie les champs en rouge'); return; }
    const clean = { ...a, email: a.email.trim().toLowerCase(), firstName: a.firstName.trim(), lastName: a.lastName.trim() };
    setBusy(true);
    const { error, needsConfirmation } = await signUp(clean, pw);
    setBusy(false);
    if (error) { showToast(error); return; }
    if (needsConfirmation) { setConfirmFor(clean.email); setEmail(clean.email); setPw(''); return; }
    showToast(`Bienvenue ${clean.firstName} !`);
    onDone('signup');
  };

  const submitLogin = async () => {
    setTried(true);
    if (busy || !EMAIL_RE.test(email.trim()) || !pw) return;
    setBusy(true);
    const err = await signIn(email, pw);
    setBusy(false);
    setLoginError(err);
    if (err) return;
    showToast('Te revoilà !');
    onDone('login');
  };

  const forgot = async () => {
    if (!EMAIL_RE.test(email.trim())) { showToast("Indique d'abord ton e-mail"); return; }
    const err = await sendPasswordReset(email);
    showToast(err ?? `Un lien pour choisir un nouveau mot de passe a été envoyé à ${email.trim()}`);
  };

  if (confirmFor) {
    return (
      <View style={{ gap: 18 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accent2_200, alignItems: 'center', justifyContent: 'center' }}>
          <MailCheck size={40} strokeWidth={ICON_STROKE} color={colors.accent2_800} />
        </View>
        <H size={32}>Vérifie ta boîte mail</H>
        <Txt color={colors.neutral800}>On t'a envoyé un lien à <Txt weight="semi">{confirmFor}</Txt>. Clique dessus pour activer ton compte, puis reviens ici pour te connecter.</Txt>
        <Txt size={13} color={colors.neutral700}>Rien reçu ? Regarde dans les spams ou les promotions.</Txt>
        <PrimaryButton label="J'ai confirmé, me connecter" height={56} onPress={() => { setConfirmFor(null); switchTo('login'); }} />
      </View>
    );
  }

  return (
    <View style={{ gap: 18 }}>
      <View style={{ gap: 8 }}>
        <H size={34}>{mode === 'signup' ? 'Crée ton compte' : 'Te revoilà !'}</H>
        <Txt color={colors.neutral800}>
          {mode === 'signup'
            ? 'Pour acheter, vendre et discuter avec les autres parents en toute confiance. Ça prend une minute.'
            : 'Connecte-toi avec ton e-mail et ton mot de passe.'}
        </Txt>
      </View>
      <Segmented options={[['signup', 'Créer un compte'], ['login', "J'ai déjà un compte"]]} value={mode} onChange={switchTo} />

      {mode === 'signup' ? (
        <>
          <AccountFields a={a} onChange={(p) => setA({ ...a, ...p })} errors={tried ? errors : {}} />
          <PasswordField value={pw} onChangeText={setPw} error={tried ? pwError : undefined} isNew />
          <Pressable onPress={() => setTerms(!terms)} accessibilityRole="checkbox" accessibilityState={{ checked: terms }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: tried && !terms ? colors.accent700 : terms ? colors.accent2_600 : colors.neutral500, backgroundColor: terms ? colors.accent2_600 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {terms && <Check size={16} strokeWidth={3} color={colors.neutral100} />}
            </View>
            <Txt size={14} style={{ flex: 1 }}>J'accepte les conditions d'utilisation et la politique de confidentialité de Pimou.</Txt>
          </Pressable>
          <PrimaryButton label={busy ? 'Création du compte…' : 'Créer mon compte'} height={56} onPress={submitSignup} disabledLook={busy} />
        </>
      ) : (
        <>
          <Field label="E-mail" value={email} onChangeText={(t) => { setEmail(t.trim()); setLoginError(null); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={tried && !EMAIL_RE.test(email.trim()) ? 'Une adresse e-mail valide' : undefined} />
          <PasswordField value={pw} onChangeText={(t) => { setPw(t); setLoginError(null); }} error={loginError ?? (tried && !pw ? 'Ton mot de passe' : undefined)} />
          <LinkButton label="Mot de passe oublié ?" size={13} onPress={forgot} style={{ alignSelf: 'flex-start' }} />
          <PrimaryButton label={busy ? 'Connexion…' : 'Me connecter'} height={56} onPress={submitLogin} disabledLook={busy} />
        </>
      )}
      {busy && <ActivityIndicator color={colors.accent} />}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Check size={14} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
        <Txt size={12} color={colors.neutral700}>Tes informations restent privées et ne sont jamais revendues.</Txt>
      </View>
    </View>
  );
}
