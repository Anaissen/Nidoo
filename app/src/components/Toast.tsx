import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStore } from '../store/useStore';
import { colors, shadows } from '../theme/tokens';
import { Txt } from './ui';

/** Ink pill floating above the bottom bars (prototype: bottom 118px on an 874px device). */
export function Toast() {
  const toast = useStore((s) => s.toast);
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 84, zIndex: 40,
        paddingVertical: 14, paddingHorizontal: 18, borderRadius: 999, backgroundColor: colors.text, boxShadow: shadows.lg,
      }}
    >
      <Txt size={14} weight="semi" color={colors.bg} style={{ textAlign: 'center' }}>{toast}</Txt>
    </View>
  );
}
