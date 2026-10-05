import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AccountFields } from '../components/AccountForm';
import { BackHeader, BottomBar, Screen } from '../components/Screen';
import { OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { Account, accountErrors } from '../lib/account';
import { saveAccount, signOut } from '../lib/backend';
import { accountOf, useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

/** "Mes informations": edit name, contact and address; log out. */
export default function AccountScreen() {
  const saved = useStore(accountOf);
  const showToast = useStore((s) => s.showToast);
  const [a, setA] = useState<Account>(saved);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const errors = accountErrors(a);

  const save = async () => {
    setTried(true);
    if (busy) return;
    if (Object.keys(errors).length) { showToast('Vérifie les champs en rouge'); return; }
    setBusy(true);
    const { error, emailPending } = await saveAccount({ ...a, email: a.email.trim().toLowerCase(), firstName: a.firstName.trim(), lastName: a.lastName.trim() });
    setBusy(false);
    if (error) { showToast(error); return; }
    showToast(emailPending ? 'Enregistré. Confirme ta nouvelle adresse grâce au lien reçu par e-mail.' : 'Informations enregistrées ✓');
    router.back();
  };

  const logout = async () => {
    await signOut();
    router.dismissAll();
    router.replace('/home');
    showToast('Tu es déconnecté·e. À bientôt !');
  };

  return (
    <Screen keyboard contentStyle={{ paddingHorizontal: 20 }} bottom={<BottomBar><PrimaryButton label={busy ? 'Enregistrement…' : 'Enregistrer'} onPress={save} disabledLook={busy} style={{ flex: 1 }} /></BottomBar>}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Mes informations" />
        <AccountFields a={a} onChange={(p) => setA({ ...a, ...p })} errors={tried ? errors : {}} />
        <Txt size={13} color={colors.neutral700}>Les autres parents voient seulement ton prénom, l'initiale de ton nom et ta ville.</Txt>
        <OutlineButton label="Se déconnecter" onPress={logout} />
      </View>
    </Screen>
  );
}
