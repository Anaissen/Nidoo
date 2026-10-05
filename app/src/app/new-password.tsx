import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { PasswordField } from '../components/AccountForm';
import { Screen } from '../components/Screen';
import { H, PrimaryButton, Txt } from '../components/ui';
import { MIN_PASSWORD } from '../lib/account';
import { setNewPassword } from '../lib/backend';
import { useStore } from '../store/useStore';
import { colors } from '../theme/tokens';

/** Opened from the "mot de passe oublié" e-mail link. */
export default function NewPassword() {
  const showToast = useStore((s) => s.showToast);
  const [pw, setPw] = useState('');
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const error = pw.length < MIN_PASSWORD ? `Au moins ${MIN_PASSWORD} caractères` : undefined;

  const save = async () => {
    setTried(true);
    if (error || busy) return;
    setBusy(true);
    const err = await setNewPassword(pw);
    setBusy(false);
    if (err) { showToast(err); return; }
    showToast('Nouveau mot de passe enregistré ✓');
    router.replace('/home');
  };

  return (
    <Screen keyboard contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 18, paddingTop: 24 }}>
        <H size={32}>Choisis un nouveau mot de passe</H>
        <Txt color={colors.neutral800}>Tu l'utiliseras pour te connecter à Pimou sur tous tes appareils.</Txt>
        <PasswordField label="Nouveau mot de passe" value={pw} onChangeText={setPw} error={tried ? error : undefined} isNew />
        <PrimaryButton label={busy ? 'Enregistrement…' : 'Enregistrer'} height={56} onPress={save} disabledLook={busy} />
      </View>
    </Screen>
  );
}
