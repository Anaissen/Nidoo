import { Check } from 'lucide-react-native';
import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { colors } from '../theme/tokens';
import { Txt } from './ui';

/** Bordered choice row on neutral-100: accent border when selected (delivery, payment). */
export function OptionCard({ on, onPress, title, sub, right, control }: {
  on: boolean; onPress: () => void; title: string; sub?: string; right?: ReactNode; control: 'radio' | 'check' | 'radio-inline';
}) {
  const radio = (
    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? colors.accent : colors.neutral400, alignItems: 'center', justifyContent: 'center' }}>
      {on && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
    </View>
  );
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 24,
        borderWidth: 2, borderColor: on ? colors.accent : 'transparent', backgroundColor: pressed ? colors.neutral200 : colors.neutral100,
      })}
    >
      {control !== 'check' && radio}
      {control === 'radio-inline' ? (
        <Txt weight="bold" style={{ flex: 1 }}>{title}</Txt>
      ) : (
        <View style={{ flex: 1 }}>
          <Txt weight="bold">{title}</Txt>
          {sub ? <Txt size={13} color={colors.neutral700}>{sub}</Txt> : null}
        </View>
      )}
      {control === 'radio-inline' && sub ? <Txt size={13} color={colors.neutral700}>{sub}</Txt> : null}
      {right}
      {control === 'check' && (
        <View style={{ width: 26, height: 26, borderRadius: 8, backgroundColor: on ? colors.accent : colors.neutral300, alignItems: 'center', justifyContent: 'center' }}>
          <Check size={15} strokeWidth={3.5} color={colors.bg} />
        </View>
      )}
    </Pressable>
  );
}
