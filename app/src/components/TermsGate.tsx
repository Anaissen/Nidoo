import { usePathname } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LEGAL } from '../data/legal';
import { signOut } from '../lib/backend';
import { acceptTerms } from '../lib/terms';
import { useStore } from '../store/useStore';
import { colors, shadows } from '../theme/tokens';
import { TermsCheckbox } from './TermsCheckbox';
import { H, LinkButton, PrimaryButton, Txt } from './ui';

/** Over the whole app, until a logged-in parent accepts the current CGU (accounts from before, or new texts). */
export function TermsGate() {
  const show = useStore((s) => s.signedIn && s.termsToAccept);
  const showToast = useStore((s) => s.showToast);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [on, setOn] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  // Out of the way while the texts themselves are being read, or a new password typed.
  if (!show || pathname.startsWith('/legal') || pathname === '/new-password') return null;

  const go = async () => {
    setTried(true);
    if (!on) { showToast('Coche la case pour continuer'); return; }
    if (busy) return;
    setBusy(true);
    const err = await acceptTerms();
    setBusy(false);
    showToast(err ?? 'Merci !');
  };

  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim, justifyContent: 'flex-end' }}>
      <View style={{ backgroundColor: colors.bg, borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 24, paddingBottom: Math.max(insets.bottom, 12) + 16, gap: 16, boxShadow: shadows.lg }}>
        <H size={26}>Nos conditions d'utilisation</H>
        <Txt color={colors.neutral800}>
          Pour continuer à utiliser Pimou, lis et accepte nos conditions d'utilisation et notre politique de confidentialité (version du {LEGAL.updated}).
        </Txt>
        <TermsCheckbox on={on} onChange={setOn} error={tried} />
        <PrimaryButton label={busy ? 'Un instant…' : 'Continuer'} height={56} onPress={go} disabledLook={busy} />
        <LinkButton label="Je ne suis pas d'accord : me déconnecter" size={13} color={colors.neutral700} onPress={() => void signOut()} style={{ alignSelf: 'center' }} />
      </View>
    </View>
  );
}
