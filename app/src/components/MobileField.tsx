import { TextInput, View } from 'react-native';

import { colors, fonts } from '../theme/tokens';
import { Txt } from './ui';

/** "Ton numéro de portable", asked only when a parcel needs it (labels carry it, the carrier texts the buyer). */
export function MobileField({ value, onChange, why, error }: { value: string; onChange: (t: string) => void; why: string; error?: boolean }) {
  return (
    <View style={{ gap: 8, padding: 14, borderRadius: 24, backgroundColor: colors.accent100 }}>
      <Txt size={14} weight="semi" color={colors.accent800}>Ton numéro de portable</Txt>
      <Txt size={12} color={colors.accent800}>{why} Il n'est jamais montré aux autres parents.</Txt>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9 +]/g, '').slice(0, 17))}
        placeholder="06 12 34 56 78"
        placeholderTextColor={colors.neutral600}
        keyboardType="phone-pad"
        autoComplete="tel"
        accessibilityLabel="Numéro de portable"
        style={{ height: 48, borderRadius: 999, borderWidth: 1, borderColor: error ? colors.accent700 : colors.divider, backgroundColor: colors.neutral100, paddingHorizontal: 18, fontFamily: fonts.body, fontSize: 15, color: colors.text, outlineWidth: 0 }}
      />
      {error && <Txt size={12} color={colors.accent700}>Un numéro de portable français (06 ou 07)</Txt>}
    </View>
  );
}
