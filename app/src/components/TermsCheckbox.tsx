import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { colors } from '../theme/tokens';
import { LinkButton, Txt } from './ui';

/** "J'ai au moins 18 ans et j'accepte…", with links to read both texts. `error`: tried to go on without it. */
export function TermsCheckbox({ on, onChange, error }: { on: boolean; onChange: (on: boolean) => void; error?: boolean }) {
  return (
    <View style={{ gap: 10 }}>
      <Pressable onPress={() => onChange(!on)} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <View style={{ width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: error && !on ? colors.accent700 : on ? colors.accent2_600 : colors.neutral500, backgroundColor: on ? colors.accent2_600 : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {on && <Check size={16} strokeWidth={3} color={colors.neutral100} />}
        </View>
        <Txt size={14} style={{ flex: 1 }}>J'ai au moins 18 ans et j'accepte les conditions d'utilisation et la politique de confidentialité de Pimou.</Txt>
      </Pressable>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingLeft: 38 }}>
        <LinkButton label="Lire les conditions" size={13} onPress={() => router.push('/legal/cgu')} />
        <LinkButton label="Lire la confidentialité" size={13} onPress={() => router.push('/legal/confidentialite')} />
      </View>
    </View>
  );
}
