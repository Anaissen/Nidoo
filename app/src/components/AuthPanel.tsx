import { Check } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Account, accountErrors, EMAIL_RE, EMPTY_ACCOUNT, MIN_PASSWORD } from '../lib/account';
import { useStore } from '../store/useStore';
import { colors, ICON_STROKE } from '../theme/tokens';
import { AccountFields, Field, PasswordField } from './AccountForm';
import { H, LinkButton, PrimaryButton, Segmented, Txt } from './ui';

export type AuthMode = 'signup' | 'login';

/** "Crée ton compte" / "Me connecter": the sign-up form, or e-mail + password to log back in. */
export function AuthPanel({ initialMode = 'signup', onDone }: { initialMode?: AuthMode; onDone: (mode: AuthMode) => void }) {
  const signUp = useStore((s) => s.signUp);
  const signIn = useStore((s) => s.signIn);
  const showToast = useStore((s) => s.showToast);
  const saved = useStore((s) => s.account);

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [a, setA] = useState<Account>(EMPTY_ACCOUNT);
  const [email, setEmail] = useState(saved?.email ?? '');
  const [pw, setPw] = useState('');
  const [terms, setTerms] = useState(false);
  const [tried, setTried] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const errors = accountErrors(a);
  const pwError = pw.length < MIN_PASSWORD ? `Au moins ${MIN_PASSWORD} caractères` : undefined;
  const switchTo = (m: AuthMode) => { setMode(m); setTried(false); setLoginError(null); };

  const submitSignup = () => {
    setTried(true);
    if (Object.keys(errors).length || pwError || !terms) { showToast(!terms && !Object.keys(errors).length && !pwError ? 'Accepte les conditions pour continuer' : 'Vérifie les champs en rouge'); return; }
    signUp({ ...a, email: a.email.trim().toLowerCase(), firstName: a.firstName.trim(), lastName: a.lastName.trim() }, pw);
    showToast(`Bienvenue ${a.firstName.trim()} !`);
    onDone('signup');
  };

  const submitLogin = () => {
    setTried(true);
    if (!EMAIL_RE.test(email.trim()) || !pw) return;
    const err = signIn(email, pw);
    setLoginError(err);
    if (err) return;
    showToast('Te revoilà !');
    onDone('login');
  };

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
          <PrimaryButton label="Créer mon compte" height={56} onPress={submitSignup} />
        </>
      ) : (
        <>
          <Field label="E-mail" value={email} onChangeText={(t) => { setEmail(t.trim()); setLoginError(null); }} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={tried && !EMAIL_RE.test(email.trim()) ? 'Une adresse e-mail valide' : undefined} />
          <PasswordField value={pw} onChangeText={(t) => { setPw(t); setLoginError(null); }} error={loginError ?? (tried && !pw ? 'Ton mot de passe' : undefined)} />
          <LinkButton label="Mot de passe oublié ?" size={13} onPress={() => showToast(EMAIL_RE.test(email.trim()) ? `Un lien a été envoyé à ${email.trim()}` : "Indique d'abord ton e-mail")} style={{ alignSelf: 'flex-start' }} />
          <PrimaryButton label="Me connecter" height={56} onPress={submitLogin} />
        </>
      )}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
        <Check size={14} strokeWidth={ICON_STROKE} color={colors.accent2_700} />
        <Txt size={12} color={colors.neutral700}>Tes informations restent privées et ne sont jamais revendues.</Txt>
      </View>
    </View>
  );
}
