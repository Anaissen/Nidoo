import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AccountFields } from '../components/AccountForm';
import { BackHeader, BottomBar, Screen } from '../components/Screen';
import { OutlineButton, PrimaryButton, Txt } from '../components/ui';
import { Account, accountErrors } from '../lib/account';
import { accountOf, useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

/** "Mes informations": edit name, contact and address; log out. */
export default function AccountScreen() {
  const saved = useStore(accountOf);
  const set = useStore((s) => s.set);
  const signOut = useStore((s) => s.signOut);
  const showToast = useStore((s) => s.showToast);
  const [a, setA] = useState<Account>(saved);
  const [tried, setTried] = useState(false);
  const errors = accountErrors(a);

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) { showToast('Vérifie les champs en rouge'); return; }
    set({ account: { ...a, email: a.email.trim().toLowerCase(), firstName: a.firstName.trim(), lastName: a.lastName.trim() } });
    showToast('Informations enregistrées ✓');
    router.back();
  };

  const logout = () => {
    signOut();
    router.dismissAll();
    router.replace('/home');
    showToast('Tu es déconnecté·e. À bientôt !');
  };

  return (
    <Screen keyboard contentStyle={{ paddingHorizontal: 20 }} bottom={<BottomBar><PrimaryButton label="Enregistrer" onPress={save} style={{ flex: 1 }} /></BottomBar>}>
      <View style={{ gap: 18, paddingTop: 4 }}>
        <BackHeader title="Mes informations" />
        <AccountFields a={a} onChange={(p) => setA({ ...a, ...p })} errors={tried ? errors : {}} />
        <Txt size={13} color={colors.neutral700}>Les autres parents voient seulement ton prénom, l'initiale de ton nom et ta ville.</Txt>
        <OutlineButton label="Se déconnecter" onPress={logout} />
      </View>
    </Screen>
  );
}
