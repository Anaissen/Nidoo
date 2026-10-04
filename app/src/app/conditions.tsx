import { useLocalSearchParams } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { View } from 'react-native';

import { BackHeader, Screen } from '../components/Screen';
import { H, Stripes, Txt } from '../components/ui';
import { CONDITION_GUIDE } from '../data/catalog';
import { colors, shadows } from '../theme/tokens';

/** Guide des états. `?focus=<état>` highlights one (opened from a product's condition tag). */
export default function Conditions() {
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  return (
    <Screen contentStyle={{ paddingHorizontal: 20 }}>
      <View style={{ gap: 16, paddingTop: 4 }}>
        <BackHeader title="Guide des états" />
        <Txt color={colors.neutral800}>Pour que l'acheteur reçoive exactement ce qu'il imagine. En cas de doute, choisis l'état en dessous et montre le défaut en photo.</Txt>
        {CONDITION_GUIDE.map((c, i) => {
          const on = focus === c.name;
          return (
            <View key={c.name} style={{ padding: 16, borderRadius: 28, backgroundColor: colors.neutral100, gap: 12, borderWidth: 2, borderColor: on ? colors.accent : 'transparent', boxShadow: on ? shadows.md : undefined }}>
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                <Stripes tones={c.tones} label="photo exemple" labelPos={{ left: 8, bottom: 8 }} style={{ width: 84, height: 84, borderRadius: 22 }} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt size={11} weight="bold" color={colors.accent700} style={{ letterSpacing: 0.9 }}>{'●'.repeat(4 - i)}{'○'.repeat(i)}</Txt>
                  <H size={20} lh={1.15}>{c.name}</H>
                  <Txt size={14} color={colors.neutral800}>{c.short}</Txt>
                </View>
              </View>
              <View style={{ gap: 6 }}>
                {c.ok.map((t) => (
                  <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <Check size={16} strokeWidth={3} color={colors.accent2_700} /><Txt size={14} style={{ flex: 1 }}>{t}</Txt>
                  </View>
                ))}
                {c.no.map((t) => (
                  <View key={t} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                    <X size={16} strokeWidth={3} color={colors.accent700} /><Txt size={14} color={colors.neutral700} style={{ flex: 1 }}>{t}</Txt>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}
